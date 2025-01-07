<template>
  <VRow class="mb-6">
    <VCol cols="12" class="d-flex align-center">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Tableau de bord</h1>
        <p class="text-subtitle-1 text-medium-emphasis">{{ formattedDate }}</p>
      </div>
      <VSpacer />
      <VSelect
        v-model="period"
        :items="periodOptions"
        label="Période"
        density="comfortable"
        class="max-width-150 mr-4"
        @update:model-value="$emit('update:period', $event)"
      />
      <VBtn
        color="primary"
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="$emit('refresh')"
      >
        Actualiser
      </VBtn>
    </VCol>
  </VRow>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: String,
    default: 'month'
  }
})

const emit = defineEmits(['update:period', 'refresh'])

const period = ref(props.modelValue)

const periodOptions = [
  { title: 'Cette semaine', value: 'week' },
  { title: 'Ce mois', value: 'month' },
  { title: 'Cette année', value: 'year' }
]

const formattedDate = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return new Date().toLocaleDateString('fr-FR', options)
})
</script>

<style scoped>
.max-width-150 {
  max-width: 150px;
}
</style>
