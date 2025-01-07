<!-- Sauvegarde du 14/12/2023 -->
<template>
  <div>
    <v-dialog
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      @click:outside="closeDialog"
      max-width="800px"
      scrim
    >
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? 'Modifier la réparation' : 'Nouvelle réparation' }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-form ref="form" v-model="valid">
              <v-row>
                <!-- Client -->
                <v-col cols="12" sm="6">
                  <div class="d-flex align-center gap-2">
                    <v-autocomplete
                      v-model="formData.customerId"
                      :items="customers"
                      item-title="name"
                      item-value="id"
                      label="Client*"
                      :rules="[v => !!v || 'Le client est requis']"
                      required
                      :loading="!customers.length"
                      clearable
                      :return-object="false"
                      class="flex-grow-1"
                      @update:model-value="handleCustomerChange"
                    >
                      <template #item="{ props, item }">
                        <v-list-item
                          v-bind="props"
                          :title="item.raw.name"
                          :subtitle="item.raw.phone || item.raw.email"
                        >
                          <template #prepend>
                            <v-icon :color="item.raw.phone ? 'primary' : 'grey'">
                              {{ item.raw.phone ? 'mdi-phone' : 'mdi-account' }}
                            </v-icon>
                          </template>
                        </v-list-item>
                      </template>
                    </v-autocomplete>
                    <quick-customer-dialog
                      @customer-created="handleNewCustomer"
                    />
                  </div>
                </v-col>

                <!-- Fabricant -->
                <v-col cols="12" sm="6">
                  <v-autocomplete
                    v-model="formData.manufacturerId"
                    :items="sortedManufacturers"
                    item-title="name"
                    item-value="id"
                    label="Marque*"
                    :rules="[v => !!v || 'La marque est requise']"
                    required
                    :loading="!manufacturers.length"
                    :return-object="false"
                    :menu-props="{ maxHeight: 400 }"
                    persistent-hint
                    hint="Sélectionnez une marque pour voir les problèmes disponibles"
                  >
                    <template #item="{ props, item }">
                      <v-list-item
                        v-bind="props"
                        :title="item.raw.name"
                      >
                        <template #prepend>
                          <v-icon color="primary">mdi-cellphone</v-icon>
                        </template>
                      </v-list-item>
                    </template>
                  </v-autocomplete>
                </v-col>

                <!-- Numéro de réparation -->
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="formData.repairNumber"
                    label="N° de réparation"
                    readonly
                    :loading="!formData.repairNumber"
                  />
                </v-col>

                <!-- Modèle -->
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="formData.deviceModel"
                    label="Modèle*"
                    :rules="[v => !!v || 'Le modèle est requis']"
                    required
                    :disabled="!formData.manufacturerId"
                  />
                </v-col>

                <!-- IMEI -->
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="formData.imei"
                    label="IMEI"
                    :disabled="!formData.manufacturerId"
                  />
                </v-col>

                <!-- Problèmes -->
                <v-col cols="12" sm="12">
                  <v-autocomplete
                    v-model="formData.issues"
                    :items="availableIssues"
                    item-title="name"
                    item-value="id"
                    label="Problèmes*"
                    multiple
                    chips
                    closable-chips
                    :rules="[v => v?.length > 0 || 'Au moins un problème est requis']"
                    required
                    :loading="!formData.manufacturerId || !availableIssues.length"
                    :disabled="!formData.manufacturerId"
                    :hint="!formData.manufacturerId ? 'Sélectionnez d\'abord une marque' : ''"
                    persistent-hint
                    return-object
                  >
                    <template #selection="{ item }">
                      <v-chip
                        closable
                        :color="getIssueColor(availableIssues.indexOf(item.raw))"
                        class="mr-1"
                      >
                        {{ item.raw.name }} - {{ formatPrice(item.raw.basePrice) }}
                      </v-chip>
                    </template>
                    <template #item="{ props, item }">
                      <v-list-item
                        v-bind="props"
                        :title="item.raw.name"
                        :subtitle="item.raw.description"
                      >
                        <template #prepend>
                          <v-chip
                            :color="getIssueColor(availableIssues.indexOf(item.raw))"
                            size="small"
                          >
                            {{ formatPrice(item.raw.basePrice) }}
                          </v-chip>
                        </template>
                      </v-list-item>
                    </template>
                  </v-autocomplete>
                </v-col>

                <!-- Pièces de rechange -->
                <v-col cols="12">
                  <parts-selector
                    v-model="formData.parts"
                    @update:total-price="updateTotalPrice"
                  />
                </v-col>

                <!-- Description -->
                <v-col cols="12">
                  <v-textarea
                    v-model="formData.description"
                    label="Description détaillée"
                    rows="3"
                  />
                </v-col>

                <!-- Prix -->
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="formData.price"
                    label="Prix"
                    type="number"
                    prefix="€"
                    :rules="[v => v >= 0 || 'Le prix doit être positif']"
                    :readonly="false"
                  />
                </v-col>

                <!-- Temps de travail -->
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="formData.workTime"
                    label="Temps de travail (min)"
                    type="number"
                    suffix="min"
                    :rules="[v => v >= 0 || 'Le temps doit être positif']"
                    readonly
                  />
                </v-col>

                <!-- Statut -->
                <v-col cols="12" sm="4">
                  <v-select
                    v-model="formData.status"
                    :items="statuses"
                    label="Statut*"
                    :rules="[v => !!v || 'Le statut est requis']"
                    required
                  />
                </v-col>

                <!-- Priorité -->
                <v-col cols="12" sm="4">
                  <v-select
                    v-model="formData.priority"
                    :items="priorities"
                    label="Priorité*"
                    :rules="[v => !!v || 'La priorité est requise']"
                    required
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="error"
            variant="text"
            @click="closeDialog"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            @click="saveRepair"
            :loading="loading"
            :disabled="!valid"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar.show = false"
        >
          Fermer
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRepairStore } from '@/stores/repair'
import { useCustomerStore } from '@/stores/customer'
import { useManufacturerStore } from '@/stores/manufacturer'
import { useAuthStore } from '@/stores/auth'
import { useInventoryStore } from '@/stores/inventory'
import { formatPrice } from '@/utils/formatters'
import PartsSelector from './PartsSelector.vue'
import QuickCustomerDialog from '@/components/customers/QuickCustomerDialog.vue'

