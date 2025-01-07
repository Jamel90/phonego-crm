import { loadStripe } from '@stripe/stripe-js'
import { servicesConfig } from '@/config/services.config'
import { db } from '@/firebase'
import { collection, doc, getDoc, setDoc, updateDoc, getDocs } from 'firebase/firestore'

let stripePromise = null

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  }
  return stripePromise
}

export const stripeService = {
  async checkConnection() {
    try {
      const response = await fetch(`${servicesConfig.apiBaseUrl}/stripe/connection`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erreur de connexion à Stripe')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur lors de la vérification de la connexion Stripe:', error)
      throw error
    }
  },

  async syncProducts() {
    try {
      // Récupérer tous les plans de Firestore
      const plansRef = collection(db, 'plans')
      const plansSnapshot = await getDocs(plansRef)
      const plans = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Pour chaque plan, synchroniser avec Stripe
      for (const plan of plans) {
        if (!plan.stripeProductId) continue

        const product = await this.getProduct(plan.stripeProductId)
        if (product) {
          // Mettre à jour le plan avec les informations Stripe
          const planRef = doc(db, 'plans', plan.id)
          await updateDoc(planRef, {
            stripePriceId: product.default_price,
            lastSyncedAt: new Date()
          })
        }
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation avec Stripe:', error)
      throw error
    }
  },

  async redirectToCheckout(priceId, userId) {
    try {
      const stripe = await getStripe()
      
      const { error } = await stripe.redirectToCheckout({
        lineItems: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`,
        clientReferenceId: userId,
      })

      if (error) {
        console.error('Erreur lors de la redirection vers Stripe:', error)
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du paiement:', error)
      throw error
    }
  },

  async handleSubscriptionSuccess(sessionId) {
    try {
      const response = await fetch(`${servicesConfig.apiBaseUrl}/stripe/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Session non trouvée')
      }

      const session = await response.json()
      
      // Mettre à jour l'abonnement de l'utilisateur
      const userRef = doc(db, 'users', session.client_reference_id)
      await updateDoc(userRef, {
        'subscription.status': 'active',
        'subscription.priceId': session.subscription.price.id,
        'subscription.productId': session.subscription.product.id,
        'subscription.currentPeriodEnd': new Date(session.subscription.current_period_end * 1000),
        'subscription.updatedAt': new Date()
      })

      return session
    } catch (error) {
      console.error('Erreur lors du traitement du succès de l\'abonnement:', error)
      throw error
    }
  },

  async getProduct(productId) {
    try {
      const response = await fetch(`${servicesConfig.apiBaseUrl}/stripe/products/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Produit non trouvé')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur lors de la récupération du produit:', error)
      throw error
    }
  },

  async getPrice(priceId) {
    try {
      const response = await fetch(`${servicesConfig.apiBaseUrl}/stripe/prices/${priceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Prix non trouvé')
      }

      return await response.json()
    } catch (error) {
      console.error('Erreur lors de la récupération du prix:', error)
      throw error
    }
  },

  async handleWebhook(event) {
    const { type, data } = event

    switch (type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(data.object)
        break

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancellation(data.object)
        break

      case 'invoice.payment_succeeded':
        await this.handlePaymentSuccess(data.object)
        break

      case 'invoice.payment_failed':
        await this.handlePaymentFailure(data.object)
        break
    }
  },

  async handleSubscriptionUpdate(subscription) {
    const userRef = doc(db, 'users', subscription.client_reference_id)
    await updateDoc(userRef, {
      'subscription.status': subscription.status,
      'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
      'subscription.updatedAt': new Date()
    })
  },

  async handleSubscriptionCancellation(subscription) {
    const userRef = doc(db, 'users', subscription.client_reference_id)
    await updateDoc(userRef, {
      'subscription.status': 'cancelled',
      'subscription.cancelledAt': new Date(),
      'subscription.updatedAt': new Date()
    })
  },

  async handlePaymentSuccess(invoice) {
    const userRef = doc(db, 'users', invoice.customer)
    await updateDoc(userRef, {
      'subscription.lastPayment': {
        amount: invoice.amount_paid,
        date: new Date(invoice.created * 1000),
        invoiceUrl: invoice.hosted_invoice_url
      }
    })
  },

  async handlePaymentFailure(invoice) {
    const userRef = doc(db, 'users', invoice.customer)
    await updateDoc(userRef, {
      'subscription.status': 'past_due',
      'subscription.lastFailedPayment': {
        amount: invoice.amount_due,
        date: new Date(invoice.created * 1000),
        reason: invoice.last_payment_error?.message
      }
    })
  }
}
