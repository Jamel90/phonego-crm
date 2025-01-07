<template>
  <v-card class="subscription-status pa-4">
    <template v-if="subscription">
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h3 class="text-h6 font-weight-bold mb-1">
            Votre abonnement
          </h3>
          <p class="text-subtitle-1 text-medium-emphasis">
            {{ getPlanName }}
          </p>
        </div>
        <v-chip
          :color="getStatusColor"
          :text-color="getStatusTextColor"
          class="text-capitalize"
        >
          {{ getStatusText }}
        </v-chip>
      </div>

      <v-divider class="mb-4"></v-divider>

      <div class="mb-4">
        <p class="text-body-1 mb-2">
          <v-icon icon="mdi-calendar" class="mr-2"></v-icon>
          Prochaine échéance : {{ formatDate(subscription.currentPeriodEnd) }}
        </p>
        <p v-if="subscription.cancelAtPeriodEnd" class="text-body-2 text-warning">
          <v-icon icon="mdi-alert" class="mr-2"></v-icon>
          Votre abonnement sera annulé à la fin de la période
        </p>
      </div>

      <v-btn
        v-if="!subscription.cancelAtPeriodEnd"
        color="error"
        variant="outlined"
        block
        @click="handleCancel"
        :loading="loading"
      >
        Annuler l'abonnement
      </v-btn>
      <v-btn
        v-else
        color="primary"
        block
        :to="{ name: 'Pricing' }"
      >
        Renouveler l'abonnement
      </v-btn>
    </template>

    <template v-else>
      <div class="text-center">
        <v-icon icon="mdi-alert" size="48" color="warning" class="mb-4"></v-icon>
        <h3 class="text-h6 font-weight-bold mb-2">
          Aucun abonnement actif
        </h3>
        <p class="text-body-1 text-medium-emphasis mb-4">
          Choisissez un plan pour accéder à toutes les fonctionnalités
        </p>
        <v-btn
          color="primary"
          block
          :to="{ name: 'Pricing' }"
        >
          Voir les plans
        </v-btn>
      </div>
    </template>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { subscriptionService } from '@/services/subscription.service'
import { SUBSCRIPTION_PLANS } from '@/constants/plans'
import { useSnackbar } from '@/composables/useSnackbar'

const props = defineProps({
  subscription: {
    type: Object,
    default: null
  }
})

const loading = ref(false)
const { showSnackbar } = useSnackbar()

const getPlanName = computed(() => {
  if (!props.subscription?.priceId) return 'Plan inconnu'
  
  const plan = Object.values(SUBSCRIPTION_PLANS).find(
    plan => plan.priceId === props.subscription.priceId
  )
  return plan ? plan.name : 'Plan inconnu'
})

const getStatusColor = computed(() => {
  if (props.subscription?.cancelAtPeriodEnd) return 'warning'
  return props.subscription?.status === 'active' ? 'success' : 'error'
})

const getStatusTextColor = computed(() => {
  return 'white'
})

const getStatusText = computed(() => {
  if (props.subscription?.cancelAtPeriodEnd) return 'En cours d\'annulation'
  switch (props.subscription?.status) {
    case 'active':
      return 'Actif'
    case 'canceled':
      return 'Annulé'
    case 'unpaid':
      return 'Impayé'
    default:
      return 'Inactif'
  }
})

const formatDate = (date) => {
  if (!date) return 'Non disponible'
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const handleCancel = async () => {
  try {
    loading.value = true
    await subscriptionService.cancelSubscription()
    showSnackbar({
      text: 'Votre abonnement sera annulé à la fin de la période en cours',
      color: 'warning'
    })
  } catch (error) {
    showSnackbar({
      text: 'Erreur lors de l\'annulation de l\'abonnement',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.subscription-status {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
</style>