// État du snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// Fonction pour afficher le snackbar
const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  repair: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'repair-saved'])

// Stores
const repairStore = useRepairStore()
const customerStore = useCustomerStore()
const manufacturerStore = useManufacturerStore()
const authStore = useAuthStore()
const inventoryStore = useInventoryStore()

// État du formulaire
const form = ref(null)
const valid = ref(false)
const loading = ref(false)
const isEditing = computed(() => !!props.repair)

// Fonction pour générer un numéro de réparation
const generateRepairNumber = () => {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `REP${year}${month}${day}-${random}`
}

// Données du formulaire
const formData = ref({
  customerId: '',
  manufacturerId: '',
  repairNumber: generateRepairNumber(),
  deviceModel: '',
  imei: '',
  issues: [],
  parts: [],
  description: '',
  price: 0,
  workTime: 0,
  status: 'pending',
  priority: 'normal'
})

// Données disponibles
const customers = computed(() => customerStore.customers)
const manufacturers = computed(() => manufacturerStore.manufacturers)
const sortedManufacturers = computed(() => {
  return [...manufacturers.value].sort((a, b) => a.name.localeCompare(b.name))
})
const availableIssues = computed(() => {
  const manufacturer = manufacturers.value.find(m => m.id === formData.value.manufacturerId)
  return manufacturer?.issues || []
})

// Options de statut et priorité
const statuses = [
  { title: 'En attente', value: 'pending' },
  { title: 'En cours', value: 'in_progress' },
  { title: 'Terminé', value: 'completed' },
  { title: 'Annulé', value: 'cancelled' }
]

const priorities = [
  { title: 'Basse', value: 'low' },
  { title: 'Normale', value: 'normal' },
  { title: 'Haute', value: 'high' },
  { title: 'Urgente', value: 'urgent' }
]

// Méthodes
const closeDialog = () => {
  form.value?.reset()
  emit('update:modelValue', false)
}

const handleCustomerChange = (customerId) => {
  if (!customerId) {
    formData.value.customerId = ''
  }
}

const handleNewCustomer = (customer) => {
  formData.value.customerId = customer.id
}

const getIssueColor = (index) => {
  const colors = ['primary', 'secondary', 'success', 'info', 'warning']
  return colors[index % colors.length]
}

const updateTotalPrice = () => {
  let total = 0

  // Ajouter le prix des problèmes
  formData.value.issues.forEach(issue => {
    total += issue.basePrice || 0
  })

  // Ajouter le prix des pièces
  formData.value.parts.forEach(part => {
    total += (part.price || 0) * (part.quantity || 1)
  })

  formData.value.price = total
}

const saveRepair = async () => {
  if (!form.value?.validate()) return

  try {
    loading.value = true

    // Vérifier que l'utilisateur est connecté
    if (!authStore.user?.uid) {
      showSnackbar('Vous devez être connecté pour créer une réparation', 'error')
      return
    }

    // Vérifier le stock disponible pour chaque pièce
    const stockCheck = formData.value.parts.every(part => {
      const item = inventoryStore.items.find(i => i.id === part.id)
      return item && item.stock >= part.quantity
    })

    if (!stockCheck) {
      showSnackbar('Stock insuffisant pour certaines pièces', 'error')
      return
    }

    // Créer ou mettre à jour la réparation
    const repairData = {
      ...formData.value,
      technicianId: authStore.user.uid,
      storeId: authStore.storeId,
      updatedAt: new Date()
    }

    if (!isEditing.value) {
      repairData.createdAt = new Date()
      await repairStore.addRepair(repairData)
      showSnackbar('Réparation créée avec succès')
    } else {
      repairData.id = props.repair.id
      await repairStore.updateRepair(repairData.id, repairData)
      showSnackbar('Réparation mise à jour avec succès')
    }

    emit('repair-saved')
    closeDialog()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la réparation:', error)
    showSnackbar(error.message || 'Erreur lors de la sauvegarde', 'error')
  } finally {
    loading.value = false
  }
}

// Surveillance des changements
watch(() => formData.value.issues, updateTotalPrice, { deep: true })
watch(() => formData.value.parts, updateTotalPrice, { deep: true })

watch(() => props.repair, (newRepair) => {
  if (newRepair) {
    formData.value = { ...newRepair }
  } else {
    form.value?.reset()
    formData.value = {
      customerId: '',
      manufacturerId: '',
      repairNumber: generateRepairNumber(),
      deviceModel: '',
      imei: '',
      issues: [],
      parts: [],
      description: '',
      price: 0,
      workTime: 0,
      status: 'pending',
      priority: 'normal'
    }
  }
}, { immediate: true })

// Chargement initial des données
onMounted(async () => {
  if (!customers.value.length) {
    await customerStore.fetchCustomers()
  }
  if (!manufacturers.value.length) {
    await manufacturerStore.fetchManufacturers()
  }
  if (!formData.value.repairNumber) {
    formData.value.repairNumber = generateRepairNumber()
  }
})
</script>
