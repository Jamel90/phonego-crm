<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <h1 class="text-h4 font-weight-bold primary-gradient-text mb-1">Panneau d'Administration</h1>
            <p class="text-subtitle-1 text-medium-emphasis">Gestion des clients et abonnements</p>
          </div>
        </div>

        <v-tabs
          v-model="activeTab"
          color="primary"
          class="mb-6"
        >
          <v-tab value="dashboard">
            <v-icon start>mdi-view-dashboard</v-icon>
            Tableau de bord
          </v-tab>
          <v-tab value="analytics">
            <v-icon start>mdi-chart-box</v-icon>
            Analytiques
          </v-tab>
          <v-tab value="plans">
            <v-icon start>mdi-package-variant</v-icon>
            Plans
          </v-tab>
          <v-tab value="promotions">
            <v-icon start>mdi-ticket-percent</v-icon>
            Promotions
          </v-tab>
          <v-tab value="invoices">
            <v-icon start>mdi-file-document</v-icon>
            Factures
          </v-tab>
          <v-tab value="notifications">
            <v-icon start>mdi-bell</v-icon>
            Notifications
          </v-tab>
          <v-tab value="clients">
            <v-icon start>mdi-account-group</v-icon>
            Clients
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab">
          <v-window-item value="dashboard">
            <!-- Dashboard Content -->
            <v-row>
              <v-col cols="12" md="6" lg="3">
                <v-card class="mb-4">
                  <v-card-text class="stat-content">
                    <div class="stat-info">
                      <div class="stat-value">{{ stats[0].value }}</div>
                      <div class="stat-label">{{ stats[0].title }}</div>
                    </div>
                    <div class="stat-icon-container">
                      <v-icon :color="stats[0].color" size="large">{{ stats[0].icon }}</v-icon>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="6" lg="3">
                <v-card class="mb-4">
                  <v-card-text class="stat-content">
                    <div class="stat-info">
                      <div class="stat-value">{{ stats[1].value }}</div>
                      <div class="stat-label">{{ stats[1].title }}</div>
                    </div>
                    <div class="stat-icon-container">
                      <v-icon :color="stats[1].color" size="large">{{ stats[1].icon }}</v-icon>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="6" lg="3">
                <v-card class="mb-4">
                  <v-card-text class="stat-content">
                    <div class="stat-info">
                      <div class="stat-value">{{ stats[2].value }}</div>
                      <div class="stat-label">{{ stats[2].title }}</div>
                    </div>
                    <div class="stat-icon-container">
                      <v-icon :color="stats[2].color" size="large">{{ stats[2].icon }}</v-icon>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="6" lg="3">
                <v-card class="mb-4">
                  <v-card-text class="stat-content">
                    <div class="stat-info">
                      <div class="stat-value">{{ stats[3].value }}</div>
                      <div class="stat-label">{{ stats[3].title }}</div>
                    </div>
                    <div class="stat-icon-container">
                      <v-icon :color="stats[3].color" size="large">{{ stats[3].icon }}</v-icon>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <v-window-item value="analytics">
            <analytics />
          </v-window-item>

          <v-window-item value="plans">
            <PlansManager />
          </v-window-item>

          <v-window-item value="promotions">
            <promotions />
          </v-window-item>

          <v-window-item value="invoices">
            <invoices />
          </v-window-item>

          <v-window-item value="notifications">
            <notifications />
          </v-window-item>

          <v-window-item value="clients">
            <!-- Clients list -->
            <v-card>
              <v-card-title class="d-flex justify-space-between align-center py-3 px-4">
                <span class="text-h6">Clients</span>
                <v-text-field
                  v-model="search"
                  append-inner-icon="mdi-magnify"
                  label="Rechercher"
                  single-line
                  hide-details
                  density="compact"
                  class="search-field"
                  style="max-width: 300px"
                ></v-text-field>
              </v-card-title>

              <v-data-table
                :headers="headers"
                :items="clients"
                :loading="loading"
                :search="search"
                class="elevation-0"
                item-value="id"
              >
                <template v-slot:item.status="{ item }">
                  <v-chip
                    :color="getStatusColor(item.status)"
                    size="small"
                    class="text-capitalize"
                  >
                    {{ item.status || 'pending' }}
                  </v-chip>
                </template>

                <template v-slot:item.subscription="{ item }">
                  <v-chip
                    :color="getPlanColor(item.subscription)"
                    size="small"
                    variant="flat"
                    class="text-capitalize"
                  >
                    {{ item.subscription || 'basic' }}
                  </v-chip>
                </template>

                <template v-slot:item.actions="{ item }">
                  <v-btn
                    v-if="item.id"
                    icon
                    variant="text"
                    size="small"
                    :to="{ name: 'AdminClientDetails', params: { id: item.id }}"
                  >
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, query, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import PlansManager from './PlansManager.vue'
import analytics from './analytics.vue'
import promotions from './promotions.vue'
import invoices from './invoices.vue'
import notifications from './notifications.vue'

