<template>
  <div class="billing-page">
    <v-container>
      <!-- En-tête -->
      <div class="mb-6">
        <h1 class="text-h4 font-weight-bold mb-2">Facturation</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Gérez vos informations de paiement et consultez vos factures
        </p>
      </div>

      <!-- Résumé de l'abonnement -->
      <v-card class="mb-6">
        <v-card-text>
          <div class="d-flex align-center flex-wrap">
            <div class="subscription-info flex-grow-1">
              <div class="text-subtitle-1 font-weight-medium mb-1">
                Plan actuel : {{ currentPlanName }}
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Prochain renouvellement le {{ formatDate(nextBillingDate) }}
              </div>
            </div>

            <div class="subscription-actions d-flex align-center">
              <div class="text-h5 font-weight-bold mr-4">
                {{ formatAmount(currentPlanPrice) }}/mois
              </div>
              <v-btn
                color="primary"
                :to="{ name: 'subscription' }"
              >
                Changer de plan
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Utilisation -->
      <v-card class="mb-6">
        <v-card-title>Utilisation du plan</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <div class="usage-item">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="text-body-2">Utilisateurs</span>
                  <span class="text-caption">
                    {{ usersCount }}/{{ maxUsers === 'illimité' ? '∞' : maxUsers }}
                  </span>
                </div>
                <v-progress-linear
                  :model-value="usersPercentage"
                  color="primary"
                  height="8"
                  rounded
                ></v-progress-linear>
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="usage-item">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="text-body-2">Clients</span>
                  <span class="text-caption">
                    {{ clientsCount }}/{{ maxClients === 'illimité' ? '∞' : maxClients }}
                  </span>
                </div>
                <v-progress-linear
                  :model-value="clientsPercentage"
                  color="primary"
                  height="8"
                  rounded
                ></v-progress-linear>
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="usage-item">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="text-body-2">Réparations</span>
                  <span class="text-caption">
                    {{ repairsCount }}/{{ maxRepairs === 'illimité' ? '∞' : maxRepairs }}
                  </span>
                </div>
                <v-progress-linear
                  :model-value="repairsPercentage"
                  color="primary"
                  height="8"
                  rounded
                ></v-progress-linear>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Mode de paiement -->
      <PaymentMethod class="mb-6" />

      <!-- Historique des factures -->
      <v-card>
        <v-card-title>Historique des factures</v-card-title>
        <v-card-text>
          <v-data-table
            :headers="invoiceHeaders"
            :items="invoices"
            :loading="loadingInvoices"
            no-data-text="Aucune facture disponible"
          >
            <template v-slot:item.amount="{ item }">
              {{ formatAmount(item.amount) }}
            </template>
            <template v-slot:item.date="{ item }">
              {{ formatDate(item.date) }}
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn
                icon
                variant="text"
                size="small"
                :href="item.url"
                target="_blank"
                :disabled="!item.url"
              >
                <v-icon>mdi-download</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOrganizationStore } from '@/stores/organization'
import { useSubscriptionStore } from '@/stores/subscription'
import { format, addMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import PaymentMethod from '@/components/billing/PaymentMethod.vue'

const organizationStore = useOrganizationStore()
const subscriptionStore = useSubscriptionStore()

const loadingInvoices = ref(false)
const invoices = ref([])

const invoiceHeaders = [
  { title: 'Date', key: 'date', align: 'start' },
  { title: 'Numéro', key: 'number', align: 'start' },
  { title: 'Montant', key: 'amount', align: 'end' },
  { title: 'Statut', key: 'status', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false }
]

// Computed pour les informations du plan
const currentPlan = computed(() => subscriptionStore.currentPlan)
const currentPlanName = computed(() => 
  currentPlan.value ? subscriptionStore.currentPlan.name : 'Gratuit'
)
const currentPlanPrice = computed(() => 
  currentPlan.value ? subscriptionStore.currentPlan.price : 0
)
const nextBillingDate = computed(() => 
  addMonths(new Date(organizationStore.currentOrg?.lastBillingDate || new Date()), 1)
)

// Computed pour les limites
const maxUsers = computed(() => subscriptionStore.currentPlan?.maxUsers || 0)
const maxClients = computed(() => subscriptionStore.currentPlan?.maxClients || 0)
const maxRepairs = computed(() => subscriptionStore.currentPlan?.maxRepairs || 0)

// Computed pour l'utilisation
const usersCount = computed(() => organizationStore.users?.length || 0)
const clientsCount = computed(() => organizationStore.clientsCount || 0)
const repairsCount = computed(() => organizationStore.repairsCount || 0)

// Computed pour les pourcentages d'utilisation
const calculatePercentage = (current, max) => {
  if (max === 'illimité' || max === 0) return 0
  return Math.min(Math.round((current / max) * 100), 100)
}

const usersPercentage = computed(() => calculatePercentage(usersCount.value, maxUsers.value))
const clientsPercentage = computed(() => calculatePercentage(clientsCount.value, maxClients.value))
const repairsPercentage = computed(() => calculatePercentage(repairsCount.value, maxRepairs.value))

// Formatage
const formatDate = (date) => {
  if (!date) return '-'
  return format(date, 'dd MMMM yyyy', { locale: fr })
}

const formatAmount = (amount) => {
  if (!amount) return '0 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

onMounted(async () => {
  loadingInvoices.value = true
  try {
    // Charger les factures depuis le store
    await subscriptionStore.fetchInvoices()
    invoices.value = subscriptionStore.invoices
  } catch (error) {
    console.error('Erreur lors du chargement des factures:', error)
  } finally {
    loadingInvoices.value = false
  }
})
</script>

<style scoped>
.billing-page {
  padding: 24px 0;
}

.usage-item {
  padding: 16px;
  border-radius: 8px;
  background-color: var(--v-surface-variant);
}

.usage-item .v-progress-linear {
  margin-top: 8px;
  border-radius: 4px;
}
</style>
