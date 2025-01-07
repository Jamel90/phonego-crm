<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
    max-width="500px"
  >
    <v-card>
      <v-card-title class="text-h5">
        Confirmer la suppression
      </v-card-title>

      <v-card-text>
        Êtes-vous sûr de vouloir supprimer cette réparation ?
        <template v-if="repair">
          <br>
          <strong>Client :</strong> {{ repair.customer?.name || 'N/A' }}<br>
          <strong>Modèle :</strong> {{ repair.deviceModel || 'N/A' }}<br>
          <strong>Numéro de réparation :</strong> {{ repair.repairNumber || 'N/A' }}
        </template>
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
          variant="text"
          :loading="deleting"
          @click="confirmDelete"
        >
          Supprimer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  repair: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const deleting = ref(false)

const closeDialog = () => {
  emit('update:modelValue', false)
}

const confirmDelete = async () => {
  if (!props.repair) return

  deleting.value = true
  try {
    emit('confirm', props.repair)
  } catch (error) {
    console.error('Error confirming delete:', error)
  } finally {
    deleting.value = false
  }
}
</script>
