<template>
  <div>
    <v-autocomplete
      v-model="selectedParts"
      :items="availableParts"
      item-title="name"
      item-value="id"
      label="Pièces de rechange"
      multiple
      chips
      closable-chips
      :loading="inventoryStore.loading"
      return-object
      @update:model-value="handlePartSelection"
    >
      <template #selection="{ item }">
        <v-chip
          closable
          color="primary"
          class="mr-1"
        >
          {{ item.raw.name }} ({{ item.raw.quantity || 1 }}) - {{ formatPrice(item.raw.price * (item.raw.quantity || 1)) }}
        </v-chip>
      </template>
      <template #item="{ props, item }">
        <v-list-item
          v-bind="props"
          :title="item.raw.name"
          :subtitle="'Stock disponible: ' + item.raw.stock"
          :disabled="item.raw.stock <= 0"
        >
          <template #prepend>
            <v-chip
              :color="item.raw.stock > 0 ? 'primary' : 'error'"
              size="small"
            >
              {{ formatPrice(item.raw.price) }}
            </v-chip>
          </template>
        </v-list-item>
      </template>
    </v-autocomplete>

    <!-- Liste des pièces sélectionnées avec quantité -->
    <v-list v-if="selectedParts.length > 0" class="mt-2">
      <v-list-item v-for="part in selectedParts" :key="part.id">
        <template #prepend>
          <v-chip color="primary" size="small" class="mr-2">
            {{ formatPrice(part.price * (part.quantity || 1)) }}
          </v-chip>
        </template>
        <v-list-item-title>{{ part.name }}</v-list-item-title>
        <template #append>
          <v-text-field
            v-model.number="part.quantity"
            type="number"
            density="compact"
            style="width: 80px"
            hide-details
            min="1"
            :max="part.stock"
            @update:model-value="(value) => updatePartQuantity(part, value)"
          ></v-text-field>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { formatPrice } from '@/utils/formatters'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'update:totalPrice'])

const inventoryStore = useInventoryStore()
const selectedParts = ref(props.modelValue.map(part => ({
  ...part,
  quantity: part.quantity || 1
})))

// Filtrer les pièces disponibles
const availableParts = computed(() => {
  return inventoryStore.items.map(item => ({
    ...item,
    disabled: item.stock <= 0
  }))
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  selectedParts.value = newValue.map(part => ({
    ...part,
    quantity: part.quantity || 1
  }))
})

// Calculate total price when parts or quantities change
watch(() => selectedParts.value, (parts) => {
  const totalPrice = parts.reduce((sum, part) => sum + (part.price * (part.quantity || 1)), 0)
  emit('update:totalPrice', totalPrice)
}, { deep: true })

const handlePartSelection = (parts) => {
  const updatedParts = parts.map(part => ({
    ...part,
    quantity: part.quantity || 1
  }))
  selectedParts.value = updatedParts
  emit('update:modelValue', updatedParts)
}

const updatePartQuantity = (part, value) => {
  const quantity = parseInt(value) || 1
  if (quantity < 1) {
    part.quantity = 1
  } else if (quantity > part.stock) {
    part.quantity = part.stock
  } else {
    part.quantity = quantity
  }
  emit('update:modelValue', [...selectedParts.value])
}

onMounted(async () => {
  if (!inventoryStore.items.length) {
    await inventoryStore.fetchInventory()
  }
})
</script>
