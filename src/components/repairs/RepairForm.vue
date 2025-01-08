<template>
  <v-form ref="form" v-model="valid">
    <v-row>
      <!-- Client -->
      <v-col cols="12" sm="6">
        <div class="d-flex align-center gap-2">
          <v-select
            v-model="formData.customerId"
            :items="customers"
            item-title="fullName"
            item-value="id"
            label="Client"
            :rules="[v => !!v || 'Le client est requis']"
            :loading="loading"
            @update:model-value="handleCustomerChange"
          />
        </div>
      </v-col>

      <!-- Marque -->
      <v-col cols="12" sm="6">
        <v-select
          v-model="formData.manufacturer"
          :items="sortedManufacturers"
          item-title="name"
          item-value="name"
          label="Marque"
          :rules="[v => !!v || 'La marque est requise']"
          :loading="loading"
        />
      </v-col>

      <!-- Modèle -->
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="formData.model"
          label="Modèle"
          :rules="[v => !!v || 'Le modèle est requis']"
          :loading="loading"
        />
      </v-col>

      <!-- IMEI -->
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="formData.imei"
          label="IMEI"
          :rules="[
            v => !!v || 'L\'IMEI est requis',
            v => (v && v.length === 15) || 'L\'IMEI doit contenir 15 chiffres'
          ]"
          :loading="loading"
        />
      </v-col>

      <!-- Problèmes -->
      <v-col cols="12" sm="12">
        <v-autocomplete
          v-model="formData.issues"
          :items="availableIssues"
          item-title="name"
          item-value="name"
          label="Problèmes"
          multiple
          chips
          :rules="[v => v.length > 0 || 'Au moins un problème doit être sélectionné']"
          :loading="loading"
        >
          <template v-slot:chip="{ props, item }">
            <v-chip
              v-bind="props"
              :color="getIssueColor(formData.issues.indexOf(item.raw.name))"
            >
              {{ item.raw.name }}
            </v-chip>
          </template>
        </v-autocomplete>
      </v-col>

      <!-- Description -->
      <v-col cols="12">
        <v-textarea
          v-model="formData.description"
          label="Description"
          :rules="[v => !!v || 'La description est requise']"
          :loading="loading"
        />
      </v-col>

      <!-- Prix -->
      <v-col cols="12" sm="4">
        <v-text-field
          v-model.number="formData.price"
          label="Prix"
          type="number"
          prefix="€"
          :rules="[v => v > 0 || 'Le prix doit être supérieur à 0']"
          :loading="loading"
        />
      </v-col>

      <!-- Temps estimé -->
      <v-col cols="12" sm="4">
        <v-text-field
          v-model.number="formData.estimatedTime"
          label="Temps estimé (minutes)"
          type="number"
          :rules="[v => v > 0 || 'Le temps estimé doit être supérieur à 0']"
          :loading="loading"
        />
      </v-col>

      <!-- Priorité -->
      <v-col cols="12" sm="4">
        <v-select
          v-model="formData.priority"
          :items="priorities"
          label="Priorité"
          :rules="[v => !!v || 'La priorité est requise']"
          :loading="loading"
        />
      </v-col>
    </v-row>
  </v-form>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useCustomerStore } from '@/stores/customer'
import { useManufacturerStore } from '@/stores/manufacturer'
import { repairIssuesService } from '@/services/repair-issues.service'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// Stores
const customerStore = useCustomerStore()
const manufacturerStore = useManufacturerStore()

// État local
const valid = ref(false)
const form = ref(null)
const formData = ref({ ...props.modelValue })
const availableIssues = ref([])

// Charger les problèmes disponibles
const loadIssues = async () => {
  try {
    const issues = await repairIssuesService.getIssues()
    availableIssues.value = issues.map(issue => ({
      name: issue.name,
      ...issue
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des problèmes:', error)
  }
}

// Données disponibles
const customers = computed(() => customerStore.customers)
const manufacturers = computed(() => manufacturerStore.manufacturers)
const sortedManufacturers = computed(() => {
  return [...manufacturers.value].sort((a, b) => a.name.localeCompare(b.name))
})
const priorities = ['Basse', 'Moyenne', 'Haute']

// Méthodes
const handleCustomerChange = (customerId) => {
  const customer = customers.value.find(c => c.id === customerId)
  if (customer) {
    formData.value.customerName = customer.fullName
  }
}

const getIssueColor = (index) => {
  const colors = ['primary', 'secondary', 'success', 'info', 'warning']
  return colors[index % colors.length]
}

// Surveillance des changements
watch(formData, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

watch(() => props.modelValue, (newValue) => {
  formData.value = { ...newValue }
}, { deep: true })

// Charger les données au montage
onMounted(() => {
  loadIssues()
})

// Exposer les méthodes nécessaires
defineExpose({
  validate: () => form.value?.validate(),
  reset: () => form.value?.reset()
})
</script>
