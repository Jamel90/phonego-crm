import { useAuthStore } from '@/stores/auth'

export function adminGuard(to, from, next) {
  const authStore = useAuthStore()
  
  // Si l'utilisateur n'est pas un admin, rediriger vers le dashboard
  if (!authStore.isAdmin) {
    next({ name: 'dashboard' })
    return
  }

  // Si l'utilisateur n'est pas un super admin et la route nécessite un super admin
  if (!authStore.isSuperAdmin && to.meta.requiresSuperAdmin) {
    next({ name: 'dashboard' })
    return
  }

  next()
}
