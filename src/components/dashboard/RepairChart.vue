<template>
  <v-card>
    <v-card-text>
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6">Évolution des réparations</h3>
        <v-btn-group>
          <v-btn
            v-for="period in periods"
            :key="period.value"
            :variant="selectedPeriod === period.value ? 'tonal' : 'text'"
            color="primary"
            @click="selectedPeriod = period.value"
          >
            {{ period.label }}
          </v-btn>
        </v-btn-group>
      </div>
      <Line
        v-if="chartData"
        :data="chartData"
        :options="chartOptions"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { repairService } from '@/services/repair.service'

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Props
const props = defineProps({
  height: {
    type: Number,
    default: 300
  }
})

// État
const selectedPeriod = ref('week')
const chartData = ref(null)
const loading = ref(false)

// Périodes disponibles
const periods = [
  { label: '7J', value: 'week' },
  { label: '30J', value: 'month' },
  { label: '90J', value: 'quarter' }
]

// Options du graphique
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  }
}

// Charger les données du graphique
const loadChartData = async () => {
  try {
    loading.value = true
    const data = await repairService.getRepairStats(selectedPeriod.value)
    
    chartData.value = {
      labels: data.labels,
      datasets: [
        {
          label: 'Réparations',
          data: data.values,
          fill: true,
          borderColor: '#1867C0',
          backgroundColor: 'rgba(24, 103, 192, 0.1)',
          tension: 0.4
        }
      ]
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données du graphique:', error)
  } finally {
    loading.value = false
  }
}

// Watch pour recharger les données quand la période change
watch(selectedPeriod, () => {
  loadChartData()
})

// Charger les données initiales
onMounted(() => {
  loadChartData()
})
</script>