const components = {
  PlansManager,
  analytics,
  promotions,
  invoices,
  notifications
}

const search = ref('')
const loading = ref(true)
const clients = ref([])
const stats = computed(() => [
  {
    title: 'Clients Actifs',
    value: clients.value?.filter(c => c.status === 'active')?.length || 0,
    icon: 'mdi-account-check',
    color: 'success'
  },
  {
    title: 'Abonnements Premium',
    value: clients.value?.filter(c => c.subscription === 'premium')?.length || 0,
    icon: 'mdi-star',
    color: 'warning'
  },
  {
    title: 'Total Boutiques',
    value: clients.value?.reduce((acc, c) => acc + (c.stores || 0), 0) || 0,
    icon: 'mdi-store',
    color: 'info'
  },
  {
    title: 'Revenus Mensuels',
    value: formatPrice(calculateMonthlyRevenue()),
    icon: 'mdi-currency-eur',
    color: 'primary'
  }
])

const activeTab = ref('dashboard')

const headers = [
  { 
    title: 'Société',
    key: 'company',
    align: 'start',
  },
  { 
    title: 'Contact',
    key: 'contact',
  },
  { 
    title: 'Email',
    key: 'email',
  },
  { 
    title: 'Abonnement',
    key: 'subscription',
    align: 'center',
  },
  { 
    title: 'Statut',
    key: 'status',
    align: 'center',
  },
  { 
    title: 'Boutiques',
    key: 'stores',
    align: 'center',
  },
  { 
    title: 'Actions',
    key: 'actions',
    align: 'center',
    sortable: false,
  },
]

function getStatusColor(status) {
  const colors = {
    active: 'success',
    pending: 'warning',
    inactive: 'error'
  }
  return colors[status || 'pending'] || 'grey'
}

function getPlanColor(plan) {
  const colors = {
    basic: 'grey',
    premium: 'warning',
    enterprise: 'success'
  }
  return colors[plan || 'basic'] || 'grey'
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function calculateMonthlyRevenue() {
  if (!clients.value) return 0
  
  const prices = {
    basic: 29,
    premium: 79,
    enterprise: 199
  }
  
  return clients.value.reduce((acc, client) => {
    const plan = client.subscription || 'basic'
    return acc + (prices[plan] || prices.basic)
  }, 0)
}

async function loadClients() {
  try {
    loading.value = true
    const q = query(collection(db, 'users'))
    const snapshot = await getDocs(q)
    
    clients.value = snapshot.docs.map(doc => {
      const data = doc.data() || {}
      const client = {
        id: doc.id,
        company: data.company || 'N/A',
        contact: data.displayName || 'N/A',
        email: data.email || 'N/A',
        subscription: data.subscription?.plan || 'basic',
        status: data.status || 'pending',
        stores: data.stores?.length || 0
      }
      return client
    })
  } catch (error) {
    console.error('Error loading clients:', error)
    clients.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadClients()
})
</script>

<style scoped>
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.stat-card {
  height: 100%;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.875rem;
}

.stat-icon-container {
  background: rgba(var(--v-theme-primary), 0.1);
  padding: 1rem;
  border-radius: 50%;
}

.search-field {
  max-width: 300px;
}
</style>
