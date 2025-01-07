<template>
  <div>
    <v-row>
      <v-col cols="12" class="d-flex align-center">
        <h1 class="text-h4">Modification de la réparation</h1>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="saveRepair" :loading="loading">
          Enregistrer
        </v-btn>
      </v-col>
    </v-row>

    <v-card class="mt-4">
      <v-card-text>
        <repair-form
          v-model="repair"
          :loading="loading"
          @update:modelValue="updateRepair"
        />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSnackbar } from '@/composables/useSnackbar'
import { repairService } from '@/services/repair.service'
import RepairForm from '@/components/repairs/RepairForm.vue'

const route = useRoute()
const router = useRouter()
const { showSnackbar } = useSnackbar()

// État
const repair = ref(null)
const loading = ref(false)

// Méthodes
const loadRepair = async () => {
  loading.value = true
  try {
    const repairId = route.params.id
    const data = await repairService.getRepairById(repairId)
    repair.value = data
  } catch (error) {
    console.error('Erreur lors du chargement de la réparation:', error)
    showSnackbar('Erreur lors du chargement de la réparation', 'error')
    router.push({ name: 'Repairs' })
  } finally {
    loading.value = false
  }
}

const updateRepair = (newValue) => {
  repair.value = newValue
}

const saveRepair = async () => {
  if (!repair.value) return

  loading.value = true
  try {
    await repairService.updateRepair(repair.value.id, repair.value)
    showSnackbar('Réparation mise à jour avec succès', 'success')
    router.push({ name: 'Repairs' })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réparation:', error)
    showSnackbar('Erreur lors de la mise à jour de la réparation', 'error')
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadRepair()
})
</script>
