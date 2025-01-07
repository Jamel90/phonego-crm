<template>
  <v-container fluid v-if="client">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-btn
            icon
            variant="text"
            :to="{ name: 'AdminPanel' }"
            class="mr-4"
          >
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <div>
            <h1 class="text-h4 font-weight-bold mb-1">{{ client.company }}</h1>
            <p class="text-subtitle-1 text-medium-emphasis">Détails du client</p>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <!-- Informations principales -->
      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title>Informations</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-account</v-icon>
                </template>
                <v-list-item-title>Contact</v-list-item-title>
                <v-list-item-subtitle>{{ client.contact }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-email</v-icon>
                </template>
                <v-list-item-title>Email</v-list-item-title>
                <v-list-item-subtitle>{{ client.email }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-phone</v-icon>
                </template>
                <v-list-item-title>Téléphone</v-list-item-title>
                <v-list-item-subtitle>{{ client.phone || 'Non renseigné' }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>Abonnement</v-card-title>
          <v-card-text>
            <div class="d-flex align-center mb-4">
              <v-chip
                :color="getPlanColor(client.subscription)"
                size="large"
                class="text-capitalize mr-2"
              >
                {{ client.subscription }}
              </v-chip>
              <span class="text-h6">{{ formatPrice(getPlanPrice(client.subscription)) }}/mois</span>
            </div>

            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-calendar</v-icon>
                </template>
                <v-list-item-title>Date de début</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(client.subscriptionStart) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-credit-card</v-icon>
                </template>
                <v-list-item-title>Dernier paiement</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(client.lastPayment) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon :color="getStatusColor(client.status)">mdi-circle-medium</v-icon>
                </template>
                <v-list-item-title>Statut</v-list-item-title>
                <v-list-item-subtitle class="text-capitalize">{{ client.status }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Liste des boutiques -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Boutiques</span>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="showAddStore = true"
              :disabled="!canAddStore"
            >
              Ajouter
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Adresse</th>
                  <th>Responsable</th>
                  <th>Réparations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="store in client.stores" :key="store.id">
                  <td>{{ store.name }}</td>
                  <td>{{ store.address }}</td>
                  <td>{{ store.manager }}</td>
                  <td>{{ store.repairsCount }}</td>
                  <td>
                    <v-btn
                      icon
                      variant="text"
                      size="small"
                      color="primary"
                      @click="editStore(store)"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- Statistiques des boutiques -->
        <v-row class="mt-4">
          <v-col v-for="stat in storeStats" :key="stat.title" cols="12" sm="6" md="3">
            <v-card>
              <v-card-text>
                <div class="text-h5 mb-1">{{ stat.value }}</div>
                <div class="text-caption text-medium-emphasis">{{ stat.title }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Dialog d'ajout/modification de boutique -->
    <v-dialog v-model="showAddStore" max-width="600px">
      <v-card>
        <v-card-title>
          {{ editingStore ? 'Modifier la boutique' : 'Ajouter une boutique' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="storeForm">
            <v-text-field
              v-model="storeForm.name"
              label="Nom de la boutique"
              required
            ></v-text-field>
            <v-text-field
              v-model="storeForm.address"
              label="Adresse"
              required
            ></v-text-field>
            <v-text-field
              v-model="storeForm.manager"
              label="Responsable"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showAddStore = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            @click="saveStore"
            :loading="saving"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/firebase'
import { getRepairsForClient } from '@/services/repairs.service'

const route = useRoute()
const client = ref(null)
const repairs = ref([])
const loadingRepairs = ref(true)
const showAddStore = ref(false)
const saving = ref(false)
const editingStore = ref(null)
const storeForm = ref({
  name: '',
  address: '',
  manager: ''
})

const storeStats = computed(() => [
  {
    title: 'Total Réparations',
    value: client.value?.stores?.reduce((acc, store) => acc + store.repairsCount, 0) || 0
  },
  {
    title: 'Boutiques Actives',
    value: client.value?.stores?.length || 0
  },
  {
    title: 'CA Mensuel',
    value: formatPrice(client.value?.monthlyRevenue || 0)
  },
  {
    title: 'Tickets en cours',
    value: client.value?.activeTickets || 0
  }
])

const canAddStore = computed(() => {
  const maxStores = {
    basic: 1,
    premium: 3,
    enterprise: 10
  }
  return (client.value?.stores?.length || 0) < maxStores[client.value?.subscription || 'basic']
})

const repairHeaders = [
  { title: 'Référence', key: 'reference', align: 'start', sortable: true },
  { title: 'Date', key: 'date', align: 'start', sortable: true },
  { title: 'Appareil', key: 'device', align: 'start', sortable: false },
  { title: 'Problèmes', key: 'issues', align: 'start', sortable: false },
  { title: 'Statut', key: 'status', align: 'start', sortable: true },
  { title: 'Prix', key: 'price', align: 'end', sortable: true }
]

function getPlanColor(plan) {
  const colors = {
    basic: 'info',
    premium: 'warning',
    enterprise: 'success'
  }
  return colors[plan] || 'grey'
}

function getStatusColor(status) {
  const colors = {
    active: 'success',
    pending: 'warning',
    suspended: 'error',
    cancelled: 'grey'
  }
  return colors[status] || 'grey'
}

function getRepairStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'nouveau':
      return 'primary'
    case 'en_cours':
      return 'warning'
    case 'terminé':
      return 'success'
    case 'annulé':
      return 'error'
    default:
      return 'grey'
  }
}

function getPlanPrice(plan) {
  const prices = {
    basic: 29,
    premium: 79,
    enterprise: 199
  }
  return prices[plan] || 0
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function formatDate(date) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('fr-FR')
}

function editStore(store) {
  editingStore.value = store
  storeForm.value = { ...store }
  showAddStore.value = true
}

async function saveStore() {
  try {
    saving.value = true
    const stores = [...(client.value.stores || [])]
    
    if (editingStore.value) {
      const index = stores.findIndex(s => s.id === editingStore.value.id)
      stores[index] = { ...stores[index], ...storeForm.value }
    } else {
      stores.push({
        id: Date.now().toString(),
        ...storeForm.value,
        repairsCount: 0
      })
    }

    await updateDoc(doc(db, 'users', client.value.id), { stores })
    await loadClient()
    showAddStore.value = false
    editingStore.value = null
    storeForm.value = { name: '', address: '', manager: '' }
  } catch (error) {
    console.error('Error saving store:', error)
  } finally {
    saving.value = false
  }
}

async function loadClient() {
  try {
    const docRef = doc(db, 'users', route.params.id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      client.value = {
        id: docSnap.id,
        ...docSnap.data()
      }
    }
  } catch (error) {
    console.error('Error loading client:', error)
  }
}

async function loadRepairs() {
  loadingRepairs.value = true
  try {
    const repairsRef = collection(db, 'repairs')
    const q = query(
      repairsRef,
      where('clientId', '==', route.params.id),
      orderBy('date', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    repairs.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des réparations:', error)
  } finally {
    loadingRepairs.value = false
  }
}

onMounted(() => {
  loadClient()
  loadRepairs()
})
</script>
