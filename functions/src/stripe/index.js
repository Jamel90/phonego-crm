const functions = require('firebase-functions');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

exports.createStripeCustomer = functions.auth.user().onCreate(async (user) => {
  try {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.uid
      }
    });

    await admin.firestore().collection('users').doc(user.uid).update({
      stripeCustomerId: customer.id
    });

    return customer;
  } catch (error) {
    console.error('Erreur lors de la création du client Stripe:', error);
    throw error;
  }
});

exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Vous devez être connecté');
  }

  const { priceId } = data;
  const userId = context.auth.uid;

  try {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: userData.stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${data.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: data.cancelUrl,
      metadata: {
        userId: userId
      }
    });

    return { sessionId: session.id };
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.cancelSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Vous devez être connecté');
  }

  try {
    const userDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();

    if (!userData.subscription?.id) {
      throw new functions.https.HttpsError('failed-precondition', 'Aucun abonnement actif trouvé');
    }

    const subscription = await stripe.subscriptions.update(userData.subscription.id, {
      cancel_at_period_end: true
    });

    await admin.firestore().collection('users').doc(context.auth.uid).update({
      'subscription.cancelAtPeriodEnd': true
    });

    return { subscription };
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
