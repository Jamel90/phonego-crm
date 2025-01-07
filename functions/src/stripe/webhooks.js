const functions = require('firebase-functions');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

const handleSubscriptionCreated = async (subscription) => {
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error('Pas d\'userId trouvé dans les métadonnées');
    return;
  }

  await admin.firestore().collection('users').doc(userId).update({
    subscription: {
      id: subscription.id,
      status: subscription.status,
      priceId: subscription.items.data[0].price.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const handleSubscriptionUpdated = async (subscription) => {
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error('Pas d\'userId trouvé dans les métadonnées');
    return;
  }

  await admin.firestore().collection('users').doc(userId).update({
    'subscription.status': subscription.status,
    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
    'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const handleSubscriptionDeleted = async (subscription) => {
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error('Pas d\'userId trouvé dans les métadonnées');
    return;
  }

  await admin.firestore().collection('users').doc(userId).update({
    'subscription.status': 'canceled',
    'subscription.cancelAtPeriodEnd': true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Erreur de signature webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Event non géré: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    res.status(500).send('Erreur lors du traitement du webhook');
  }
});
