<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="headline">
            Gestion des imprimantes
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              @click="openAddDialog"
            >
              Ajouter une imprimante
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="printers"
              :loading="loading"
              class="elevation-1"
            >
              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon
                  small
                  @click="editPrinter(item)"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  small
                  :color="item.isDefault ? 'success' : ''"
                  @click="setDefaultPrinter(item)"
                >
                  <v-icon>mdi-star</v-icon>
                </v-btn>
                <v-btn
                  icon
                  small
                  color="error"
                  @click="deletePrinter(item)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Historique des impressions -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="headline">
            Historique des impressions
          </v-card-title>

          <v-card-text>
            <v-data-table
              :headers="historyHeaders"
              :items="printHistory"
              :loading="historyLoading"
              class="elevation-1"
            >
              <template v-slot:item.timestamp="{ item }">
                {{ formatDate(item.timestamp) }}
              </template>
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="getStatusColor(item.status)"
                  small
                >
                  {{ item.status }}
                </v-chip>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog d'ajout/modification -->
    <v-dialog
      v-model="dialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>
          {{ formTitle }}
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.name"
                  label="Nom de l'imprimante"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.ipAddress"
                  label="Adresse IP"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editedItem.type"
                  :items="printerTypes"
                  label="Type d'imprimante"
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
            text
            @click="closeDialog"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="savePrinter"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { printerService } from '@/services/printer/printer.service'
import { db } from '@/firebase'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default {
  name: 'PrinterManagement',

  setup() {
    const authStore = useAuthStore()
    const { showSnackbar } = useSnackbar()

    const loading = ref(false)
    const historyLoading = ref(false)
    const dialog = ref(false)
    const printers = ref([])
    const printHistory = ref([])

    const headers = [
      { text: 'Nom', value: 'name' },
      { text: 'Adresse IP', value: 'ipAddress' },
      { text: 'Type', value: 'type' },
      { text: 'Par défaut', value: 'isDefault' },
      { text: 'Actions', value: 'actions', sortable: false }
    ]

    const historyHeaders = [
      { text: 'Date', value: 'timestamp' },
      { text: 'Imprimante', value: 'printerName' },
      { text: 'Document', value: 'documentName' },
      { text: 'Statut', value: 'status' },
      { text: 'Utilisateur', value: 'userName' }
    ]

    const printerTypes = [
      'Thermique',
      'Laser',
      'Jet d\'encre'
    ]

    const editedItem = ref({
      name: '',
      ipAddress: '',
      type: '',
      isDefault: false
    })

    const defaultItem = {
      name: '',
      ipAddress: '',
      type: '',
      isDefault: false
    }

    const formTitle = computed(() => {
      return editedItem.value.id ? 'Modifier l\'imprimante' : 'Nouvelle imprimante'
    })

    // Chargement des imprimantes
    const loadPrinters = async () => {
      try {
        loading.value = true
        const printersList = await printerService.getPrinters()
        printers.value = printersList
      } catch (error) {
        showSnackbar({
          message: 'Erreur lors du chargement des imprimantes',
          color: 'error'
        })
        console.error('Erreur lors du chargement des imprimantes:', error)
      } finally {
        loading.value = false
      }
    }

    // Chargement de l'historique
    const loadHistory = async () => {
      try {
        historyLoading.value = true
        const storeId = authStore.storeId
        
        if (!storeId) {
          throw new Error('Aucune boutique sélectionnée')
        }

        const historyRef = collection(db, 'stores', storeId, 'printer_history')
        const q = query(
          historyRef,
          orderBy('timestamp', 'desc'),
          where('storeId', '==', storeId)
        )

        // Utiliser onSnapshot pour les mises à jour en temps réel
        const unsubscribe = onSnapshot(q, (snapshot) => {
          printHistory.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        }, (error) => {
          console.error('Erreur lors du chargement de l\'historique:', error)
          showSnackbar({
            message: 'Erreur lors du chargement de l\'historique',
            color: 'error'
          })
        })

        // Nettoyer l'abonnement lors du démontage du composant
        onMounted(() => {
          return () => unsubscribe()
        })
      } catch (error) {
        showSnackbar({
          message: 'Erreur lors du chargement de l\'historique',
          color: 'error'
        })
        console.error('Erreur lors du chargement de l\'historique:', error)
      } finally {
        historyLoading.value = false
      }
    }

    const openAddDialog = () => {
      editedItem.value = { ...defaultItem }
      dialog.value = true
    }

    const editPrinter = (item) => {
      editedItem.value = { ...item }
      dialog.value = true
    }

    const closeDialog = () => {
      dialog.value = false
      editedItem.value = { ...defaultItem }
    }

    const savePrinter = async () => {
      try {
        if (editedItem.value.id) {
          await printerService.updatePrinter(editedItem.value.id, editedItem.value)
          showSnackbar({
            message: 'Imprimante mise à jour avec succès',
            color: 'success'
          })
        } else {
          await printerService.addPrinter(editedItem.value)
          showSnackbar({
            message: 'Imprimante ajoutée avec succès',
            color: 'success'
          })
        }
        closeDialog()
        await loadPrinters()
      } catch (error) {
        showSnackbar({
          message: 'Erreur lors de l\'enregistrement de l\'imprimante',
          color: 'error'
        })
        console.error('Erreur lors de l\'enregistrement:', error)
      }
    }

    const setDefaultPrinter = async (item) => {
      try {
        await printerService.setDefaultPrinter(item.id)
        showSnackbar({
          message: 'Imprimante par défaut mise à jour',
          color: 'success'
        })
        await loadPrinters()
      } catch (error) {
        showSnackbar({
          message: 'Erreur lors de la mise à jour de l\'imprimante par défaut',
          color: 'error'
        })
        console.error('Erreur lors de la mise à jour:', error)
      }
    }

    const deletePrinter = async (item) => {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette imprimante ?')) {
        try {
          await printerService.deletePrinter(item.id)
          showSnackbar({
            message: 'Imprimante supprimée avec succès',
            color: 'success'
          })
          await loadPrinters()
        } catch (error) {
          showSnackbar({
            message: 'Erreur lors de la suppression de l\'imprimante',
            color: 'error'
          })
          console.error('Erreur lors de la suppression:', error)
        }
      }
    }

    const formatDate = (timestamp) => {
      if (!timestamp) return ''
      const date = timestamp.toDate()
      return format(date, 'PPpp', { locale: fr })
    }

    const getStatusColor = (status) => {
      const colors = {
        'success': 'success',
        'error': 'error',
        'pending': 'warning'
      }
      return colors[status] || 'grey'
    }

    // Chargement initial
    onMounted(() => {
      loadPrinters()
      loadHistory()
    })

    return {
      loading,
      historyLoading,
      dialog,
      printers,
      printHistory,
      headers,
      historyHeaders,
      printerTypes,
      editedItem,
      formTitle,
      openAddDialog,
      editPrinter,
      closeDialog,
      savePrinter,
      setDefaultPrinter,
      deletePrinter,
      formatDate,
      getStatusColor
    }
  }
}
</script>

<style scoped>
.v-data-table {
  width: 100%;
}
</style>
