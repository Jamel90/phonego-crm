<template>
  <VCard elevation="2">
    <VCardTitle class="d-flex align-center py-4 px-6">
      <div>
        <h2 class="text-h6 font-weight-bold mb-1">Top des réparations</h2>
        <p class="text-subtitle-2 text-medium-emphasis mb-0">
          Appareils les plus réparés
        </p>
      </div>
    </VCardTitle>
    <VDivider></VDivider>
    <VList class="pa-0">
      <template v-if="!loading">
        <template v-for="(repair, index) in topRepairs" :key="index">
          <VListItem>
            <template v-slot:prepend>
              <VAvatar
                :color="getColorByIndex(index)"
                size="40"
              >
                <span class="text-h6 text-white">{{ index + 1 }}</span>
              </VAvatar>
            </template>
            <VListItemTitle class="font-weight-medium">
              {{ repair.device }}
            </VListItemTitle>
            <template v-slot:append>
              <div class="text-right">
                <div class="text-body-1 font-weight-medium">
                  {{ repair.count }} réparations
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ repair.percentage }}% du total
                </div>
              </div>
            </template>
          </VListItem>
          <VDivider v-if="index < topRepairs.length - 1"></VDivider>
        </template>
      </template>
      <VListItem v-else>
        <VSkeletonLoader
          type="list-item-avatar-two-line"
          :loading="loading"
        ></VSkeletonLoader>
      </VListItem>
    </VList>
  </VCard>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  repairs: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Fonction pour obtenir une couleur en fonction de l'index
function getColorByIndex(index) {
  const colors = ['success', 'info', 'warning', 'error', 'grey']
  return colors[index] || 'grey-lighten-1'
}

// Calculer les appareils les plus réparés
const topRepairs = computed(() => {
  // Grouper les réparations par modèle d'appareil
  const deviceCounts = props.repairs.reduce((acc, repair) => {
    const deviceName = getDeviceName(repair)
    acc[deviceName] = (acc[deviceName] || 0) + 1
    return acc
  }, {})

  // Convertir en tableau et trier
  const sortedDevices = Object.entries(deviceCounts)
    .map(([device, count]) => ({
      device,
      count,
      percentage: Math.round((count / props.repairs.length) * 100)
    }))
    .sort((a, b) => b.count - a.count)

  // Retourner les 5 premiers
  return sortedDevices.slice(0, 5)
})

// Fonction pour obtenir le nom de l'appareil
function getDeviceName(repair) {
  const brand = repair.manufacturer?.name || repair.manufacturerName || ''
  const model = repair.model || ''
  return [brand, model].filter(Boolean).join(' ') || 'Appareil inconnu'
}
</script>

<style scoped>
.stat-card {
  height: 100%;
}
</style>
