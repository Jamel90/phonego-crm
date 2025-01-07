<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      {{ title }}
      <v-spacer></v-spacer>
      <v-btn-group density="compact">
        <v-btn
          v-for="period in periods"
          :key="period.value"
          :variant="selectedPeriod === period.value ? 'elevated' : 'text'"
          @click="selectedPeriod = period.value"
          size="small"
        >
          {{ period.label }}
        </v-btn>
      </v-btn-group>
    </v-card-title>
    <v-card-text>
      <v-progress-circular
        v-if="loading"
        indeterminate
        color="primary"
        class="ma-4"
      ></v-progress-circular>
      <div v-else>
        <canvas ref="chartRef"></canvas>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/firebase'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    validator: (value) => ['subscriptions', 'revenue', 'retention'].includes(value)
  }
})

const chartRef = ref(null)
const loading = ref(true)
const chart = ref(null)
const selectedPeriod = ref('month')

const periods = [
  { label: '7J', value: 'week' },
  { label: '1M', value: 'month' },
  { label: '3M', value: 'quarter' },
  { label: '1A', value: 'year' }
]

const colors = {
  primary: '#1976D2',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#FF5252'
}

function getDateRange(period) {
  const now = new Date()
  const start = new Date()
  
  switch (period) {
    case 'week':
      start.setDate(now.getDate() - 7)
      break
    case 'month':
      start.setMonth(now.getMonth() - 1)
      break
    case 'quarter':
      start.setMonth(now.getMonth() - 3)
      break
    case 'year':
      start.setFullYear(now.getFullYear() - 1)
      break
  }
  
  return { start, end: now }
}

async function fetchData() {
  loading.value = true
  const { start, end } = getDateRange(selectedPeriod.value)
  
  try {
    let data = []
    switch (props.type) {
      case 'subscriptions':
        data = await fetchSubscriptionData(start, end)
        break
      case 'revenue':
        data = await fetchRevenueData(start, end)
        break
      case 'retention':
        data = await fetchRetentionData(start, end)
        break
    }
    
    updateChart(data)
  } catch (error) {
    console.error('Error fetching chart data:', error)
  } finally {
    loading.value = false
  }
}

async function fetchSubscriptionData(start, end) {
  const usersRef = collection(db, 'users')
  const q = query(
    usersRef,
    where('createdAt', '>=', start),
    where('createdAt', '<=', end),
    orderBy('createdAt')
  )
  
  const snapshot = await getDocs(q)
  const subscriptionsByDate = {}
  
  snapshot.forEach(doc => {
    const data = doc.data()
    const date = new Date(data.createdAt.toDate()).toLocaleDateString()
    subscriptionsByDate[date] = (subscriptionsByDate[date] || 0) + 1
  })
  
  return {
    labels: Object.keys(subscriptionsByDate),
    datasets: [{
      label: 'Nouveaux abonnements',
      data: Object.values(subscriptionsByDate),
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
      tension: 0.4,
      fill: true
    }]
  }
}

async function fetchRevenueData(start, end) {
  const paymentsRef = collection(db, 'payments')
  const q = query(
    paymentsRef,
    where('date', '>=', start),
    where('date', '<=', end),
    orderBy('date')
  )
  
  const snapshot = await getDocs(q)
  const revenueByDate = {}
  
  snapshot.forEach(doc => {
    const data = doc.data()
    const date = new Date(data.date.toDate()).toLocaleDateString()
    revenueByDate[date] = (revenueByDate[date] || 0) + data.amount
  })
  
  return {
    labels: Object.keys(revenueByDate),
    datasets: [{
      label: 'Revenus (€)',
      data: Object.values(revenueByDate),
      borderColor: colors.success,
      backgroundColor: colors.success + '20',
      tension: 0.4,
      fill: true
    }]
  }
}

async function fetchRetentionData(start, end) {
  const usersRef = collection(db, 'users')
  const q = query(
    usersRef,
    where('createdAt', '>=', start),
    where('createdAt', '<=', end),
    orderBy('createdAt')
  )
  
  const snapshot = await getDocs(q)
  const retentionByDate = {}
  const totalByDate = {}
  
  snapshot.forEach(doc => {
    const data = doc.data()
    const date = new Date(data.createdAt.toDate()).toLocaleDateString()
    totalByDate[date] = (totalByDate[date] || 0) + 1
    if (data.status === 'active') {
      retentionByDate[date] = (retentionByDate[date] || 0) + 1
    }
  })
  
  const retentionRates = Object.keys(totalByDate).map(date => {
    return (retentionByDate[date] || 0) / totalByDate[date] * 100
  })
  
  return {
    labels: Object.keys(totalByDate),
    datasets: [{
      label: 'Taux de rétention (%)',
      data: retentionRates,
      borderColor: colors.warning,
      backgroundColor: colors.warning + '20',
      tension: 0.4,
      fill: true
    }]
  }
}

function updateChart(data) {
  // Ensure the chart is properly destroyed
  if (chart.value) {
    chart.value.destroy()
    chart.value = null
  }
  
  // Wait for the next tick to ensure the canvas is rendered
  nextTick(() => {
    const canvas = chartRef.value
    if (!canvas) {
      console.warn('Canvas element not found')
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.warn('Could not get 2D context from canvas')
      return
    }

    chart.value = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (props.type === 'revenue') {
                  return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                } else if (props.type === 'retention') {
                  return value + '%'
                }
                return value
              }
            }
          }
        }
      }
    })
  })
}

watch(selectedPeriod, () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
canvas {
  min-height: 300px;
}
</style>
