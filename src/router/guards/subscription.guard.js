import { useSubscriptionStore } from '@/stores/subscription'
import { useAuthStore } from '@/stores/auth'
import { getAuth } from 'firebase/auth'

export async function subscriptionGuard(to, from, next) {
  // Si la route ne nécessite pas d'abonnement, continuer
  if (!to.meta.requiresSubscription) {
    return next()
  }

  const auth = getAuth()
  const user = auth.currentUser
  const authStore = useAuthStore()

  // Si l'utilisateur n'est pas connecté, rediriger vers la connexion
  if (!user) {
    return next('/login')
  }

  // Attendre que le rôle soit initialisé
  if (!authStore.initialized) {
    await authStore.initializeAuthState()
  }

  console.log('Current user role:', authStore.userRole)
  console.log('Is super admin?', authStore.isSuperAdmin)
  console.log('Is store admin?', authStore.isStoreAdmin)

  // Si l'utilisateur est super admin ou admin de boutique, autoriser l'accès sans vérifier l'abonnement
  if (authStore.isSuperAdmin || authStore.isStoreAdmin) {
    console.log('User is admin, allowing access')
    return next()
  }

  const subscriptionStore = useSubscriptionStore()
  
  try {
    await subscriptionStore.fetchSubscription(user.uid)
    
    if (!subscriptionStore.isActive) {
      console.log('Subscription not active, redirecting to subscription page')
      // Rediriger vers la page d'abonnement si l'abonnement n'est pas actif
      return next('/subscription')
    }

    // Si un feature spécifique est requis, vérifier qu'il est disponible
    const requiredFeature = to.meta.requiredFeature
    if (requiredFeature && !subscriptionStore.hasFeature(requiredFeature)) {
      console.log('Required feature not available:', requiredFeature)
      return next('/subscription')
    }

    return next()
  } catch (error) {
    console.error('Error checking subscription:', error)
    return next('/subscription')
  }
}
