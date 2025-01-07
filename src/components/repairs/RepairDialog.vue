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
                    label="Prix total*"
                    type="number"
                    prefix="€"
                    :rules="[
                      v => !!v || 'Le prix est requis',
                      v => v >= 0 || 'Le prix doit être positif'
                    ]"
                    required
                  />
                </v-col>

                <!-- Acompte -->
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model.number="formData.deposit"
                    label="Acompte"
                    type="number"
                    prefix="€"
                    :rules="[
                      v => !v || v >= 0 || 'L\'acompte ne peut pas être négatif',
                      v => !v || v <= formData.price || 'L\'acompte ne peut pas dépasser le prix total'
                    ]"
                    :hint="formData.deposit ? `Reste à payer: ${formatPrice(calculateRemainingAmount(formData.price, formData.deposit))}` : ''"
                    persistent-hint
                  />
                </v-col>

                <!-- Type de règlement -->
                <v-col cols="12" sm="4">
                  <v-select
                    v-model="formData.paymentType"
                    :items="paymentTypes"
                    label="Type de règlement*"
                    :rules="[v => !!v || 'Le type de règlement est requis']"
                    required
                  />
                </v-col>

                <!-- Temps de travail -->
                <v-col cols="12" sm="4">
                  <v-text-field
                    :model-value="formattedWorkTime"
                    label="Temps de travail estimé"
                    readonly
                    hint="Calculé automatiquement selon les problèmes sélectionnés"
                    persistent-hint
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
import { useManufacturerStore } from '@/stores/manufacturer'
import { useCustomerStore } from '@/stores/customer'
import { useAuthStore } from '@/stores/auth'
import { useSnackbar } from '@/composables/useSnackbar'
import { formatMinutesToTime, calculateTotalTime } from '@/utils/time'
import { formatPrice, calculateRemainingAmount } from '@/utils/price'
import PartsSelector from './PartsSelector.vue'
import QuickCustomerDialog from '../customers/QuickCustomerDialog.vue'
import { inventoryService } from '@/services/inventory.service'

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
const manufacturerStore = useManufacturerStore()
const customerStore = useCustomerStore()
const authStore = useAuthStore()
const { showSnackbar } = useSnackbar()

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

// État du snackbar
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// Liste des types de paiement
const paymentTypes = [
  { title: 'Espèces', value: 'especes' },
  { title: 'Carte bancaire', value: 'carte_bancaire' },
  { title: 'Virement', value: 'virement' },
  { title: 'Chèque', value: 'cheque' }
]

// Options de statut et priorité
const statuses = [
  { title: 'Nouveau', value: 'nouveau' },
  { title: 'En cours', value: 'en_cours' },
  { title: 'Terminé', value: 'terminé' },
  { title: 'Annulé', value: 'annulé' }
]

const priorities = [
  { title: 'Basse', value: 'low' },
  { title: 'Normale', value: 'normal' },
  { title: 'Haute', value: 'high' },
  { title: 'Urgente', value: 'urgent' }
]

// Données du formulaire
const formData = ref({
  customerId: '',
  manufacturerId: '',
  repairNumber: generateRepairNumber(),
  deviceModel: '',
  imei: '',
  issues: [],
  description: '',
  parts: [],
  photos: [],
  price: 0,
  workTime: 0,
  status: 'nouveau',
  priority: 'normal',
  priceModifiedManually: false,
  deposit: 0,
  paymentType: 'especes'
})

// Réinitialiser le formulaire
const resetForm = () => {
  formData.value = {
    customerId: '',
    manufacturerId: '',
    repairNumber: generateRepairNumber(),
    deviceModel: '',
    imei: '',
    issues: [],
    description: '',
    parts: [],
    photos: [],
    price: 0,
    workTime: 0,
    status: 'nouveau',
    priority: 'normal',
    priceModifiedManually: false,
    deposit: 0,
    paymentType: 'especes'
  }
  form.value?.reset()
}

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

// Computed pour le temps de travail
const formattedWorkTime = computed(() => {
  const totalTime = formData.value.issues.reduce((total, issue) => {
    return total + (issue.estimatedTime || 0)
  }, 0)
  return formatMinutesToTime(totalTime)
})

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

// Fonction pour mettre à jour le prix et le temps
const updatePriceAndTime = () => {
  if (formData.value.priceModifiedManually) return

  const totalPrice = formData.value.issues.reduce((total, issue) => {
    return total + (issue.basePrice || 0)
  }, 0)

  const totalTime = calculateTotalTime(
    formData.value.issues.map(issue => issue.estimatedTime)
  )

  formData.value.price = totalPrice
  formData.value.workTime = totalTime
}

// Surveillance des changements
watch(() => formData.value.issues, updatePriceAndTime, { deep: true })

// Fonction pour mettre à jour le stock des pièces
const updatePartsStock = async (oldParts = [], newParts = []) => {
  try {
    // Restaurer le stock des anciennes pièces
    for (const oldPart of oldParts) {
      if (oldPart.id) {
        await inventoryService.updateStock(oldPart.id, oldPart.quantity, 'add')
      }
    }

    // Déduire le stock des nouvelles pièces
    for (const newPart of newParts) {
      if (newPart.id) {
        await inventoryService.updateStock(newPart.id, newPart.quantity, 'remove')
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du stock:', error)
    throw error
  }
}

// Fonction pour sauvegarder la réparation
const saveRepair = async () => {
  if (!form.value?.validate()) return

  try {
    // Préparation des données de la réparation
    const repairData = {
      ...formData.value,
      updatedAt: new Date(),
      updatedBy: authStore.user?.uid,
      storeId: authStore.storeId
    }

    if (!isEditing.value) {
      repairData.createdAt = new Date()
      repairData.createdBy = authStore.user?.uid
    }

    // Mise à jour des dates en fonction du statut
    if (repairData.status === 'en_cours' && !repairData.startedAt) {
      repairData.startedAt = new Date()
    }
    
    if (repairData.status === 'terminé' && !repairData.completedAt) {
      repairData.completedAt = new Date()
    }

    // Calcul du montant restant
    repairData.remainingAmount = calculateRemainingAmount(repairData.price, repairData.deposit)

    // Sauvegarde de la réparation
    if (isEditing.value) {
      // Mise à jour d'une réparation existante
      await updatePartsStock(props.repair?.parts || [], formData.value.parts)
      await repairStore.updateRepair(props.repair.id, repairData)
    } else {
      // Nouvelle réparation
      repairData.createdAt = new Date()
      repairData.status = 'nouveau'
      await updatePartsStock([], formData.value.parts)
      await repairStore.addRepair(repairData)
    }

    // Fermer le dialogue et émettre l'événement
    emit('repair-saved')
    emit('update:modelValue', false)
    resetForm()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la réparation:', error)
    showSnackbar(
      'Une erreur est survenue lors de la sauvegarde de la réparation',
      'error'
    )
  } finally {
    loading.value = false
  }
}

// Surveillance des changements
watch(() => props.repair, (newRepair) => {
  if (newRepair) {
    formData.value = { ...newRepair }
  } else {
    form.value?.reset()
    formData.value = {
      customerId: '',
      manufacturerId: '',
      deviceModel: '',
      imei: '',
      issues: [],
      description: '',
      parts: [],
      photos: [],
      price: 0,
      workTime: 0,
      status: 'nouveau',
      priority: 'normal',
      priceModifiedManually: false,
      deposit: 0,
      paymentType: 'especes'
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
