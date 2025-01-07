<template>
  <VCard class="chart-card">
    <VCardTitle class="d-flex align-center py-4 px-6">
      <div>
        <h2 class="text-h6 font-weight-bold mb-1">Évolution des revenus</h2>
        <p class="text-subtitle-2 text-medium-emphasis mb-0">
          Par type de paiement
        </p>
      </div>
      <VSpacer />
      <VSelect
        v-model="selectedView"
        :items="viewOptions"
        density="compact"
        hide-details
        class="max-width-150"
      />
    </VCardTitle>
    <VCardText>
      <v-chart
        class="chart"
        :option="chartOptions"
        :autoresize="true"
      />
    </VCardText>
  </VCard>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ECharts from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  GraphicComponent
} from 'echarts/components'

// Enregistrer les composants ECharts nécessaires
use([
  CanvasRenderer,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  GraphicComponent
])

import { formatPrice } from '@/utils/formatters'

const props = defineProps({
  repairs: {
    type: Array,
    required: true
  },
  period: {
    type: String,
    default: 'month'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const selectedView = ref('monthly')
const viewOptions = [
  { title: 'Par mois', value: 'monthly' },
  { title: 'Par semaine', value: 'weekly' },
  { title: 'Par jour', value: 'daily' }
]

const paymentTypes = [
  { name: 'Espèces', value: 'especes', color: '#4CAF50' },
  { name: 'Carte bancaire', value: 'carte_bancaire', color: '#2196F3' },
  { name: 'Virement', value: 'virement', color: '#9C27B0' },
  { name: 'Chèque', value: 'cheque', color: '#FF9800' }
]

// Fonction pour convertir les dates Firestore
function convertFirestoreDate(timestamp) {
  if (!timestamp || !timestamp.toDate) return null
  return timestamp.toDate()
}

// Fonction pour formater la date selon la vue sélectionnée
function formatDate(date, view) {
  const options = {
    monthly: { month: 'short', year: 'numeric' },
    weekly: { day: 'numeric', month: 'short' },
    daily: { day: 'numeric', month: 'short' }
  }
  return new Intl.DateTimeFormat('fr-FR', options[view]).format(date)
}

// Fonction pour normaliser le type de paiement
const normalizePaymentType = (type) => {
  if (!type) return 'especes' // Valeur par défaut
  return type.toLowerCase().replace(/[\s-]/g, '_')
}

const groupRepairsByPeriod = ({ repairs, nombreReperations, vue }) => {
  console.log('Groupement des réparations par période:', { nombreReperations, vue })
  
  const groups = {}
  const today = new Date()
  
  // Initialiser les 6 derniers mois
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    groups[key] = {}
    // Initialiser tous les types de paiement à 0
    paymentTypes.forEach(type => {
      groups[key][type.value] = 0
    })
  }

  // Grouper les réparations
  repairs.forEach(repair => {
    console.log('Données de paiement:', {
      id: repair.id,
      price: repair.price,
      paymentType: repair.paymentType,
      date: repair.createdAt
    })

    if (!repair.createdAt || !repair.price) {
      console.warn('Réparation ignorée car données manquantes:', repair.id)
      return
    }

    const repairDate = repair.createdAt instanceof Date ? repair.createdAt : new Date(repair.createdAt)
    const monthKey = `${repairDate.getFullYear()}-${String(repairDate.getMonth() + 1).padStart(2, '0')}`
    
    if (groups[monthKey]) {
      const normalizedType = normalizePaymentType(repair.paymentType)
      const amount = parseFloat(repair.price) || 0
      groups[monthKey][normalizedType] += amount
      console.log(`Ajout de ${amount}€ au groupe ${monthKey} pour ${normalizedType} (original: ${repair.paymentType})`)
    }
  })

  return Object.entries(groups).map(([date, data]) => ({
    date,
    ...data
  }))
}

const chartOptions = computed(() => {
  console.log('Calcul des options du graphique...')
  const groupedData = groupRepairsByPeriod({ repairs: props.repairs, nombreReperations: props.repairs.length, vue: selectedView.value })
  
  const labels = groupedData.map(data => formatDate(new Date(data.date), selectedView.value))
  console.log('Labels:', labels)

  const series = paymentTypes.map(type => {
    const data = groupedData.map(d => d[type.value])
    console.log(`Données pour ${type.name}:`, data)
    return {
      name: type.name,
      type: 'bar',
      stack: 'total',
      barWidth: '60%',
      itemStyle: {
        color: type.color,
        borderRadius: [4, 4, 0, 0]
      },
      emphasis: {
        focus: 'series'
      },
      data
    }
  })

  const hasData = series.some(s => s.data.some(v => v > 0))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        let tooltip = `<div style="font-weight: bold; margin-bottom: 5px;">${params[0].axisValue}</div>`
        let total = 0
        
        params.forEach(param => {
          if (param.value > 0) {
            tooltip += `<div style="display: flex; justify-content: space-between; margin: 3px 0;">
              <span style="margin-right: 15px;">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${param.color}; margin-right: 5px;"></span>
                ${param.seriesName}:
              </span>
              <span style="font-weight: bold;">${formatPrice(param.value)}</span>
            </div>`
            total += param.value
          }
        })
        
        if (total > 0) {
          tooltip += `<div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.2);">
            <div style="display: flex; justify-content: space-between;">
              <span>Total:</span>
              <span style="font-weight: bold;">${formatPrice(total)}</span>
            </div>
          </div>`
        }
        
        return tooltip
      }
    },
    legend: {
      data: paymentTypes.map(type => type.name),
      top: '0%',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        fontSize: 12
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: {
        lineStyle: {
          color: '#E0E0E0'
        }
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#E0E0E0',
          type: 'dashed'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        formatter: (value) => formatPrice(value)
      }
    },
    series,
    graphic: !hasData ? [{
      type: 'text',
      left: 'center',
      top: 'middle',
      style: {
        text: 'Aucune donnée pour la période sélectionnée',
        fill: '#999',
        fontSize: 14
      }
    }] : undefined
  }
})

// Recharger les données quand la vue change
watch(selectedView, () => {
  // Le graphique se mettra à jour automatiquement grâce au computed
})

// Recharger les données quand les réparations changent
watch(() => props.repairs, () => {
  // Le graphique se mettra à jour automatiquement grâce au computed
}, { deep: true })
</script>

<style scoped>
.chart-card {
  height: 100%;
}

.chart {
  height: 400px;
  width: 100%;
}

.max-width-150 {
  max-width: 150px;
}
</style>
