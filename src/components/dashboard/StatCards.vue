<template>
  <VRow>
    <VCol cols="12" sm="6" md="3">
      <VCard elevation="2" class="stat-card gradient-primary">
        <VCardText>
          <div class="d-flex justify-space-between align-center">
            <div>
              <p class="text-subtitle-2 font-weight-medium mb-1 text-white text-opacity-75">
                Réparations actives
              </p>
              <h3 class="text-h3 font-weight-bold text-white mb-0">
                {{ stats.repairs }}
              </h3>
            </div>
            <VIcon size="48" color="white" class="text-opacity-25">
              mdi-wrench
            </VIcon>
          </div>
          <VProgressLinear
            :model-value="repairProgress"
            color="white"
            height="4"
            class="mt-4"
          />
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12" sm="6" md="3">
      <VCard elevation="2" class="stat-card gradient-success">
        <VCardText>
          <div class="d-flex justify-space-between align-center">
            <div>
              <p class="text-subtitle-2 font-weight-medium mb-1 text-white text-opacity-75">
                Revenu total
              </p>
              <h3 class="text-h3 font-weight-bold text-white mb-0">
                {{ formatPrice(stats.revenue) }}
              </h3>
            </div>
            <VIcon size="48" color="white" class="text-opacity-25">
              mdi-currency-eur
            </VIcon>
          </div>
          <div class="d-flex align-center mt-4">
            <VIcon color="white" size="20" class="mr-1">
              {{ revenueGrowth >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
            </VIcon>
            <span class="text-white text-opacity-75">{{ revenueGrowth }}% ce mois</span>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12" sm="6" md="3">
      <VCard elevation="2" class="stat-card gradient-info">
        <VCardText>
          <div class="d-flex justify-space-between align-center">
            <div>
              <p class="text-subtitle-2 font-weight-medium mb-1 text-white text-opacity-75">
                Clients
              </p>
              <h3 class="text-h3 font-weight-bold text-white mb-0">
                {{ stats.clients }}
              </h3>
            </div>
            <VIcon size="48" color="white" class="text-opacity-25">
              mdi-account-group
            </VIcon>
          </div>
          <div class="d-flex align-center mt-4">
            <VIcon color="white" size="20" class="mr-1">
              mdi-account-plus
            </VIcon>
            <span class="text-white text-opacity-75">{{ newClients }} nouveaux ce mois</span>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12" sm="6" md="3">
      <VCard elevation="2" class="stat-card gradient-warning">
        <VCardText>
          <div class="d-flex justify-space-between align-center">
            <div>
              <p class="text-subtitle-2 font-weight-medium mb-1 text-white text-opacity-75">
                Réparations du mois
              </p>
              <h3 class="text-h3 font-weight-bold text-white mb-0">
                {{ repairsThisMonth }}
              </h3>
            </div>
            <VIcon size="48" color="white" class="text-opacity-25">
              mdi-calendar-month
            </VIcon>
          </div>
          <VProgressLinear
            :model-value="monthProgress"
            color="white"
            height="4"
            class="mt-4"
          />
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<script setup>
import { computed } from 'vue'
import { formatPrice } from '@/utils/formatters'

const props = defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      repairs: 0,
      revenue: 0,
      clients: 0,
      growth: 0
    })
  },
  repairProgress: {
    type: Number,
    default: 0
  },
  revenueGrowth: {
    type: Number,
    default: 0
  },
  newClients: {
    type: Number,
    default: 0
  },
  repairsThisMonth: {
    type: Number,
    default: 0
  }
})

// Calculer la progression du mois
const monthProgress = computed(() => {
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return Math.round((now.getDate() / daysInMonth) * 100)
})
</script>

<style scoped>
.stat-card {
  height: 100%;
  border-radius: 8px;
}

.gradient-primary {
  background: linear-gradient(45deg, #3949ab, #1e88e5);
}

.gradient-success {
  background: linear-gradient(45deg, #43a047, #66bb6a);
}

.gradient-info {
  background: linear-gradient(45deg, #00acc1, #26c6da);
}

.gradient-warning {
  background: linear-gradient(45deg, #fb8c00, #ffa726);
}
</style>
