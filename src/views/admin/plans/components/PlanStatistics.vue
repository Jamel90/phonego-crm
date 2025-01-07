<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-chart-bar" class="mr-2" />
      Statistiques des Plans
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="4">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-h6 mb-2">Utilisateurs Actifs</div>
              <div class="d-flex align-center">
                <div class="text-h4 font-weight-bold">{{ totalActiveUsers }}</div>
                <v-chip
                  :color="userGrowthRate >= 0 ? 'success' : 'error'"
                  class="ml-2"
                  size="small"
                >
                  {{ userGrowthRate >= 0 ? '+' : '' }}{{ userGrowthRate }}%
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-h6 mb-2">Revenu Mensuel</div>
              <div class="d-flex align-center">
                <div class="text-h4 font-weight-bold">{{ formatPrice(monthlyRevenue) }}€</div>
                <v-chip
                  :color="revenueGrowthRate >= 0 ? 'success' : 'error'"
                  class="ml-2"
                  size="small"
                >
                  {{ revenueGrowthRate >= 0 ? '+' : '' }}{{ revenueGrowthRate }}%
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="outlined">
            <v-card-text>
              <div class="text-h6 mb-2">Taux de Conversion</div>
              <div class="d-flex align-center">
                <div class="text-h4 font-weight-bold">{{ conversionRate }}%</div>
                <v-chip
                  :color="conversionRateChange >= 0 ? 'success' : 'error'"
                  class="ml-2"
                  size="small"
                >
                  {{ conversionRateChange >= 0 ? '+' : '' }}{{ conversionRateChange }}%
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Graphique d'évolution -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-text>
              <canvas ref="chartRef" height="200"></canvas>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import Chart from 'chart.js/auto'

// Props
const props = defineProps({
  plans: {
    type: Array,
    required: true
  }
})

// Refs
const chartRef = ref(null)
let chart = null

// État
const totalActiveUsers = ref(0)
const userGrowthRate = ref(0)
const monthlyRevenue = ref(0)
const revenueGrowthRate = ref(0)
const conversionRate = ref(0)
const conversionRateChange = ref(0)

// Méthodes
const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

const calculateStatistics = async () => {
  try {
    // Récupérer tous les utilisateurs avec leurs plans
    const usersRef = collection(db, 'users')
    const usersSnapshot = await getDocs(usersRef)
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Calculer les statistiques
    totalActiveUsers.value = users.filter(user => user.planId).length
    monthlyRevenue.value = calculateMonthlyRevenue(users)
    conversionRate.value = calculateConversionRate(users)

    // Calculer les taux de croissance (exemple simple)
    userGrowthRate.value = 5 // À remplacer par un calcul réel
    revenueGrowthRate.value = 8 // À remplacer par un calcul réel
    conversionRateChange.value = 2 // À remplacer par un calcul réel

    // Mettre à jour le graphique
    updateChart(users)
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error)
  }
}

const calculateMonthlyRevenue = (users) => {
  return users.reduce((total, user) => {
    const userPlan = props.plans.find(plan => plan.id === user.planId)
    return total + (userPlan?.price || 0)
  }, 0)
}

const calculateConversionRate = (users) => {
  const totalUsers = users.length
  const paidUsers = users.filter(user => user.planId && user.planId !== 'free').length
  return totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0
}

const updateChart = (users) => {
  const ctx = chartRef.value?.getContext('2d')
  if (!ctx) return

  // Préparer les données pour le graphique
  const planLabels = props.plans.map(plan => plan.name)
  const planData = props.plans.map(plan => 
    users.filter(user => user.planId === plan.id).length
  )

  // Détruire le graphique existant si nécessaire
  if (chart) {
    chart.destroy()
  }

  // Créer un nouveau graphique
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: planLabels,
      datasets: [{
        label: 'Utilisateurs par Plan',
        data: planData,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  })
}

// Surveillance des changements
watch(() => props.plans, () => {
  calculateStatistics()
}, { deep: true })

// Initialisation
onMounted(() => {
  calculateStatistics()
})
</script>

<style scoped>
.v-card-text {
  position: relative;
}
</style>
