import { loadStripe } from '@stripe/stripe-js'

let stripePromise = null

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  }
  return stripePromise
}

export const createCheckoutSession = async (priceId, customerId = null) => {
  try {
    const stripe = await getStripe()
    
    // Créer la session de paiement via Firebase Functions
    const response = await fetch('https://us-central1-phonegocrm.cloudfunctions.net/createCheckoutSession', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        customerId,
        successUrl: `${window.location.origin}/billing/success`,
        cancelUrl: `${window.location.origin}/billing/cancel`,
      }),
    })

    const session = await response.json()

    if (session.error) {
      console.error('Erreur lors de la création de la session:', session.error)
      throw new Error(session.error.message)
    }

    // Rediriger vers Checkout
    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    })

    if (result.error) {
      throw new Error(result.error.message)
    }
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error)
    throw error
  }
}

export const createPortalSession = async (customerId) => {
  try {
    const response = await fetch('https://us-central1-phonegocrm.cloudfunctions.net/createPortalSession', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        returnUrl: `${window.location.origin}/billing`,
      }),
    })

    const session = await response.json()

    if (session.error) {
      throw new Error(session.error.message)
    }

    // Rediriger vers le portail client
    window.location.href = session.url
  } catch (error) {
    console.error('Erreur lors de la création de la session du portail:', error)
    throw error
  }
}

export const getSubscriptionStatus = async (subscriptionId) => {
  try {
    const response = await fetch(`https://us-central1-phonegocrm.cloudfunctions.net/getSubscriptionStatus?subscriptionId=${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la récupération du statut de l\'abonnement:', error)
    throw error
  }
}

export const cancelSubscription = async (subscriptionId) => {
  try {
    const response = await fetch('https://us-central1-phonegocrm.cloudfunctions.net/cancelSubscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriptionId,
      }),
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error.message)
    }

    return data
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'abonnement:', error)
    throw error
  }
}
