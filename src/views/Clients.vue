<template>
  <div>
    <v-row>
      <v-col cols="12" class="d-flex align-center">
        <h1 class="text-h4">Gestion des clients</h1>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          prepend-icon="mdi-account-plus"
          @click="openClientDialog()"
        >
          Nouveau client
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filtres -->
    <v-row>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="filters.search"
          label="Rechercher un client"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          hide-details
          class="mb-4"
        ></v-text-field>
      </v-col>
    </v-row>

    <!-- Liste des clients -->
    <v-row>
      <v-col cols="12" class="px-4">
        <v-card class="mt-4 pa-4">
          <v-data-table
            :headers="headers"
            :items="clients"
            :loading="loading"
            :search="filters.search"
            density="comfortable"
            hover
          >
            <template v-slot:item.actions="{ item }">
              <v-btn
                icon
                variant="text"
                size="small"
                color="primary"
                @click="viewClientDetails(item)"
              >
                <v-icon>mdi-eye</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                color="primary"
                @click="openClientDialog(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                color="error"
                @click="confirmDelete(item)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>

            <template v-slot:item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>

            <template v-slot:item.repairCount="{ item }">
              <v-chip
                color="primary"
                size="small"
                class="mr-2"
                v-if="item.repairCount !== undefined"
              >
                {{ item.repairCount }}
              </v-chip>
            </template>

            <template v-slot:item.totalRevenue="{ item }">
              {{ formatPrice(item.totalRevenue) }}
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog client -->
    <v-dialog v-model="dialog.show" max-width="600px">
      <v-card>
        <v-card-title>
          {{ dialog.isEdit ? 'Modifier le client' : 'Nouveau client' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="form" @submit.prevent="saveClient">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="clientForm.name"
                  label="Nom"
                  required
                  :rules="[v => !!v || 'Le nom est requis']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="clientForm.email"
                  label="Email"
                  type="email"
                  :rules="emailRules"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="clientForm.phone"
                  label="Téléphone"
                  required
                  :rules="phoneRules"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="clientForm.address"
                  label="Adresse"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="clientForm.notes"
                  label="Notes"
                  rows="3"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="dialog.show = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            @click="saveClient"
            :loading="loading"
          >
            {{ dialog.isEdit ? 'Modifier' : 'Créer' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog détails client -->
    <v-dialog v-model="detailsDialog.show" max-width="800px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <span>{{ selectedClient ? selectedClient.name : 'Détails client' }}</span>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="detailsDialog.show = false"
          ></v-btn>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <!-- Informations client -->
              <v-col cols="12" md="6">
                <h3 class="text-h6 mb-4">Informations</h3>
                <div class="d-flex flex-column gap-2">
                  <div v-if="selectedClient?.phone">
                    <strong>Téléphone:</strong> {{ selectedClient.phone }}
                  </div>
                  <div v-if="selectedClient?.email">
                    <strong>Email:</strong> {{ selectedClient.email }}
                  </div>
                  <div v-if="selectedClient?.address">
                    <strong>Adresse:</strong> {{ selectedClient.address }}
                  </div>
                  <div>
                    <strong>Réparations:</strong> {{ selectedClient?.repairCount || 0 }}
                  </div>
                  <div>
                    <strong>CA Total:</strong> {{ formatPrice(selectedClient?.totalRevenue || 0) }}
                  </div>
                </div>
              </v-col>

              <!-- Liste des réparations -->
              <v-col cols="12" md="12">
                <h3 class="text-h6 mb-4">Historique des réparations</h3>
                <v-data-table
                  :headers="[
                    { title: 'N°', key: 'repairNumber' },
                    { title: 'Date', key: 'createdAt' },
                    { title: 'Marque', key: 'manufacturer' },
                    { title: 'Modèle', key: 'deviceModel' },
                    { title: 'Statut', key: 'status' },
                    { title: 'Prix', key: 'price' },
                    { title: 'Actions', key: 'actions' }
                  ]"
                  :items="selectedClient?.repairs || []"
                  :loading="detailsDialog.loading"
                >
                  <template v-slot:item.createdAt="{ item }">
                    {{ formatDate(item.createdAt) }}
                  </template>

                  <template v-slot:item.status="{ item }">
                    <v-chip
                      :color="getStatusColor(item.status)"
                      size="small"
                    >
                      {{ item.status }}
                    </v-chip>
                  </template>

                  <template v-slot:item.price="{ item }">
                    {{ formatPrice(item.price) }}
                  </template>

                  <template v-slot:item.actions="{ item }">
                    <v-btn
                      icon
                      variant="text"
                      size="small"
                      color="primary"
                      @click="openRepair(item)"
                    >
                      <v-icon>mdi-eye</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog.show" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">
          Confirmer la suppression
        </v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="deleteDialog.show = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="error"
            @click="deleteClient"
            :loading="deleteDialog.loading"
          >
            Supprimer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
<!-- Dialog Réparation --> 
<repair-dialog
  v-model="repairDialog.show"
  :repair="repairDialog.repair"
  @update:repair="loadClients"
/>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { customerService } from '../services/customer.service'
import { useSnackbar } from '@/composables/useSnackbar'
import RepairDialog from '@/components/repairs/RepairDialog.vue'

const router = useRouter()
const { showSnackbar } = useSnackbar()

// État
const loading = ref(false)
const clients = ref([])
const form = ref(null)
const dialog = ref({
  show: false,
  isEdit: false
})
const selectedClient = ref(null)
const clientRepairs = ref([])

// Dialog réparation
const repairDialog = ref({
  show: false,
  repair: null
})

// Filtres
const filters = ref({
  search: ''
})

// En-têtes du tableau
const headers = [
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Téléphone', key: 'phone', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Réparations', key: 'repairCount', sortable: true },
  { title: 'CA Total', key: 'totalRevenue', sortable: true },
  { title: 'Date création', key: 'createdAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Formulaire client
const clientForm = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  notes: ''
})

// Dialog détails
const detailsDialog = ref({
  show: false,
  loading: false
})

// Dialog suppression
const deleteDialog = ref({
  show: false,
  loading: false,
  client: null
})

// Règles de validation
const emailRules = [
  v => !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) || 'Email invalide'
]

const phoneRules = [
  v => !!v || 'Le téléphone est requis',
  v => /^[0-9]{10}$/.test(v) || 'Format invalide (10 chiffres)'
]

// Méthodes
async function loadClients() {
  loading.value = true
  try {
    const results = await customerService.getCustomers()
    clients.value = results.customers
  } catch (error) {
    console.error('Erreur lors du chargement des clients:', error)
  } finally {
    loading.value = false
  }
}

function openClientDialog(client = null) {
  if (client) {
    clientForm.value = { ...client }
    dialog.value.isEdit = true
  } else {
    clientForm.value = {
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    }
    dialog.value.isEdit = false
  }
  dialog.value.show = true
}

async function saveClient() {
  if (!form.value?.validate()) return

  loading.value = true
  try {
    if (dialog.value.isEdit) {
      // Mise à jour du client
      const updatedClient = await customerService.updateCustomer(selectedClient.value.id, clientForm.value)
      const index = clients.value.findIndex(c => c.id === updatedClient.id)
      if (index !== -1) {
        clients.value[index] = updatedClient
      }
    } else {
      // Création d'un nouveau client
      const newClient = await customerService.quickCreate(clientForm.value)
      clients.value.push(newClient)
    }
    dialog.value.show = false
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du client:', error)
  } finally {
    loading.value = false
  }
}

async function viewClientDetails(client) {
  try {
    detailsDialog.value.loading = true
    detailsDialog.value.show = true
    // Charger les détails complets du client
    selectedClient.value = await customerService.getCustomerById(client.id)
  } catch (error) {
    console.error('Erreur lors du chargement des détails du client:', error)
  } finally {
    detailsDialog.value.loading = false
  }
}

function confirmDelete(client) {
  deleteDialog.value.client = client
  deleteDialog.value.show = true
}

async function deleteClient() {
  if (!deleteDialog.value.client) return

  deleteDialog.value.loading = true
  try {
    await customerService.deleteCustomer(deleteDialog.value.client.id)
    deleteDialog.value.show = false
    loadClients()
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
  } finally {
    deleteDialog.value.loading = false
  }
}

function getStatusColor(status) {
  const colors = {
    pending: 'warning',
    'in-progress': 'info',
    completed: 'success',
    cancelled: 'error'
  }
  return colors[status] || 'grey'
}

function formatDate(timestamp) {
  if (!timestamp) return ''

  const date = timestamp instanceof Date ? timestamp : timestamp.toDate()
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']
  
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

function formatPrice(price) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
}

const openRepair = (repair) => {
  if (!repair || !repair.id) {
    showSnackbar('Erreur: Réparation invalide', 'error')
    return
  }
  repairDialog.value.repair = repair
  repairDialog.value.show = true
}

// Lifecycle
onMounted(() => {
  loadClients()
})
</script>

<style scoped>
.client-details {
  padding: 20px;
}

.client-info {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #333;
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.client-info strong {
  color: #e6e6e6;
}

.repairs-section h3 {
  color: #333;
  margin-bottom: 20px;
  padding-left: 8px;
}

.repairs-section {
  margin-top: 20px;
}

.repairs-list {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.repair-card {
  background: #333;
  border: none;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  color: white;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.repair-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
}

.repair-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.device-info {
  flex: 1;
}

.device-name {
  font-weight: bold;
  display: block;
  color: #ffd700;
  margin-bottom: 4px;
}

.repair-date {
  color: #e6e6e6;
  font-size: 0.9em;
}

.repair-price {
  font-weight: bold;
  color: #90EE90;
  font-size: 1.1em;
  padding: 6px 12px;
  background: rgba(144, 238, 144, 0.1);
  border-radius: 20px;
}

.repair-details {
  font-size: 0.95em;
  color: #e6e6e6;
}

.issues {
  margin-bottom: 15px;
  background: rgba(255,255,255,0.05);
  padding: 12px;
  border-radius: 12px;
}

.issues strong {
  color: #ffd700;
}

.additional-issues {
  margin-top: 10px;
  padding-left: 15px;
}

.additional-issues strong {
  color: #ffd700;
}

.additional-issues ul {
  margin: 8px 0;
  padding-left: 20px;
  color: #e6e6e6;
}

.additional-issues li {
  margin-bottom: 4px;
}

.description {
  color: #e6e6e6;
  font-style: italic;
  margin-top: 12px;
  padding: 12px;
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
}

.description strong {
  color: #ffd700;
}

.repair-status {
  margin-top: 12px;
  padding: 12px;
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
}

.repair-status strong {
  color: #ffd700;
}

/* Style des boutons */
:deep(.v-btn) {
  border-radius: 12px !important;
  text-transform: none !important;
  font-weight: 500 !important;
  letter-spacing: 0.5px !important;
  padding: 0 20px !important;
}

:deep(.v-btn--icon) {
  border-radius: 50% !important;
}

/* Style des dialogues */
:deep(.v-dialog) {
  border-radius: 20px;
  overflow: hidden;
}

:deep(.v-card) {
  border-radius: 20px !important;
}

:deep(.v-text-field) {
  border-radius: 12px;
}

:deep(.v-text-field .v-field__outline__start) {
  border-radius: 12px 0 0 12px !important;
}

:deep(.v-text-field .v-field__outline__end) {
  border-radius: 0 12px 12px 0 !important;
}

/* Style des overlays */
:deep(.v-overlay__content) {
  border-radius: 20px !important;
}

:deep(.v-overlay__content > .v-card) {
  border-radius: 20px !important;
  overflow: hidden;
}
</style>
