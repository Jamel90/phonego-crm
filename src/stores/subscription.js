import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/firebase'
import { doc, getDoc } from 'firebase/firestore'

export const useSubscriptionStore = defineStore('subscription', () => {
  const subscription = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isActive = computed(() => {
    if (!subscription.value) return false
    return subscription.value.status === 'active'
  })

  const hasFeature = (featureName) => {
    if (!subscription.value || !subscription.value.features) return false
    return subscription.value.features.includes(featureName)
  }

  async function fetchSubscription(userId) {
    if (!userId) {
      subscription.value = null
      return null
    }
    
    try {
      loading.value = true
      error.value = null
      
      const docRef = doc(db, 'subscriptions', userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        subscription.value = {
          id: docSnap.id,
          ...docSnap.data()
        }
      } else {
        // Si pas d'abonnement trouvé, créer un abonnement par défaut
        subscription.value = {
          id: userId,
          status: 'inactive',
          features: ['basic'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
      return subscription.value
    } catch (err) {
      console.error('Error fetching subscription:', err)
      if (err.code === 'permission-denied') {
        subscription.value = {
          id: userId,
          status: 'inactive',
          features: ['basic'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        return subscription.value
      }
      error.value = 'Erreur lors du chargement de l\'abonnement'
      throw err
    } finally {
      loading.value = false
    }
  }

  function reset() {
    subscription.value = null
    loading.value = false
    error.value = null
  }

  return {
    subscription,
    loading,
    error,
    isActive,
    hasFeature,
    fetchSubscription,
    reset
  }
})
