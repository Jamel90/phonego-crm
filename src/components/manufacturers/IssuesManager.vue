<template>
  <div>
    <v-card-title class="text-subtitle-1">Problèmes fréquents</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <v-list>
            <v-list-item v-for="(issue, index) in issues" :key="index">
              <template v-slot:prepend>
                <v-icon color="primary">mdi-wrench</v-icon>
              </template>
              <v-list-item-title>
                {{ issue.name }}
              </v-list-item-title>
              <v-list-item-subtitle>
                Prix estimé: {{ formatPrice(issue.estimatedPrice) }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  color="error"
                  @click="removeIssue(index)"
                ></v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="newIssue.name"
            label="Nom du problème"
            hide-details
            class="mb-2"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model.number="newIssue.estimatedPrice"
            label="Prix estimé"
            type="number"
            hide-details
            class="mb-2"
            prefix="€"
          ></v-text-field>
        </v-col>
        <v-col cols="12">
          <v-btn
            block
            color="primary"
            variant="tonal"
            @click="addIssue"
            :disabled="!newIssue.name || !newIssue.estimatedPrice"
          >
            Ajouter un problème
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue'
import { formatPrice } from '@/utils/formatters'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const issues = ref([])
const newIssue = ref({
  name: '',
  estimatedPrice: null
})

// Synchroniser les problèmes avec la prop modelValue
watch(() => props.modelValue, (newValue) => {
  issues.value = [...newValue]
}, { immediate: true })

// Mettre à jour le parent quand les problèmes changent
watch(issues, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

const addIssue = () => {
  if (newIssue.value.name && newIssue.value.estimatedPrice) {
    issues.value.push({
      name: newIssue.value.name,
      estimatedPrice: Number(newIssue.value.estimatedPrice)
    })
    // Réinitialiser le formulaire
    newIssue.value = {
      name: '',
      estimatedPrice: null
    }
  }
}

const removeIssue = (index) => {
  issues.value.splice(index, 1)
}
</script>
