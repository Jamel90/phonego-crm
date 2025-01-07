<template>
  <div class="repair-status">
    <v-timeline density="compact" :align="align">
      <v-timeline-item
        v-for="(status, index) in statusList"
        :key="status.value"
        :dot-color="getDotColor(status.value)"
        :size="getSize(status.value)"
        :icon="status.icon"
      >
        <template v-slot:opposite>
          <div
            :class="[
              'text-caption',
              { 'text-primary': isCurrentStatus(status.value) }
            ]"
          >
            {{ status.date || '' }}
          </div>
        </template>
        <div
          :class="[
            'text-sm-body-2',
            { 'text-primary font-weight-bold': isCurrentStatus(status.value) }
          ]"
        >
          {{ status.title }}
        </div>
      </v-timeline-item>
    </v-timeline>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentStatus: {
    type: String,
    required: true
  },
  statusHistory: {
    type: Array,
    default: () => []
  },
  align: {
    type: String,
    default: 'start'
  }
})

const statusList = [
  {
    title: 'En attente',
    value: 'pending',
    icon: 'mdi-clock-outline'
  },
  {
    title: 'Diagnostic',
    value: 'diagnostic',
    icon: 'mdi-magnify'
  },
  {
    title: 'En cours',
    value: 'in-progress',
    icon: 'mdi-wrench'
  },
  {
    title: 'Test',
    value: 'testing',
    icon: 'mdi-check-circle-outline'
  },
  {
    title: 'Terminé',
    value: 'completed',
    icon: 'mdi-check-circle'
  }
]

const currentStatusIndex = computed(() => {
  return statusList.findIndex(status => status.value === props.currentStatus)
})

const isCurrentStatus = (status) => {
  return status === props.currentStatus
}

const getDotColor = (status) => {
  const index = statusList.findIndex(s => s.value === status)
  const currentIndex = currentStatusIndex.value

  if (index < currentIndex) return 'success'
  if (index === currentIndex) return 'primary'
  return 'grey'
}

const getSize = (status) => {
  return isCurrentStatus(status) ? 'small' : 'x-small'
}
</script>

<style scoped>
.repair-status {
  max-width: 100%;
  margin: 0 auto;
}

.text-primary {
  color: rgb(var(--v-theme-primary)) !important;
}
</style>
