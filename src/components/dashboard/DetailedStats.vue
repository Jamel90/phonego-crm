<template>
  <VCard elevation="2">
    <VCardTitle class="d-flex align-center py-4 px-6">
      <div>
        <h2 class="text-h6 font-weight-bold mb-1">Statistiques détaillées</h2>
        <p class="text-subtitle-2 text-medium-emphasis mb-0">
          Indicateurs de performance
        </p>
      </div>
    </VCardTitle>
    <VDivider></VDivider>
    <VList class="pa-0">
      <VListItem>
        <VListItemTitle>Ticket moyen</VListItemTitle>
        <template v-slot:append>
          <span class="text-h6 font-weight-bold">{{ formatPrice(averageTicket) }}</span>
        </template>
      </VListItem>
      <VDivider></VDivider>
      <VListItem>
        <VListItemTitle>Taux de réparation</VListItemTitle>
        <template v-slot:append>
          <span class="text-h6 font-weight-bold">{{ repairSuccessRate }}%</span>
        </template>
      </VListItem>
      <VDivider></VDivider>
      <VListItem>
        <VListItemTitle>Délai moyen de prise en charge</VListItemTitle>
        <template v-slot:append>
          <span class="text-h6 font-weight-bold">{{ averageResponseTime }} heures</span>
        </template>
      </VListItem>
      <VDivider></VDivider>
      <VListItem>
        <VListItemTitle>Temps moyen de réparation</VListItemTitle>
        <template v-slot:append>
          <span class="text-h6 font-weight-bold">{{ averageRepairTime }} jours</span>
        </template>
      </VListItem>
    </VList>
  </VCard>
</template>

<script setup>
import { computed } from 'vue'
import { formatPrice } from '@/utils/formatters'

const props = defineProps({
  repairs: {
    type: Array,
    required: true
  },
  period: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Fonction utilitaire pour convertir les dates Firestore
function convertFirestoreDate(date) {
  if (!date) return null
  if (date.toDate) return date.toDate()
  if (date instanceof Date) return date
  return null
}

const averageTicket = computed(() => {
  const completedRepairs = props.repairs.filter(r => r.status === 'termine')
  if (!completedRepairs.length) return 0

  const totalRevenue = completedRepairs.reduce((total, repair) => {
    const price = Number(repair.price) || 0
    return total + price
  }, 0)

  return totalRevenue / completedRepairs.length
})

const repairSuccessRate = computed(() => {
  const completedRepairs = props.repairs.filter(r => r.status === 'termine')
  const totalRepairs = props.repairs.filter(r => r.status !== 'nouveau') // Exclure les nouvelles réparations
  if (!totalRepairs.length) return 0
  return Math.round((completedRepairs.length / totalRepairs.length) * 100)
})

const averageResponseTime = computed(() => {
  const repairsWithStart = props.repairs.filter(r => r.startedAt && r.status !== 'nouveau')
  if (!repairsWithStart.length) return 0

  const totalHours = repairsWithStart.reduce((total, repair) => {
    const created = convertFirestoreDate(repair.createdAt)
    const started = convertFirestoreDate(repair.startedAt)
    if (!created || !started) return total

    const diffHours = Math.ceil((started - created) / (1000 * 60 * 60))
    // Ignorer les valeurs aberrantes (plus de 30 jours)
    return total + (diffHours > 720 ? 0 : diffHours)
  }, 0)

  return Math.round(totalHours / repairsWithStart.length)
})

const averageRepairTime = computed(() => {
  const completedRepairs = props.repairs.filter(r => {
    return r.status === 'termine' && r.startedAt && (r.completedAt || r.updatedAt)
  })
  if (!completedRepairs.length) return 0

  const totalDays = completedRepairs.reduce((total, repair) => {
    const started = convertFirestoreDate(repair.startedAt)
    const completed = convertFirestoreDate(repair.completedAt || repair.updatedAt)
    if (!started || !completed) return total

    const diffDays = Math.ceil((completed - started) / (1000 * 60 * 60 * 24))
    // Ignorer les valeurs aberrantes (plus de 90 jours)
    return total + (diffDays > 90 ? 0 : diffDays)
  }, 0)

  return Math.round(totalDays / completedRepairs.length)
})
</script>

<style scoped>
.stat-card {
  height: 100%;
}
</style>
