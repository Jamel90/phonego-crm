<template>
  <div class="dashboard pa-6">
    <!-- Header avec filtres -->
    <DashboardHeader
      :loading="loading"
      v-model:period="selectedPeriod"
      @refresh="loadDashboardData"
    />

    <!-- Cartes de statistiques -->
    <StatCards
      :stats="stats"
      :repair-progress="repairProgress"
      :revenue-growth="revenueGrowth"
      :new-clients="newClients"
      :repairs-this-month="repairsThisMonth"
    />

    <!-- Statistiques détaillées -->
    <VRow class="mt-6">
      <VCol cols="12" md="8">
        <DetailedStats 
          :repairs="repairs" 
          :period="selectedPeriod"
          :loading="loading"
        />
      </VCol>
      <VCol cols="12" md="4">
        <TopRepairs 
          :repairs="repairs"
          :loading="loading"
        />
      </VCol>
    </VRow>

    <!-- Graphique des revenus -->
    <VRow class="mt-6">
      <VCol cols="12">
        <RevenueChart 
          :repairs="repairs"
          :period="selectedPeriod"
          :loading="loading"
        />
      </VCol>
    </VRow>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRepairStore } from '@/stores/repair'
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import StatCards from '@/components/dashboard/StatCards.vue'
import DetailedStats from '@/components/dashboard/DetailedStats.vue'
import TopRepairs from '@/components/dashboard/TopRepairs.vue'
import RevenueChart from '@/components/dashboard/RevenueChart.vue'

// État réactif
const authStore = useAuthStore()
const repairStore = useRepairStore()
const loading = ref(false)
const error = ref(null)
const repairs = ref([])
const stats = ref({
  repairs: 0,
  revenue: 0,
  clients: 0,
  growth: 0
})
const newClients = ref(0)
const revenueGrowth = ref(0)
const repairProgress = ref(0)
const repairsThisMonth = ref(0)
const selectedPeriod = ref('month')

// Chargement des données
const loadDashboardData = async () => {
  try {
    loading.value = true
    console.log('Chargement des données du tableau de bord...')
    const data = await repairStore.getDashboardData(selectedPeriod.value)
    console.log('Données reçues:', data)
    repairs.value = data.repairs
    stats.value = data.stats
    newClients.value = data.newClients
    revenueGrowth.value = data.revenueGrowth
    repairProgress.value = data.repairProgress
    repairsThisMonth.value = data.repairsThisMonth
    console.log('Données mises à jour:', {
      repairs: repairs.value.length,
      stats: stats.value,
      newClients: newClients.value,
      revenueGrowth: revenueGrowth.value,
      repairProgress: repairProgress.value,
      repairsThisMonth: repairsThisMonth.value
    })
  } catch (e) {
    error.value = e.message
    console.error('Erreur lors du chargement des données:', e)
  } finally {
    loading.value = false
  }
}

// Recharger les données quand la période change
watch(selectedPeriod, () => {
  loadDashboardData()
})

// Chargement initial
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard {
  height: 100%;
  overflow-y: auto;
}

.max-width-150 {
  max-width: 150px;
}

.stat-card {
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
