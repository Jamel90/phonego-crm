const admin = require('firebase-admin');
const stripeModule = require('./stripe');
const { stripeWebhook } = require('./stripe/webhooks');

admin.initializeApp();

// Export des fonctions Stripe
exports.createStripeCustomer = stripeModule.createStripeCustomer;
exports.createCheckoutSession = stripeModule.createCheckoutSession;
exports.cancelSubscription = stripeModule.cancelSubscription;
exports.stripeWebhook = stripeWebhook;
