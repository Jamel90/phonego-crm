<template>
  <v-card class="mb-4">
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text>
      <div class="chart-container">
        <canvas :ref="canvasId" :id="canvasId"></canvas>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

Chart.register(...registerables)

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    validator: value => ['subscriptions', 'revenue', 'retention'].includes(value)
  }
})

const canvasId = ref(`chart-${props.type}`)
const chartInstance = ref(null)
const auth = useAuthStore()

const fetchData = async () => {
  if (!auth.isSuperAdmin) return { labels: [], values: [] }

  try {
    const subscriptionsRef = collection(db, 'subscriptions')
    let q = query(
      subscriptionsRef,
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const data = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return processData(data)
  } catch (error) {
    console.error('Error fetching chart data:', error)
    throw error
  }
}

const processData = (data) => {
  switch (props.type) {
    case 'subscriptions':
      return processSubscriptionsData(data)
    case 'revenue':
      return processRevenueData(data)
    case 'retention':
      return processRetentionData(data)
    default:
      return { labels: [], values: [] }
  }
}

const processSubscriptionsData = (data) => {
  const monthlyData = data.reduce((acc, sub) => {
    const date = new Date(sub.createdAt.seconds * 1000)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    acc[monthKey] = (acc[monthKey] || 0) + 1
    return acc
  }, {})

  return {
    labels: Object.keys(monthlyData),
    values: Object.values(monthlyData)
  }
}

const processRevenueData = (data) => {
  const monthlyRevenue = data.reduce((acc, sub) => {
    const date = new Date(sub.createdAt.seconds * 1000)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    acc[monthKey] = (acc[monthKey] || 0) + (sub.amount || 0)
    return acc
  }, {})

  return {
    labels: Object.keys(monthlyRevenue),
    values: Object.values(monthlyRevenue)
  }
}

const processRetentionData = (data) => {
  const monthlyRetention = data.reduce((acc, sub) => {
    if (sub.canceledAt) {
      const startDate = new Date(sub.createdAt.seconds * 1000)
      const endDate = new Date(sub.canceledAt.seconds * 1000)
      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`
      
      if (!acc[monthKey]) {
        acc[monthKey] = { total: 0, retained: 0 }
      }
      acc[monthKey].total++
      
      // Considérer comme retenu si l'abonnement a duré plus d'un mois
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        endDate.getMonth() - startDate.getMonth()
      if (months > 1) {
        acc[monthKey].retained++
      }
    }
    return acc
  }, {})

  // Calculer le pourcentage de rétention
  const retentionRates = Object.entries(monthlyRetention).reduce((acc, [month, data]) => {
    acc[month] = data.total > 0 ? (data.retained / data.total) * 100 : 0
    return acc
  }, {})

  return {
    labels: Object.keys(retentionRates),
    values: Object.values(retentionRates)
  }
}

const createChart = async (data) => {
  await nextTick()
  
  const canvas = document.getElementById(canvasId.value)
  if (!canvas) {
    console.error('Canvas element not found')
    return
  }

  const ctx = canvas.getContext('2d')
  
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  chartInstance.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: props.title,
        data: data.values,
        borderColor: '#1976D2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              if (props.type === 'revenue') {
                return new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(value)
              } else if (props.type === 'retention') {
                return `${value}%`
              }
              return value
            }
          }
        }
      }
    }
  })
}

const updateChart = async () => {
  try {
    const data = await fetchData()
    await createChart(data)
  } catch (error) {
    console.error('Error updating chart:', error)
  }
}

onMounted(async () => {
  await updateChart()
})

watch(() => props.type, updateChart)
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
