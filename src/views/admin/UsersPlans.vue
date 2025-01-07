<template>
  <div class="users-plans">
    <v-container>
      <!-- En-tête -->
      <v-row class="mb-6">
        <v-col>
          <h1 class="text-h4 font-weight-bold">Plans des Utilisateurs</h1>
          <p class="text-subtitle-1 text-medium-emphasis">
            Gérez et consultez les plans de tous les utilisateurs
          </p>
        </v-col>
      </v-row>

      <!-- Tableau des utilisateurs -->
      <v-card>
        <v-data-table
          :headers="headers"
          :items="users"
          :loading="loading"
          :search="search"
          class="elevation-1"
        >
          <!-- Barre de recherche -->
          <template v-slot:top>
            <v-toolbar flat>
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                label="Rechercher"
                single-line
                hide-details
                class="mx-4"
              ></v-text-field>
            </v-toolbar>
          </template>

          <!-- Colonne du plan -->
          <template v-slot:item.subscription.plan="{ item }">
            <v-chip
              :color="getPlanColor(item?.subscription?.plan)"
              :text-color="getPlanTextColor()"
              size="small"
            >
              {{ formatPlanName(item?.subscription?.plan || 'basic') }}
            </v-chip>
          </template>

          <!-- Colonne du statut -->
          <template v-slot:item.subscription.status="{ item }">
            <v-chip
              :color="getStatusColor(item?.subscription?.status || 'pending')"
              size="small"
            >
              {{ item?.subscription?.status || 'pending' }}
            </v-chip>
          </template>

          <!-- Colonne des actions -->
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              color="primary"
              @click="editUser(item)"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card>

      <!-- Dialog de modification -->
      <v-dialog v-model="dialog" max-width="500px">
        <v-card>
          <v-card-title>
            <span class="text-h5">Modifier le plan</span>
          </v-card-title>

          <v-card-text>
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="editedItem.subscription.plan"
                    :items="availablePlans"
                    item-title="text"
                    item-value="value"
                    label="Plan"
                    required
                  ></v-select>
                </v-col>
                <v-col cols="12">
                  <v-select
                    v-model="editedItem.subscription.status"
                    :items="['active', 'inactive', 'pending']"
                    label="Statut"
                    required
                  ></v-select>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="error"
              variant="text"
              @click="closeDialog"
            >
              Annuler
            </v-btn>
            <v-btn
              color="primary"
              variant="text"
              @click="saveChanges"
              :loading="saving"
            >
              Enregistrer
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Snackbar pour les notifications -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        :timeout="3000"
      >
        {{ snackbar.text }}
        <template v-slot:actions>
          <v-btn
            variant="text"
            @click="snackbar.show = false"
          >
            Fermer
          </v-btn>
        </template>
      </v-snackbar>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'

const authStore = useAuthStore()
const loading = ref(true)
const search = ref('')
const dialog = ref(false)
const saving = ref(false)
const users = ref([])
const editedItem = ref({
  id: '',
  email: '',
  storeName: '',
  subscription: {
    plan: 'basic',
    status: 'pending',
    endDate: 'N/A'
  }
})
const availablePlans = ref([])
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// En-têtes du tableau
const headers = [
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Nom de la boutique', key: 'storeName', sortable: true },
  { title: 'Plan', key: 'subscription.plan', sortable: true },
  { title: 'Statut', key: 'subscription.status', sortable: true },
  { title: 'Date d\'expiration', key: 'subscription.endDate', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Couleurs des plans
const getPlanColor = (plan) => {
  switch(plan) {
    case 'basic': return 'primary'
    case 'pro': return 'success'
    default: return 'grey'
  }
}

const getPlanTextColor = () => 'white'

// Couleurs des statuts
const getStatusColor = (status) => {
  const colors = {
    'active': 'success',
    'inactive': 'error',
    'pending': 'warning'
  }
  return colors[status] || 'grey'
}

// Formatage du nom du plan
const formatPlanName = (planKey) => {
  const plan = availablePlans.value.find(p => p.value === planKey)
  return plan ? plan.text : 'Plan non défini'
}

// Charger les plans disponibles
const loadPlans = async () => {
  try {
    const plansSnapshot = await getDocs(collection(db, 'plans'))
    availablePlans.value = plansSnapshot.docs.map(doc => ({
      text: doc.data().name,
      value: doc.id
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des plans:', error)
    showSnackbar('Erreur lors du chargement des plans', 'error')
  }
}

// Charger les utilisateurs
const loadUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'))
    users.value = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        email: data.email,
        storeName: data.storeName,
        subscription: {
          plan: data.subscription?.plan || 'basic',
          status: data.subscription?.status || 'pending',
          endDate: data.subscription?.endDate?.toDate().toLocaleDateString() || 'N/A'
        },
        createdAt: data.createdAt?.toDate().toLocaleDateString() || 'N/A'
      }
    })
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs:', error)
    showSnackbar('Erreur lors du chargement des utilisateurs', 'error')
  } finally {
    loading.value = false
  }
}

// Éditer un utilisateur
const editUser = (item) => {
  editedItem.value = {
    id: item.id,
    email: item.email,
    storeName: item.storeName,
    subscription: {
      plan: item?.subscription?.plan || 'basic',
      status: item?.subscription?.status || 'pending',
      endDate: item?.subscription?.endDate || 'N/A'
    }
  }
  dialog.value = true
}

// Fermer le dialog
const closeDialog = () => {
  dialog.value = false
  editedItem.value = {
    id: '',
    email: '',
    storeName: '',
    subscription: {
      plan: 'basic',
      status: 'pending',
      endDate: 'N/A'
    }
  }
}

// Sauvegarder les modifications
const saveChanges = async () => {
  saving.value = true
  try {
    const userRef = doc(db, 'users', editedItem.value.id)
    await updateDoc(userRef, {
      'subscription.plan': editedItem.value.subscription.plan,
      'subscription.status': editedItem.value.subscription.status
    })
    
    // Mettre à jour la liste locale
    const index = users.value.findIndex(user => user.id === editedItem.value.id)
    if (index !== -1) {
      users.value[index] = { ...users.value[index], ...editedItem.value }
    }
    
    showSnackbar('Modifications enregistrées avec succès')
    closeDialog()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    showSnackbar('Erreur lors de la sauvegarde des modifications', 'error')
  } finally {
    saving.value = false
  }
}

// Afficher une notification
const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

// Vérifier les permissions et charger les données
onMounted(async () => {
  if (!authStore.isSuperAdmin) {
    router.push({ name: 'dashboard' })
    return
  }
  await loadPlans()
  await loadUsers()
})
</script>

<style scoped>
.users-plans {
  min-height: 100%;
}
</style>
