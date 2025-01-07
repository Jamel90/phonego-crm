const functions = require('firebase-functions')
const stripe = require('stripe')(functions.config().stripe.secret_key)
const cors = require('cors')({ origin: true })

// Vérification de la connexion Stripe
exports.checkConnection = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const account = await stripe.accounts.retrieve()
      res.json({ 
        connected: true, 
        account: {
          id: account.id,
          business_profile: account.business_profile,
          charges_enabled: account.charges_enabled,
          details_submitted: account.details_submitted
        }
      })
    } catch (error) {
      console.error('Erreur Stripe:', error)
      res.status(500).json({ 
        connected: false, 
        error: error.message 
      })
    }
  })
})

// Récupération d'un produit
exports.getProduct = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const productId = req.params.productId
      const product = await stripe.products.retrieve(productId)
      res.json(product)
    } catch (error) {
      console.error('Erreur Stripe:', error)
      res.status(500).json({ error: error.message })
    }
  })
})

// Récupération d'un prix
exports.getPrice = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const priceId = req.params.priceId
      const price = await stripe.prices.retrieve(priceId)
      res.json(price)
    } catch (error) {
      console.error('Erreur Stripe:', error)
      res.status(500).json({ error: error.message })
    }
  })
})

// Récupération d'une session de paiement
exports.getSession = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const sessionId = req.params.sessionId
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription.default_payment_method']
      })
      res.json(session)
    } catch (error) {
      console.error('Erreur Stripe:', error)
      res.status(500).json({ error: error.message })
    }
  })
})

// Webhook Stripe
exports.webhook = functions.https.onRequest((req, res) => {
  const signature = req.headers['stripe-signature']
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      functions.config().stripe.webhook_secret
    )
    
    // Traitement des différents types d'événements
    switch (event.type) {
      case 'checkout.session.completed':
        // Traitement après un paiement réussi
        break
        
      case 'customer.subscription.updated':
        // Mise à jour d'un abonnement
        break
        
      case 'customer.subscription.deleted':
        // Suppression d'un abonnement
        break
        
      default:
        console.log(`Type d'événement non géré: ${event.type}`)
    }
    
    res.json({ received: true })
  } catch (error) {
    console.error('Erreur webhook Stripe:', error)
    res.status(400).json({ error: error.message })
  }
})
