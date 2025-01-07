import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const authStore = useAuthStore()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)
  const isAdmin = computed(() => authStore.isAdmin)
  const userRole = computed(() => authStore.userRole)

  return {
    isAuthenticated,
    user,
    isAdmin,
    userRole,
    login: authStore.login,
    logout: authStore.logout
  }
}
