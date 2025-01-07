import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  updateDoc,
  serverTimestamp,
  getCountFromServer,
  orderBy,
  limit,
  startAfter
} from 'firebase/firestore'
import { db } from '@/firebase'
import { SUBSCRIPTION_PLANS } from '@/constants/plans'
import { getFunctions, httpsCallable } from 'firebase/functions'

export const useOrganizationStore = defineStore('organization', () => {
  const currentOrg = ref(null)
  const currentPlan = ref(null)
  const shops = ref([])
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)
  const clientsCount = ref(0)
  const repairsCount = ref(0)

  // Getters
  const isMultiShopEnabled = computed(() => {
    if (!currentPlan.value) return false
    return ['PROFESSIONAL', 'ENTERPRISE'].includes(currentPlan.value)
  })

  const maxUsers = computed(() => {
    if (!currentPlan.value) return 0
    return SUBSCRIPTION_PLANS[currentPlan.value].maxUsers
  })

  const maxClients = computed(() => {
    if (!currentPlan.value) return 0
    return SUBSCRIPTION_PLANS[currentPlan.value].maxClients
  })

  const maxRepairs = computed(() => {
    if (!currentPlan.value) return 0
    return SUBSCRIPTION_PLANS[currentPlan.value].maxRepairs
  })

  // Actions
  const fetchOrganization = async (orgId) => {
    try {
      loading.value = true
      error.value = null

      const orgDoc = await getDoc(doc(db, 'organizations', orgId))
      if (!orgDoc.exists()) {
        throw new Error('Organisation non trouvée')
      }

      currentOrg.value = { id: orgDoc.id, ...orgDoc.data() }
      currentPlan.value = orgDoc.data().subscriptionPlan

      // Charger les boutiques
      const shopsQuery = query(
        collection(db, 'shops'),
        where('organizationId', '==', orgId)
      )
      const shopsSnapshot = await getDocs(shopsQuery)
      shops.value = shopsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Charger les utilisateurs
      const usersQuery = query(
        collection(db, 'users'),
        where('organizationId', '==', orgId)
      )
      const usersSnapshot = await getDocs(usersQuery)
      users.value = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

    } catch (err) {
      error.value = err.message
      console.error('Erreur lors du chargement de l\'organisation:', err)
    } finally {
      loading.value = false
    }
  }

  async function updateSubscription(plan) {
    try {
      loading.value = true
      error.value = null

      // Appeler la fonction Cloud pour mettre à jour l'abonnement
      const functions = getFunctions()
      const updateSubscriptionFunction = httpsCallable(functions, 'updateSubscription')
      await updateSubscriptionFunction({
        organizationId: currentOrg.value.id,
        plan
      })

      // Mettre à jour le plan localement
      currentPlan.value = plan

      return true
    } catch (e) {
      console.error('Erreur lors de la mise à jour de l\'abonnement:', e)
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  const addShop = async (shopData) => {
    if (!currentOrg.value) return

    // Vérifier la limite de boutiques pour le plan
    if (isMultiShopEnabled.value) {
      if (currentPlan.value === 'PROFESSIONAL' && shops.value.length >= 3) {
        throw new Error('Limite de boutiques atteinte pour votre plan')
      }
    } else if (shops.value.length >= 1) {
      throw new Error('Votre plan ne permet pas de gérer plusieurs boutiques')
    }

    // Ajouter la boutique...
  }

  const addUser = async (userData) => {
    if (!currentOrg.value) return

    // Vérifier la limite d'utilisateurs pour le plan
    if (typeof maxUsers.value === 'number' && users.value.length >= maxUsers.value) {
      throw new Error('Limite d\'utilisateurs atteinte pour votre plan')
    }

    // Ajouter l'utilisateur...
  }

  // Méthodes de paiement
  async function getPaymentMethod() {
    try {
      loading.value = true
      error.value = null

      // Appeler la fonction Cloud pour obtenir la méthode de paiement
      const functions = getFunctions()
      const getPaymentMethodFunction = httpsCallable(functions, 'getPaymentMethod')
      const result = await getPaymentMethodFunction({
        organizationId: currentOrg.value.id
      })

      return result.data
    } catch (e) {
      console.error('Erreur lors de la récupération de la méthode de paiement:', e)
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  async function getInvoices({ page = 1, limit = 10 } = {}) {
    try {
      loading.value = true
      error.value = null

      // Appeler la fonction Cloud pour obtenir les factures
      const functions = getFunctions()
      const getInvoicesFunction = httpsCallable(functions, 'getInvoices')
      const result = await getInvoicesFunction({
        organizationId: currentOrg.value.id,
        page,
        limit
      })

      return result.data
    } catch (e) {
      console.error('Erreur lors de la récupération des factures:', e)
      error.value = e.message
      return {
        invoices: [],
        hasMore: false
      }
    } finally {
      loading.value = false
    }
  }

  const getInvoiceDownloadUrl = async (invoiceId) => {
    try {
      loading.value = true
      error.value = null

      // Appeler la fonction Cloud pour obtenir l'URL de téléchargement
      const functions = getFunctions()
      const getInvoiceUrlFunction = httpsCallable(functions, 'getInvoiceDownloadUrl')
      const result = await getInvoiceUrlFunction({
        organizationId: currentOrg.value.id,
        invoiceId
      })

      return result.data.url

    } catch (err) {
      error.value = err.message
      console.error('Erreur lors de la récupération de l\'URL de la facture:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Statistiques d'utilisation
  const loadUsageStats = async () => {
    try {
      loading.value = true
      error.value = null

      const [clientsSnapshot, repairsSnapshot] = await Promise.all([
        getCountFromServer(
          query(
            collection(db, 'clients'),
            where('organizationId', '==', currentOrg.value.id)
          )
        ),
        getCountFromServer(
          query(
            collection(db, 'repairs'),
            where('organizationId', '==', currentOrg.value.id)
          )
        )
      ])

      clientsCount.value = clientsSnapshot.data().count
      repairsCount.value = repairsSnapshot.data().count

    } catch (err) {
      error.value = err.message
      console.error('Erreur lors du chargement des statistiques:', err)
    } finally {
      loading.value = false
    }
  }

  // Charger les statistiques au montage du store
  if (currentOrg.value) {
    loadUsageStats()
  }

  // Surveiller les changements d'organisation
  watch(currentOrg, (newOrg) => {
    if (newOrg) {
      loadUsageStats()
    }
  })

  return {
    currentOrg,
    currentPlan,
    shops,
    users,
    loading,
    error,
    clientsCount,
    repairsCount,
    fetchOrganization,
    updateSubscription,
    addShop,
    addUser,
    getPaymentMethod,
    getInvoices,
    getInvoiceDownloadUrl
  }
})
