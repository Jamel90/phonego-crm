const functions = require('firebase-functions')
const admin = require('firebase-admin')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const cors = require('cors')({ origin: true })

admin.initializeApp()

// Importer les fonctions d'authentification
const auth = require('./src/auth');

// Exporter les fonctions d'authentification
exports.syncUserClaims = auth.syncUserClaims;
exports.createUserDocument = auth.createUserDocument;
exports.deleteUserDocument = auth.deleteUserDocument;

// Fonction utilitaire pour vérifier si un utilisateur est admin
async function isUserAdmin(uid) {
  const userDoc = await admin.firestore().collection('users').doc(uid).get()
  return userDoc.exists && userDoc.data().role === 'admin'
}

// Fonction utilitaire pour vérifier l'abonnement
async function checkSubscriptionAccess(uid) {
  // Vérifier d'abord si l'utilisateur est admin
  const isAdmin = await isUserAdmin(uid)
  if (isAdmin) {
    return true // Les admins ont toujours accès
  }

  // Pour les utilisateurs normaux, vérifier l'abonnement
  const userDoc = await admin.firestore().collection('users').doc(uid).get()
  const userData = userDoc.data()
  
  if (!userData?.subscription) {
    throw new functions.https.HttpsError('permission-denied', 'Aucun abonnement trouvé pour l\'utilisateur')
  }

  if (userData.subscription.status !== 'active') {
    throw new functions.https.HttpsError('permission-denied', 'Abonnement inactif')
  }

  return true
}

// Créer une session de paiement Stripe Checkout
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  try {
    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Non autorisé');
    }

    await checkSubscriptionAccess(context.auth.uid)

    const { priceId, successUrl, cancelUrl } = data;
    const uid = context.auth.uid;

    // Récupérer l'utilisateur
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    let stripeCustomerId = userData?.stripeCustomerId;

    // Créer le client Stripe si nécessaire
    if (!stripeCustomerId) {
      const user = await admin.auth().getUser(uid);
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          firebaseUID: uid
        }
      });
      stripeCustomerId = customer.id;

      // Sauvegarder l'ID client Stripe
      await admin.firestore().collection('users').doc(uid).update({
        stripeCustomerId: stripeCustomerId
      });
    }

    // Créer la session de paiement
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error('Erreur lors de la création de la session:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
})

// Créer une session du portail client Stripe
exports.createPortalSession = functions.https.onCall(async (data, context) => {
  try {
    // Vérifier l'authentification
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Non autorisé');
    }

    await checkSubscriptionAccess(context.auth.uid)

    const { returnUrl } = data;
    const uid = context.auth.uid;

    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;

    if (!stripeCustomerId) {
      throw new functions.https.HttpsError('failed-precondition', 'Aucun client Stripe trouvé');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Erreur lors de la création de la session du portail:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
})

// Webhook Stripe pour gérer les événements d'abonnement
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    console.error('Erreur de signature webhook:', error)
    res.status(400).json({ error: { message: error.message } })
    return
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object
        const customerId = subscription.customer
        const status = subscription.status
        const priceId = subscription.items.data[0].price.id

        // Trouver l'utilisateur par l'ID client Stripe
        const userSnapshot = await admin.firestore()
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .get()

        if (!userSnapshot.empty) {
          const userId = userSnapshot.docs[0].id
          await admin.firestore().collection('users').doc(userId).update({
            subscription: {
              status,
              priceId,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end
            }
          })
        }
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object
        const deletedCustomerId = deletedSubscription.customer

        const deletedUserSnapshot = await admin.firestore()
          .collection('users')
          .where('stripeCustomerId', '==', deletedCustomerId)
          .get()

        if (!deletedUserSnapshot.empty) {
          const userId = deletedUserSnapshot.docs[0].id
          await admin.firestore().collection('users').doc(userId).update({
            subscription: {
              status: 'canceled',
              priceId: null,
              currentPeriodEnd: null,
              cancelAtPeriodEnd: false
            }
          })
        }
        break
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error)
    res.status(500).json({ error: { message: error.message } })
  }
})

// Nouvelle fonction callable pour récupérer le statut d'un abonnement
exports.getSubscriptionStatusV2 = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Non autorisé')
    }

    const uid = context.auth.uid
    
    // Vérifier si l'utilisateur est admin
    const isAdmin = await isUserAdmin(uid)
    if (isAdmin) {
      return { subscription: { status: 'active', role: 'admin' } }
    }

    // Pour les utilisateurs normaux, récupérer leur abonnement
    const userDoc = await admin.firestore().collection('users').doc(uid).get()
    const userData = userDoc.data()

    if (!userData?.subscription) {
      return { subscription: null }
    }

    return { subscription: userData.subscription }
  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error)
    throw new functions.https.HttpsError('internal', error.message)
  }
})

// Garder l'ancienne fonction avec CORS
exports.getSubscriptionStatus = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { subscriptionId } = req.query

      // Vérifier l'authentification
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: { message: 'Non autorisé' } })
        return
      }

      const idToken = authHeader.split('Bearer ')[1]
      const decodedToken = await admin.auth().verifyIdToken(idToken)

      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      res.json(subscription)
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error)
      res.status(500).json({ error: { message: error.message } })
    }
  })
})

