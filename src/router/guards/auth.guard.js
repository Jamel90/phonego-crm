import { useAuthStore } from '@/stores/auth'

export async function authGuard(to, from, next) {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  // Rediriger vers le dashboard si l'utilisateur est connecté et essaie d'accéder à une page hideForAuth
  if (isAuthenticated && to.meta.hideForAuth) {
    return next({ name: 'dashboard' })
  }

  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté et essaie d'accéder à une page requiresAuth
  if (!isAuthenticated && to.meta.requiresAuth) {
    return next({ 
      name: 'Login', 
      query: { 
        redirect: to.fullPath,
        message: 'Veuillez vous connecter pour accéder à cette page'
      } 
    })
  }

  return next()
}
