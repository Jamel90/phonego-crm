import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, db } from '@/firebase'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth.service'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { ROLES } from '@/constants/roles'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const user = ref(null)
  const userRole = ref(null)
  const storeId = ref(null)
  const storeName = ref(null)
  const error = ref(null)
  const loading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => 
    userRole.value === ROLES.ADMIN || userRole.value === ROLES.SUPER_ADMIN
  )
  const isSuperAdmin = computed(() => 
    userRole.value === ROLES.SUPER_ADMIN || userRole.value?.toUpperCase() === 'SUPER_ADMIN'
  )
  const currentStore = computed(() => ({
    id: storeId.value,
    name: storeName.value
  }))

  async function updateUserRole(uid, newRole) {
    try {
      const userRef = doc(db, 'users', uid)
      await updateDoc(userRef, {
        role: newRole
      })
      userRole.value = newRole
      console.log('Rôle utilisateur mis à jour avec succès')
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error)
      throw error
    }
  }

  async function fetchUserData(uid) {
    try {
      console.log('Fetching user data for:', uid)
      const userDoc = await getDoc(doc(db, 'users', uid))
      
      if (!userDoc.exists()) {
        console.error('User document not found')
        throw new Error('Utilisateur non trouvé')
      }

      const userData = userDoc.data()
      console.log('User data fetched:', userData)
      
      user.value = {
        uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        storeId: userData.storeId
      }
      
      userRole.value = userData.role
      storeId.value = userData.storeId

      if (userData.storeId) {
        const storeDoc = await getDoc(doc(db, 'stores', userData.storeId))
        if (storeDoc.exists()) {
          storeName.value = storeDoc.data().name
        }
      }

      console.log('User role set to:', userRole.value)
      console.log('Is super admin?', isSuperAdmin.value)
      
      return userData
    } catch (error) {
      console.error('Error fetching user data:', error)
      throw error
    }
  }

  async function login(email, password) {
    try {
      loading.value = true
      error.value = null
      
      const userData = await authService.login(email, password)
      if (!userData) {
        throw new Error('Échec de la connexion')
      }
      
      user.value = userData
      await fetchUserData(userData.uid)
      
      // Rediriger vers la page appropriée
      if (isSuperAdmin.value) {
        router.push('/admin/stores')
      } else {
        router.push('/dashboard')
      }
      
      return userData
    } catch (err) {
      console.error('Erreur lors de la connexion:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await authService.logout()
      user.value = null
      userRole.value = null
      storeId.value = null
      storeName.value = null
      error.value = null
      router.push('/login')
    } catch (err) {
      console.error('Logout error:', err)
      error.value = err.message
      throw err
    }
  }

  async function initializeAuthState() {
    try {
      const savedUser = await authService.getCurrentUser()
      if (savedUser) {
        user.value = savedUser
        await fetchUserData(savedUser.uid)
      }
    } catch (err) {
      console.error('Error initializing auth state:', err)
      error.value = err.message
    } finally {
      initialized.value = true
    }
  }

  return {
    user,
    userRole,
    storeId,
    storeName,
    currentStore,
    error,
    loading,
    initialized,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    login,
    logout,
    initializeAuthState
  }
})