// Nouvelle fonction callable pour annuler un abonnement
exports.cancelSubscriptionV2 = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Non autorisé')
    }

    await checkSubscriptionAccess(context.auth.uid)

    const uid = context.auth.uid
    const userDoc = await admin.firestore().collection('users').doc(uid).get()
    const userData = userDoc.data()

    if (!userData?.subscription?.id) {
      throw new functions.https.HttpsError('failed-precondition', 'Aucun abonnement actif trouvé')
    }

    const subscription = await stripe.subscriptions.update(userData.subscription.id, {
      cancel_at_period_end: true
    })

    await admin.firestore().collection('users').doc(uid).update({
      'subscription.cancelAtPeriodEnd': true
    })

    return { subscription }
  } catch (error) {
    console.error('Erreur lors de l\'annulation:', error)
    throw new functions.https.HttpsError('internal', error.message)
  }
})

// Nouvelle fonction callable pour créer une session de paiement
exports.createCheckoutSessionV2 = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Non autorisé')
    }

    await checkSubscriptionAccess(context.auth.uid)

    const { priceId, successUrl, cancelUrl } = data
    const uid = context.auth.uid

    // Récupérer l'utilisateur
    const userDoc = await admin.firestore().collection('users').doc(uid).get()
    const userData = userDoc.data()
    let stripeCustomerId = userData?.stripeCustomerId

    // Créer le client Stripe si nécessaire
    if (!stripeCustomerId) {
      const user = await admin.auth().getUser(uid)
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          firebaseUID: uid
        }
      })
      stripeCustomerId = customer.id

      // Sauvegarder l'ID client Stripe
      await admin.firestore().collection('users').doc(uid).update({
        stripeCustomerId: stripeCustomerId
      })
    }

    // Créer la session de paiement
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    })

    return { sessionId: session.id }
  } catch (error) {
    console.error('Erreur lors de la création de la session:', error)
    throw new functions.https.HttpsError('internal', error.message)
  }
})

// Nouvelle fonction callable pour créer une session de portail
exports.createPortalSessionV2 = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Non autorisé')
    }

    await checkSubscriptionAccess(context.auth.uid)

    const { returnUrl } = data
    const uid = context.auth.uid

    // Récupérer l'utilisateur
    const userDoc = await admin.firestore().collection('users').doc(uid).get()
    const userData = userDoc.data()

    if (!userData?.stripeCustomerId) {
      throw new functions.https.HttpsError('failed-precondition', 'Aucun client Stripe trouvé')
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: returnUrl,
    })

    return { url: session.url }
  } catch (error) {
    console.error('Erreur lors de la création de la session du portail:', error)
    throw new functions.https.HttpsError('internal', error.message)
  }
})

// Garder l'ancienne fonction avec CORS
exports.createPortalSession = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { customerId, returnUrl } = req.body

      // Vérifier l'authentification
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: { message: 'Non autorisé' } })
        return
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      })

      res.json({ url: session.url })
    } catch (error) {
      console.error('Erreur lors de la création de la session du portail:', error)
      res.status(500).json({ error: { message: error.message } })
    }
  })
})

// Ajouter CORS aux fonctions HTTP existantes
exports.createCheckoutSession = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { priceId, customerId, successUrl, cancelUrl } = req.body

      // Vérifier l'authentification
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: { message: 'Non autorisé' } })
        return
      }

      const idToken = authHeader.split('Bearer ')[1]
      const decodedToken = await admin.auth().verifyIdToken(idToken)
      const uid = decodedToken.uid

      // Créer ou récupérer le client Stripe
      let stripeCustomerId = customerId
      if (!stripeCustomerId) {
        const user = await admin.auth().getUser(uid)
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            firebaseUID: uid
          }
        })
        stripeCustomerId = customer.id

        // Sauvegarder l'ID client Stripe dans Firestore
        await admin.firestore().collection('users').doc(uid).update({
          stripeCustomerId: stripeCustomerId
        })
      }

      // Créer la session de paiement
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        customer_update: {
          address: 'auto',
          name: 'auto',
        },
      })

      res.json({ id: session.id })
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error)
      res.status(500).json({ error: { message: error.message } })
    }
  })
})

// Garder les autres fonctions HTTP avec CORS
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  // Le webhook Stripe n'a pas besoin de CORS
  const signature = req.headers['stripe-signature']
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    // Traiter l'événement
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object
        const customerId = subscription.customer
        const userSnapshot = await admin.firestore()
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .get()

        if (!userSnapshot.empty) {
          const userId = userSnapshot.docs[0].id
          await admin.firestore().collection('users').doc(userId).update({
            subscription: {
              id: subscription.id,
              status: subscription.status,
              currentPeriodEnd: admin.firestore.Timestamp.fromDate(
                new Date(subscription.current_period_end * 1000)
              ),
              cancelAtPeriodEnd: subscription.cancel_at_period_end
            }
          })
        }
        break
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Erreur dans le webhook:', error)
    res.status(400).send(`Webhook Error: ${error.message}`)
  }
})
