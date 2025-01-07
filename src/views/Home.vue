<template>
  <v-container fluid class="pa-0">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <h1 class="text-h4 font-weight-bold primary-gradient-text mb-1">Tableau de bord</h1>
            <p class="text-subtitle-1 text-medium-emphasis">Aperçu de votre activité</p>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Stats Cards -->
    <div class="content-grid">
      <v-card 
        v-for="(stat, index) in [
          {
            value: stats.pendingRepairs,
            label: 'En cours',
            icon: 'mdi-wrench',
            iconColor: 'primary',
            group: 'repairs'
          },
          {
            value: stats.completedRepairs,
            label: 'Terminées',
            icon: 'mdi-check-circle',
            iconColor: 'success',
            group: 'repairs'
          },
          {
            value: stats.activeClients,
            label: 'Clients',
            icon: 'mdi-account-group',
            iconColor: 'info',
            group: 'clients'
          },
          {
            value: stats.lowStockItems,
            label: 'Stock faible',
            icon: 'mdi-alert',
            iconColor: 'error',
            group: 'inventory'
          }
        ]"
        :key="index"
        class="stat-card rounded-lg"
        elevation="2"
      >
        <v-card-text class="stat-content">
          <div class="stat-info">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
          <div class="stat-icon-container">
            <v-icon :color="stat.iconColor" class="stat-icon">{{ stat.icon }}</v-icon>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <v-row class="mt-4">
      <!-- Réparations récentes -->
      <v-col cols="12" md="6">
        <v-card class="rounded-lg" elevation="2">
          <v-card-title class="d-flex align-center py-3 px-4">
            <span class="text-h6 font-weight-bold">Réparations récentes</span>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :to="{ name: 'Repairs' }"
              variant="text"
              prepend-icon="mdi-chevron-right"
            >
              Voir tout
            </v-btn>
          </v-card-title>

          <v-card-text class="px-0">
            <v-table>
              <thead>
                <tr>
                  <th class="pl-4">Client</th>
                  <th>Appareil</th>
                  <th>Statut</th>
                  <th class="pr-4">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="repair in recentRepairs" :key="repair.id">
                  <td class="pl-4">{{ repair.clientName }}</td>
                  <td>{{ repair.deviceModel }}</td>
                  <td>
                    <v-chip
                      :color="getStatusColor(repair.status)"
                      size="small"
                      class="text-caption"
                    >
                      {{ repair.status }}
                    </v-chip>
                  </td>
                  <td class="pr-4">{{ formatDate(repair.createdAt) }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Stock faible -->
      <v-col cols="12" md="6">
        <v-card class="rounded-lg" elevation="2">
          <v-card-title class="d-flex align-center py-3 px-4">
            <span class="text-h6 font-weight-bold">Articles en stock faible</span>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :to="{ name: 'Inventory' }"
              variant="text"
              prepend-icon="mdi-chevron-right"
            >
              Voir tout
            </v-btn>
          </v-card-title>

          <v-card-text class="px-0">
            <v-table>
              <thead>
                <tr>
                  <th class="pl-4">Article</th>
                  <th>Quantité</th>
                  <th>Minimum</th>
                  <th class="pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in lowStockItems" :key="item.id">
                  <td class="pl-4">{{ item.name }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.minQuantity }}</td>
                  <td class="pr-4">
                    <v-btn
                      color="primary"
                      size="small"
                      variant="text"
                      prepend-icon="mdi-cart"
                      @click="orderItem(item)"
                    >
                      Commander
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { firestoreService } from '../services/firestore.service'

const stats = ref({
  pendingRepairs: 0,
  completedRepairs: 0,
  activeClients: 0,
  lowStockItems: 0
})

const recentRepairs = ref([])
const lowStockItems = ref([])

const loadDashboardData = async () => {
  try {
    // Charger les réparations récentes
    const repairs = await firestoreService.getAll('repairs', {
      orderBy: {
        field: 'createdAt',
        direction: 'desc'
      }
    })
    recentRepairs.value = repairs.slice(0, 5)

    // Charger les articles en stock faible
    const lowStock = await firestoreService.getLowStockItems()
    lowStockItems.value = lowStock

    // Calculer les statistiques
    const allRepairs = await firestoreService.getAll('repairs')
    const allClients = await firestoreService.getAll('clients')

    // Calculer les réparations en cours (tous les statuts sauf completed et cancelled)
    const inProgressStatuses = ['new', 'pending', 'diagnostic', 'waiting_parts', 'ready_repair', 'in_progress', 'testing']
    
    stats.value = {
      pendingRepairs: allRepairs.filter(r => inProgressStatuses.includes(r.status)).length,
      completedRepairs: allRepairs.filter(r => r.status === 'completed').length,
      activeClients: allClients.length,
      lowStockItems: lowStock.length
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
  }
}

const getStatusColor = (status) => {
  const colors = {
    new: 'grey',
    pending: 'warning',
    diagnostic: 'info-lighten-1',
    waiting_parts: 'warning-lighten-1',
    ready_repair: 'info',
    in_progress: 'primary',
    testing: 'purple',
    completed: 'success',
    cancelled: 'error'
  }
  return colors[status] || 'grey'
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate()
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

const orderItem = (item) => {
  // TODO: Implémenter la logique de commande
  console.log('Commander:', item)
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.stat-card {
  height: 100%;
  border-radius: 12px;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
}

.stat-label {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.875rem;
}

.stat-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(var(--v-theme-primary), 0.1);
}

.stat-icon {
  font-size: 24px;
}

:deep(.v-data-table-header__content) {
  justify-content: center;
}

:deep(.v-data-table__td) {
  white-space: nowrap;
}
</style>
