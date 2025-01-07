<template>
  <div class="dashboard pa-6">
    <!-- Header avec recherche et filtres -->
    <DashboardHeader />
    
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

    <!-- Cartes de statistiques -->
    <VRow>
      <StatCards 
        :stats="stats" 
        :new-clients="newClients" 
        :revenue-growth="revenueGrowth" 
        :repair-progress="repairProgress" 
        :repairs-this-month="repairsThisMonth" 
      />
    </VRow>

    <!-- Graphiques et tableaux -->
    <VRow class="mt-6">
      <VCol cols="12" md="8">
        <VCard class="chart-card">
          <VCardText>
            <VChart
              class="chart"
              :option="pieChartOptions"
              :autoresize="true"
            />
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" md="4">
        <VCard elevation="2" class="h-100">
          <VCardTitle class="d-flex align-center py-4 px-6">
            <div>
              <h2 class="text-h6 font-weight-bold mb-1">Réparations récentes</h2>
              <p class="text-subtitle-2 text-medium-emphasis mb-0">
                Dernières mises à jour
              </p>
            </div>
          </VCardTitle>
          <VDivider></VDivider>
          <VList class="pa-0">
            <template v-for="(repair, index) in recentRepairs" :key="repair.id">
              <VListItem
                :ripple="false"
                class="py-4 px-6 repair-item"
                @click="openRepairDialog(repair)"
                style="cursor: pointer;"
              >
                <template v-slot:prepend>
                  <VAvatar
                    color="grey-lighten-3"
                    class="mr-3"
                  >
                    <VIcon :color="getStatusColor(repair.status)" size="24">
                      {{ getStatusIcon(repair.status) }}
                    </VIcon>
                  </VAvatar>
                </template>

                <VListItemTitle class="text-subtitle-1 font-weight-medium mb-1">
                  {{ formatDeviceName(repair) }}
                </VListItemTitle>

                <VListItemSubtitle class="d-flex flex-column">
                  <div class="d-flex align-center mb-1">
                    <VIcon size="14" class="mr-1" color="medium-emphasis">
                      mdi-account
                    </VIcon>
                    <span class="text-medium-emphasis">{{ repair.customer?.name || 'Client inconnu' }}</span>
                  </div>
                  <div class="d-flex align-center">
                    <VIcon size="14" class="mr-1" color="medium-emphasis">
                      mdi-phone
                    </VIcon>
                    <span class="text-medium-emphasis">{{ repair.customer?.phone || 'N° non renseigné' }}</span>
                  </div>
                </VListItemSubtitle>

                <template v-slot:append>
                  <div class="text-right">
                    <VMenu>
                      <template v-slot:activator="{ props }">
                        <VChip
                          v-bind="props"
                          :color="getStatusColor(repair.status)"
                          size="small"
                          variant="tonal"
                          style="cursor: pointer;"
                        >
                          {{ formatStatus(repair.status) }}
                        </VChip>
                      </template>
                      <VList>
                        <VListItem
                          v-for="status in ['en_attente', 'en_cours', 'attente_pieces', 'termine', 'annule']"
                          :key="status"
                          :value="status"
                          @click="updateStatus(repair.id, status)"
                        >
                          <VListItemTitle>
                            <VChip
                              :color="getStatusColor(status)"
                              size="small"
                              variant="tonal"
                            >
                              {{ formatStatus(status) }}
                            </VChip>
                          </VListItemTitle>
                        </VListItem>
                      </VList>
                    </VMenu>

                    <VMenu>
                      <template v-slot:activator="{ props }">
                        <VChip
                          v-bind="props"
                          :color="repair.priority === 'high' ? 'error' : repair.priority === 'medium' ? 'warning' : 'success'"
                          size="small"
                          variant="tonal"
                          class="ml-2"
                          style="cursor: pointer;"
                        >
                          {{ repair.priority === 'high' ? 'Urgent' : repair.priority === 'medium' ? 'Normal' : 'Bas' }}
                        </VChip>
                      </template>
                      <VList>
                        <VListItem
                          v-for="priority in ['high', 'medium', 'low']"
                          :key="priority"
                          :value="priority"
                          @click="updatePriority(repair.id, priority)"
                        >
                          <VListItemTitle>
                            <VChip
                              :color="priority === 'high' ? 'error' : priority === 'medium' ? 'warning' : 'success'"
                              size="small"
                              variant="tonal"
                            >
                              {{ priority === 'high' ? 'Urgent' : priority === 'medium' ? 'Normal' : 'Bas' }}
                            </VChip>
                          </VListItemTitle>
                        </VListItem>
                      </VList>
                    </VMenu>

                    <div class="text-caption text-medium-emphasis">
                      {{ formatDate(repair.createdAt) }}
                    </div>
                  </div>
                </template>
              </VListItem>
              <VDivider
                v-if="index < recentRepairs.length - 1"
                :key="`divider-${repair.id}`"
              ></VDivider>
            </template>
          </VList>
        </VCard>
      </VCol>
    </VRow>

    <!-- Réparations urgentes et tâches -->
    <VRow class="mt-6">
      <VCol cols="12" md="6">
        <UrgentRepairs />
      </VCol>
      <VCol cols="12" md="6">
        <TaskList />
      </VCol>
    </VRow>

    <!-- État de l'abonnement -->
    <VRow class="mt-6">
      <VCol cols="12">
        <SubscriptionStatus />
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
    const data = await repairStore.getDashboardData(selectedPeriod.value)
    repairs.value = data.repairs
    stats.value = data.stats
    newClients.value = data.newClients
    revenueGrowth.value = data.revenueGrowth
    repairProgress.value = data.repairProgress
    repairsThisMonth.value = data.repairsThisMonth
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
  min-height: 100vh;
}

.chart {
  height: 400px;
  width: 100%;
}

.chart-card {
  height: 100%;
}

.stat-card {
  border-radius: 16px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.v-card {
  border-radius: 16px;
  transition: box-shadow 0.3s ease;
  background-color: rgb(var(--v-theme-surface)) !important;
}

.v-card:hover {
  box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important;
}

:deep(.v-list-item) {
  transition: background-color 0.2s ease;
}

:deep(.v-list-item:hover) {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.gradient-primary, .gradient-success, .gradient-info, .gradient-warning {
  position: relative;
  overflow: hidden;
}

.gradient-primary::after,
.gradient-success::after,
.gradient-info::after,
.gradient-warning::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  pointer-events: none;
}

:deep(.v-list) {
  background-color: transparent !important;
}

.repair-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

/* Empêcher la propagation du clic sur les éléments interactifs */
.v-menu,
.v-chip {
  pointer-events: auto;
}

.repair-item {
  pointer-events: none;
}
.repair-item > * {
  pointer-events: auto;
}

.stat-card {
  height: 100%;
  position: relative;
  overflow: hidden;
}

.gradient-primary {
  background: linear-gradient(45deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.8) 100%);
}

.gradient-info {
  background: linear-gradient(45deg, rgb(var(--v-theme-info)) 0%, rgba(var(--v-theme-info), 0.8) 100%);
}

.gradient-success {
  background: linear-gradient(45deg, rgb(var(--v-theme-success)) 0%, rgba(var(--v-theme-success), 0.8) 100%);
}

.gradient-warning {
  background: linear-gradient(135deg, #FF8008 0%, #FFC837 100%);
}

.chart-card {
  height: 100%;
}
</style>