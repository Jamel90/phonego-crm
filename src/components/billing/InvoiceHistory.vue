<template>
  <div class="invoice-history">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>Historique des factures</span>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          color="primary"
          prepend-icon="mdi-refresh"
          :loading="loading"
          @click="loadInvoices"
        >
          Actualiser
        </v-btn>
      </v-card-title>

      <v-card-text>
        <div v-if="loading" class="d-flex justify-center py-4">
          <v-progress-circular indeterminate></v-progress-circular>
        </div>

        <div v-else-if="invoices.length === 0" class="text-center py-4">
          <v-icon
            icon="mdi-receipt-text-outline"
            size="48"
            class="mb-2 text-medium-emphasis"
          ></v-icon>
          <div class="text-body-1 text-medium-emphasis">
            Aucune facture disponible
          </div>
        </div>

        <v-table v-else>
          <thead>
            <tr>
              <th>Date</th>
              <th>Numéro</th>
              <th>Période</th>
              <th>Montant</th>
              <th>Statut</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="invoice in invoices" :key="invoice.id">
              <td>{{ formatDate(invoice.date) }}</td>
              <td>{{ invoice.number }}</td>
              <td>
                {{ formatDate(invoice.periodStart) }} - {{ formatDate(invoice.periodEnd) }}
              </td>
              <td>{{ formatAmount(invoice.amount) }}</td>
              <td>
                <v-chip
                  :color="getStatusColor(invoice.status)"
                  size="small"
                >
                  {{ getStatusLabel(invoice.status) }}
                </v-chip>
              </td>
              <td class="text-right">
                <v-btn
                  variant="text"
                  color="primary"
                  density="comfortable"
                  icon="mdi-download"
                  @click="downloadInvoice(invoice)"
                  :loading="downloadingInvoice === invoice.id"
                >
                  <v-tooltip activator="parent" location="top">
                    Télécharger la facture
                  </v-tooltip>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>

        <!-- Pagination -->
        <div class="d-flex align-center justify-space-between mt-4" v-if="totalPages > 1">
          <div class="text-caption text-medium-emphasis">
            {{ startIndex + 1 }}-{{ Math.min(endIndex, totalItems) }} sur {{ totalItems }}
          </div>
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="5"
            density="comfortable"
          ></v-pagination>
        </div>
      </v-card-text>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="4000"
    >
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="showSnackbar = false"
        >
          Fermer
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useOrganizationStore } from '@/stores/organization'

const organizationStore = useOrganizationStore()

// État
const loading = ref(false)
const invoices = ref([])
const currentPage = ref(1)
const itemsPerPage = 10
const totalItems = ref(0)
const downloadingInvoice = ref(null)
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Computed
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage)
const endIndex = computed(() => startIndex.value + itemsPerPage)

// Watch pour la pagination
watch(currentPage, () => {
  loadInvoices()
})

// Chargement initial
onMounted(() => {
  loadInvoices()
})

// Charger les factures
const loadInvoices = async () => {
  try {
    loading.value = true
    const result = await organizationStore.getInvoices({
      page: currentPage.value,
      limit: itemsPerPage
    })
    
    invoices.value = result.invoices
    totalItems.value = result.total
  } catch (error) {
    console.error('Erreur lors du chargement des factures:', error)
    showError('Impossible de charger les factures')
  } finally {
    loading.value = false
  }
}

// Télécharger une facture
const downloadInvoice = async (invoice) => {
  try {
    downloadingInvoice.value = invoice.id
    const url = await organizationStore.getInvoiceDownloadUrl(invoice.id)
    
    // Créer un lien temporaire pour le téléchargement
    const link = document.createElement('a')
    link.href = url
    link.download = `facture-${invoice.number}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showSuccess('Téléchargement démarré')
  } catch (error) {
    console.error('Erreur lors du téléchargement de la facture:', error)
    showError('Impossible de télécharger la facture')
  } finally {
    downloadingInvoice.value = null
  }
}

// Formater la date
const formatDate = (timestamp) => {
  return format(new Date(timestamp), 'dd MMM yyyy', { locale: fr })
}

// Formater le montant
const formatAmount = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount / 100)
}

// Obtenir la couleur du statut
const getStatusColor = (status) => {
  const colors = {
    paid: 'success',
    pending: 'warning',
    failed: 'error'
  }
  return colors[status] || 'grey'
}

// Obtenir le libellé du statut
const getStatusLabel = (status) => {
  const labels = {
    paid: 'Payée',
    pending: 'En attente',
    failed: 'Échec'
  }
  return labels[status] || status
}

// Utilitaires pour les notifications
const showSuccess = (message) => {
  snackbarText.value = message
  snackbarColor.value = 'success'
  showSnackbar.value = true
}

const showError = (message) => {
  snackbarText.value = message
  snackbarColor.value = 'error'
  showSnackbar.value = true
}
</script>

<style scoped>
.v-table {
  background: transparent !important;
}
</style>
