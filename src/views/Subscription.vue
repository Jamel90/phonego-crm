<template>
  <div class="subscription-page">
    <v-container>
      <!-- En-tête -->
      <div class="text-center mb-8">
        <h1 class="text-h3 font-weight-bold mb-2">Nos Forfaits</h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Choisissez le forfait qui correspond le mieux à vos besoins
        </p>
      </div>

      <!-- Plans d'abonnement -->
      <v-row>
        <v-col
          v-for="(plan, key) in SUBSCRIPTION_PLANS"
          :key="key"
          cols="12"
          md="6"
          lg="3"
        >
          <v-card
            :class="[
              'plan-card',
              { 'plan-current': currentPlan === key }
            ]"
            elevation="0"
          >
            <!-- En-tête du plan -->
            <div class="plan-header pa-6">
              <h2 class="text-h5 font-weight-bold mb-2">{{ plan.name }}</h2>
              <div class="price-section">
                <span class="text-h4 font-weight-bold">
                  {{ plan.price }}€
                  <span class="text-subtitle-1 font-weight-regular">/{{ plan.interval }}</span>
                </span>
              </div>
            </div>

            <v-divider></v-divider>

            <!-- Caractéristiques -->
            <v-card-text class="pa-6">
              <div class="limits-section mb-6">
                <div class="limit-item">
                  <v-icon icon="mdi-account-group" class="mr-2"></v-icon>
                  <span>{{ plan.maxUsers }} utilisateurs</span>
                </div>
                <div class="limit-item">
                  <v-icon icon="mdi-account" class="mr-2"></v-icon>
                  <span>{{ plan.maxClients }} clients</span>
                </div>
                <div class="limit-item">
                  <v-icon icon="mdi-wrench" class="mr-2"></v-icon>
                  <span>{{ plan.maxRepairs }} réparations</span>
                </div>
              </div>

              <v-list class="features-list">
                <v-list-item
                  v-for="(feature, index) in plan.features"
                  :key="index"
                  class="feature-item"
                  density="compact"
                >
                  <template v-slot:prepend>
                    <v-icon color="success" icon="mdi-check-circle" size="small"></v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">{{ feature }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>

            <!-- Bouton d'action -->
            <v-card-actions class="pa-6 pt-0">
              <v-btn
                :color="currentPlan === key ? 'success' : 'primary'"
                :variant="currentPlan === key ? 'tonal' : 'elevated'"
                block
                @click="handlePlanSelection(key)"
                :disabled="loading"
                :loading="loading && selectedPlan === key"
              >
                {{ currentPlan === key ? 'Plan actuel' : 'Sélectionner' }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Tableau comparatif des fonctionnalités -->
      <v-expansion-panels class="mt-16">
        <v-expansion-panel>
          <v-expansion-panel-title>
            Voir le tableau comparatif détaillé
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-table>
              <thead>
                <tr>
                  <th>Fonctionnalité</th>
                  <th v-for="(plan, key) in SUBSCRIPTION_PLANS" :key="key">
                    {{ plan.name }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Utilisateurs max</td>
                  <td v-for="(plan, key) in SUBSCRIPTION_PLANS" :key="key">
                    {{ plan.maxUsers }}
                  </td>
                </tr>
                <tr>
                  <td>Clients max</td>
                  <td v-for="(plan, key) in SUBSCRIPTION_PLANS" :key="key">
                    {{ plan.maxClients }}
                  </td>
                </tr>
                <tr>
                  <td>Réparations max</td>
                  <td v-for="(plan, key) in SUBSCRIPTION_PLANS" :key="key">
                    {{ plan.maxRepairs }}
                  </td>
                </tr>
                <!-- Autres fonctionnalités... -->
              </tbody>
            </v-table>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-container>

    <!-- Dialog de confirmation -->
    <v-dialog v-model="showConfirmDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">
          Confirmer le changement de plan
        </v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir passer au plan {{ selectedPlanName }} ?
          <template v-if="isUpgrade">
            Vous aurez accès à plus de fonctionnalités.
          </template>
          <template v-else>
            Attention, certaines fonctionnalités ne seront plus disponibles.
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showConfirmDialog = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            @click="confirmPlanChange"
            :loading="loading"
          >
            Confirmer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { ref, computed } from 'vue'
import { SUBSCRIPTION_PLANS } from '@/constants/plans'
import { useOrganizationStore } from '@/stores/organization'
import { createCheckoutSession } from '@/services/stripe'
import { useRouter } from 'vue-router'

const router = useRouter()
const organizationStore = useOrganizationStore()
const currentPlan = computed(() => organizationStore.currentPlan)
const loading = ref(false)
const selectedPlan = ref(null)
const showConfirmDialog = ref(false)
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const selectedPlanName = computed(() => {
  if (!selectedPlan.value) return ''
  return SUBSCRIPTION_PLANS[selectedPlan.value].name
})

const isUpgrade = computed(() => {
  if (!selectedPlan.value || !currentPlan.value) return true
  return SUBSCRIPTION_PLANS[selectedPlan.value].price > SUBSCRIPTION_PLANS[currentPlan.value].price
})

const handlePlanSelection = (plan) => {
  selectedPlan.value = plan
  showConfirmDialog.value = true
}

const confirmPlanChange = async () => {
  try {
    loading.value = true
    showConfirmDialog.value = false

    const plan = SUBSCRIPTION_PLANS[selectedPlan.value]
    await createCheckoutSession(plan.priceId)
  } catch (error) {
    console.error('Erreur lors du changement de plan:', error)
    snackbarColor.value = 'error'
    snackbarText.value = 'Une erreur est survenue lors du changement de plan'
    showSnackbar.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.subscription-page {
  background-color: var(--surface-color);
  min-height: 100%;
}

.plan-card {
  height: 100%;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.plan-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-4px);
}

.plan-current {
  border: 2px solid var(--primary-color);
  background-color: var(--active-color);
}

.plan-header {
  text-align: center;
}

.price-section {
  margin-top: 1rem;
}

.limits-section {
  border-radius: 8px;
  background-color: var(--surface-color);
  padding: 1rem;
}

.limit-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.features-list {
  background: transparent !important;
}

.feature-item {
  padding-left: 0;
  min-height: 36px;
}
</style>
