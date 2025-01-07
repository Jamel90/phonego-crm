import { getFunctions, httpsCallable } from 'firebase/functions'
import { getAuth } from 'firebase/auth'
import { db } from '@/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

const functions = getFunctions()
const createCheckoutSessionV2 = httpsCallable(functions, 'createCheckoutSessionV2')
const cancelSubscriptionV2 = httpsCallable(functions, 'cancelSubscriptionV2')
const createPortalSessionV2 = httpsCallable(functions, 'createPortalSessionV2')
const getSubscriptionStatusV2 = httpsCallable(functions, 'getSubscriptionStatusV2')

export const subscriptionService = {
  async startSubscription(priceId) {
    try {
      const { data } = await createCheckoutSessionV2({
        priceId,
        successUrl: `${window.location.origin}/billing/success`,
        cancelUrl: `${window.location.origin}/billing/cancel`,
      })
      
      return data.sessionId
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error)
      throw error
    }
  },

  async cancelSubscription() {
    try {
      const { data } = await cancelSubscriptionV2()
      return data.subscription
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error)
      throw error
    }
  },

  async redirectToPortal() {
    try {
      const { data } = await createPortalSessionV2({
        returnUrl: `${window.location.origin}/settings`
      })
      
      window.location.href = data.url
    } catch (error) {
      console.error('Erreur lors de la redirection vers le portail:', error)
      throw error
    }
  },

  async getSubscriptionStatus() {
    try {
      const { data } = await getSubscriptionStatusV2()
      return data.subscription
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error)
      throw error
    }
  },

  // Surveiller les changements d'abonnement en temps réel
  watchSubscription(callback) {
    const auth = getAuth()
    if (!auth.currentUser) return null

    const userDoc = doc(db, 'users', auth.currentUser.uid)
    return onSnapshot(userDoc, (doc) => {
      const userData = doc.data()
      callback(userData?.subscription || null)
    }, (error) => {
      console.error('Erreur lors de la surveillance de l\'abonnement:', error)
      callback(null)
    })
  },

  // Vérifier si l'utilisateur a un abonnement actif
  isSubscriptionActive(subscription) {
    if (!subscription) return false
    return subscription.status === 'active'
  },

  // Obtenir le plan actuel
  getCurrentPlan(subscription) {
    if (!subscription) return null
    return {
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      items: subscription.items?.data || []
    }
  }
}
