<template>
  <v-container fluid>
    <v-row>
      <!-- Statistiques générales -->
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1 mb-2">Total Boutiques</div>
            <div class="text-h4">{{ stats.totalStores }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1 mb-2">Total Utilisateurs</div>
            <div class="text-h4">{{ stats.totalUsers }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1 mb-2">Imprimantes Actives</div>
            <div class="text-h4">{{ stats.activePrinters }}</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1 mb-2">Abonnements Actifs</div>
            <div class="text-h4">{{ stats.activeSubscriptions }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <!-- Graphique des réparations -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Réparations par Boutique</v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="repairChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Activité récente -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Activité Récente</v-card-title>
          <v-list lines="one">
            <v-list-item
              v-for="activity in recentActivity"
              :key="activity.id"
              :title="activity.title"
              :subtitle="activity.timestamp"
            >
              <template v-slot:prepend>
                <v-avatar
                  :color="activity.color"
                  size="36"
                >
                  <v-icon
                    :icon="activity.icon"
                    color="white"
                    size="small"
                  />
                </v-avatar>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { db } from '@/firebase'
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'
import { ROLES } from '@/constants/roles'

// Enregistrement des composants ECharts
use([
  CanvasRenderer,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent
])

// Statistiques
const stats = ref({
  totalStores: 0,
  totalUsers: 0,
  activePrinters: 0,
  activeSubscriptions: 0
})

// Configuration du graphique des réparations
const repairChartOption = ref({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  legend: {
    data: ['En attente', 'En cours', 'Terminées']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: 'En attente',
      type: 'bar',
      stack: 'total',
      data: []
    },
    {
      name: 'En cours',
      type: 'bar',
      stack: 'total',
      data: []
    },
    {
      name: 'Terminées',
      type: 'bar',
      stack: 'total',
      data: []
    }
  ]
})

// Activité récente
const recentActivity = ref([])

// Chargement des statistiques
const loadStats = async () => {
  try {
    await checkPermissions()
    
    console.log('État de l\'authentification:', useAuthStore().user)
    console.log('Rôle de l\'utilisateur:', useAuthStore().user?.role)
    
    // Nombre total de boutiques
    const storesSnapshot = await getDocs(collection(db, 'stores'))
    stats.value.totalStores = storesSnapshot.size

    // Nombre total d'utilisateurs
    const usersSnapshot = await getDocs(collection(db, 'users'))
    stats.value.totalUsers = usersSnapshot.size

    // Nombre d'imprimantes actives
    const printersSnapshot = await getDocs(
      query(collection(db, 'printers'), where('status', '==', 'connected'))
    )
    stats.value.activePrinters = printersSnapshot.size

    // Nombre d'abonnements actifs
    const subscriptionsSnapshot = await getDocs(
      query(collection(db, 'subscriptions'), where('status', '==', 'active'))
    )
    stats.value.activeSubscriptions = subscriptionsSnapshot.size
  } catch (error) {
    console.error('Erreur lors du chargement des statistiques:', error)
  }
}

// Chargement des données du graphique
const loadRepairChart = async () => {
  try {
    const storesSnapshot = await getDocs(collection(db, 'stores'))
    const storesData = []
    const pendingData = []
    const inProgressData = []
    const completedData = []

    for (const storeDoc of storesSnapshot.docs) {
      const storeName = storeDoc.data().name
      storesData.push(storeName)

      const repairsSnapshot = await getDocs(
        collection(db, `stores/${storeDoc.id}/repairs`)
      )

      let pending = 0
      let inProgress = 0
      let completed = 0

      repairsSnapshot.forEach(doc => {
        const status = doc.data().status
        if (status === 'pending') pending++
        else if (status === 'in_progress') inProgress++
        else if (status === 'completed') completed++
      })

      pendingData.push(pending)
      inProgressData.push(inProgress)
      completedData.push(completed)
    }

    repairChartOption.value.xAxis.data = storesData
    repairChartOption.value.series[0].data = pendingData
    repairChartOption.value.series[1].data = inProgressData
    repairChartOption.value.series[2].data = completedData
  } catch (error) {
    console.error('Erreur lors du chargement du graphique:', error)
  }
}

// Chargement de l'activité récente
const loadRecentActivity = async () => {
  try {
    const activities = []
    
    // Dernières réparations
    const repairsSnapshot = await getDocs(
      query(
        collection(db, 'repairs'),
        orderBy('createdAt', 'desc'),
        limit(5)
      )
    )

    repairsSnapshot.forEach(doc => {
      const data = doc.data()
      activities.push({
        id: doc.id,
        title: `Nouvelle réparation - ${data.deviceName}`,
        timestamp: formatDate(data.createdAt),
        icon: 'mdi-wrench',
        color: 'primary'
      })
    })

    // Dernières connexions utilisateurs
    const logsSnapshot = await getDocs(
      query(
        collection(db, 'activity_logs'),
        where('type', '==', 'login'),
        orderBy('timestamp', 'desc'),
        limit(5)
      )
    )

    logsSnapshot.forEach(doc => {
      const data = doc.data()
      activities.push({
        id: doc.id,
        title: `Connexion - ${data.userName}`,
        timestamp: formatDate(data.timestamp),
        icon: 'mdi-account',
        color: 'success'
      })
    })

    // Tri par date
    activities.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )

    recentActivity.value = activities.slice(0, 5)
  } catch (error) {
    console.error('Erreur lors du chargement de l\'activité récente:', error)
  }
}

// Vérifier les permissions
const checkPermissions = () => {
  console.log('Vérification des permissions...')
  console.log('User:', useAuthStore().user)
  console.log('Role:', useAuthStore().user?.role)
  console.log('Is Super Admin:', useAuthStore().isSuperAdmin)
  
  if (!useAuthStore().isSuperAdmin) {
    console.error('Accès non autorisé: rôle super admin requis')
    throw new Error('Accès non autorisé')
  }
}

// Formatage de la date
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  
  try {
    const date = timestamp instanceof Timestamp ? 
      timestamp.toDate() : 
      (typeof timestamp === 'object' ? timestamp : new Date(timestamp))
      
    if (isNaN(date.getTime())) {
      return ''
    }
    
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date)
  } catch (error) {
    console.error('Erreur de formatage de date:', error)
    return ''
  }
}

// Chargement initial des données
onMounted(async () => {
  await Promise.all([
    loadStats(),
    loadRepairChart(),
    loadRecentActivity()
  ])
})
</script>

<style scoped>
.chart {
  height: 400px;
}
</style>
