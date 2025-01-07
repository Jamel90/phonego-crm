<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-printer</v-icon>
            Gestion des Imprimantes
          </v-card-title>

          <v-card-text>
            <!-- Sélecteur de boutique -->
            <v-select
              v-model="selectedStore"
              :items="stores"
              item-title="name"
              item-value="id"
              label="Sélectionner une boutique"
              class="mb-4"
              @update:model-value="loadPrinters"
            />

            <!-- Liste des imprimantes -->
            <v-data-table
              :headers="headers"
              :items="printers"
              :loading="loading"
              class="elevation-1"
            >
              <!-- Status de l'imprimante -->
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="item.status === 'connected' ? 'success' : 'error'"
                  size="small"
                >
                  {{ formatStatus(item.status) }}
                </v-chip>
              </template>

              <!-- Dernière impression -->
              <template v-slot:item.lastPrint="{ item }">
                {{ item.lastPrint ? formatDate(item.lastPrint) : 'Jamais' }}
              </template>

              <!-- Actions -->
              <template v-slot:item.actions="{ item }">
                <div class="d-flex gap-2">
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    color="primary"
                    @click="editPrinter(item)"
                  />
                  <v-btn
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    @click="confirmDeletePrinter(item)"
                  />
                  <v-btn
                    icon="mdi-printer-check"
                    size="small"
                    variant="text"
                    color="info"
                    @click="testPrinter(item)"
                  />
                </div>
              </template>
            </v-data-table>

            <!-- Statistiques globales -->
            <v-row class="mt-6">
              <v-col cols="12" md="4">
                <v-card>
                  <v-card-text>
                    <div class="text-h6 mb-2">Total Imprimantes</div>
                    <div class="text-h4">{{ totalPrinters }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card>
                  <v-card-text>
                    <div class="text-h6 mb-2">Impressions Aujourd'hui</div>
                    <div class="text-h4">{{ todayPrints }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card>
                  <v-card-text>
                    <div class="text-h6 mb-2">Imprimantes Actives</div>
                    <div class="text-h4">{{ activePrinters }}</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Historique global des impressions -->
            <v-expansion-panels class="mt-6">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  Historique Global des Impressions
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-data-table
                    :headers="historyHeaders"
                    :items="printHistory"
                    :loading="loadingHistory"
                  >
                    <template v-slot:item.status="{ item }">
                      <v-chip
                        :color="item.status === 'success' ? 'success' : 'error'"
                        size="small"
                      >
                        {{ item.status }}
                      </v-chip>
                    </template>
                    <template v-slot:item.timestamp="{ item }">
                      {{ formatDate(item.timestamp) }}
                    </template>
                  </v-data-table>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog d'édition d'imprimante -->
    <v-dialog v-model="printerDialog" max-width="500px">
      <v-card>
        <v-card-title>
          {{ editedPrinter.id ? 'Modifier' : 'Ajouter' }} une imprimante
        </v-card-title>

        <v-card-text>
          <v-form ref="printerForm" v-model="validPrinterForm">
            <v-text-field
              v-model="editedPrinter.name"
              label="Nom de l'imprimante"
              required
            />
            <v-select
              v-model="editedPrinter.type"
              :items="printerTypes"
              label="Type d'imprimante"
              required
            />
            <v-text-field
              v-model="editedPrinter.vendorId"
              label="Vendor ID"
              hint="Ex: 0x0483"
              required
            />
            <v-text-field
              v-model="editedPrinter.productId"
              label="Product ID"
              hint="Ex: 0x5740"
              required
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="error"
            text
            @click="closePrinterDialog"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            @click="savePrinter"
            :disabled="!validPrinterForm"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirmer la suppression</v-card-title>
        <v-card-text>
          Voulez-vous vraiment supprimer cette imprimante ?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            text
            @click="deleteDialog = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="error"
            @click="deletePrinter"
          >
            Supprimer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { formatDate } from '@/utils/formatters'
import { db } from '@/firebase'
import { 
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore'

const { showSnackbar } = useSnackbar()

// États
const stores = ref([])
const selectedStore = ref(null)
const printers = ref([])
const printHistory = ref([])
const loading = ref(false)
const loadingHistory = ref(false)
const printerDialog = ref(false)
const deleteDialog = ref(false)
const validPrinterForm = ref(false)
const printerForm = ref(null)

// Imprimante en cours d'édition
const editedPrinter = ref({
  name: '',
  type: 'thermal_80mm',
  vendorId: '',
  productId: '',
  status: 'disconnected'
})

// Imprimante à supprimer
const printerToDelete = ref(null)

// En-têtes des tableaux
const headers = [
  { title: 'Nom', key: 'name' },
  { title: 'Type', key: 'type' },
  { title: 'Status', key: 'status' },
  { title: 'Dernière impression', key: 'lastPrint' },
  { title: 'Actions', key: 'actions', sortable: false }
]

const historyHeaders = [
  { title: 'Date', key: 'timestamp' },
  { title: 'Boutique', key: 'storeName' },
  { title: 'Imprimante', key: 'printerName' },
  { title: 'Type', key: 'type' },
  { title: 'Status', key: 'status' }
]

// Types d'imprimantes disponibles
const printerTypes = [
  { title: 'Thermique 80mm', value: 'thermal_80mm' },
  { title: 'Thermique 58mm', value: 'thermal_58mm' }
]

// Statistiques calculées
const totalPrinters = computed(() => printers.value.length)
const activePrinters = computed(() => printers.value.filter(p => p.status === 'connected').length)
const todayPrints = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return printHistory.value.filter(p => p.timestamp >= today).length
})

// Formatage du statut
const formatStatus = (status) => {
  const statusMap = {
    'connected': 'Connectée',
    'disconnected': 'Déconnectée'
  }
  return statusMap[status] || status
}

// Chargement des boutiques
const loadStores = async () => {
  try {
    const storesRef = collection(db, 'stores')
    const snapshot = await getDocs(storesRef)
    stores.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des boutiques:', error)
    showSnackbar({
      text: 'Erreur lors du chargement des boutiques',
      color: 'error'
    })
  }
}

// Chargement des imprimantes
const loadPrinters = async () => {
  if (!selectedStore.value) return

  loading.value = true
  try {
    const printersRef = collection(db, `stores/${selectedStore.value}/settings/printer/devices`)
    const snapshot = await getDocs(printersRef)
    printers.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des imprimantes:', error)
    showSnackbar({
      text: 'Erreur lors du chargement des imprimantes',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Chargement de l'historique
const loadHistory = async () => {
  loadingHistory.value = true
  try {
    const historyRef = collection(db, 'printHistory')
    const q = query(historyRef, 
      orderBy('timestamp', 'desc'),
      limit(100)
    )
    const snapshot = await getDocs(q)
    printHistory.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique:', error)
    showSnackbar({
      text: 'Erreur lors du chargement de l\'historique',
      color: 'error'
    })
  } finally {
    loadingHistory.value = false
  }
}

// Éditer une imprimante
const editPrinter = (printer) => {
  editedPrinter.value = { ...printer }
  printerDialog.value = true
}

// Fermer le dialogue d'édition
const closePrinterDialog = () => {
  printerDialog.value = false
  editedPrinter.value = {
    name: '',
    type: 'thermal_80mm',
    vendorId: '',
    productId: '',
    status: 'disconnected'
  }
}

// Sauvegarder une imprimante
const savePrinter = async () => {
  try {
    const printerData = { 
      ...editedPrinter.value,
      updatedAt: Timestamp.now()
    }
    
    if (editedPrinter.value.id) {
      // Mise à jour
      const printerRef = doc(db, `stores/${selectedStore.value}/settings/printer/devices/${editedPrinter.value.id}`)
      await updateDoc(printerRef, printerData)
    } else {
      // Création
      const printersRef = collection(db, `stores/${selectedStore.value}/settings/printer/devices`)
      await addDoc(printersRef, printerData)
    }

    showSnackbar({
      text: 'Imprimante enregistrée avec succès',
      color: 'success'
    })
    closePrinterDialog()
    loadPrinters()
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'imprimante:', error)
    showSnackbar({
      text: 'Erreur lors de l\'enregistrement de l\'imprimante',
      color: 'error'
    })
  }
}

// Confirmer la suppression
const confirmDeletePrinter = (printer) => {
  printerToDelete.value = printer
  deleteDialog.value = true
}

// Supprimer une imprimante
const deletePrinter = async () => {
  try {
    const printerRef = doc(db, `stores/${selectedStore.value}/settings/printer/devices/${printerToDelete.value.id}`)
    await deleteDoc(printerRef)
    
    showSnackbar({
      text: 'Imprimante supprimée avec succès',
      color: 'success'
    })
    deleteDialog.value = false
    printerToDelete.value = null
    loadPrinters()
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'imprimante:', error)
    showSnackbar({
      text: 'Erreur lors de la suppression de l\'imprimante',
      color: 'error'
    })
  }
}

// Tester une imprimante
const testPrinter = async (printer) => {
  try {
    // Envoyer une impression de test
    await fetch(`${import.meta.env.VITE_PRINTER_API_URL}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storeId: selectedStore.value,
        printerId: printer.id
      })
    })

    showSnackbar({
      text: 'Test d\'impression envoyé avec succès',
      color: 'success'
    })
  } catch (error) {
    console.error('Erreur lors du test d\'impression:', error)
    showSnackbar({
      text: 'Erreur lors du test d\'impression',
      color: 'error'
    })
  }
}

// Initialisation
onMounted(async () => {
  await loadStores()
  await loadHistory()
})
</script>
