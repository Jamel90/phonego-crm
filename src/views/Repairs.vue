<template>
  <div class="repairs-container">
    <v-container fluid>
      <!-- En-tête de la page -->
      <v-row class="mb-4">
        <v-col cols="12">
          <h1 class="text-h4 mb-6">Réparations</h1>
        </v-col>
      </v-row>

      <!-- Filtres -->
      <v-row class="mb-4">
        <v-col cols="12" sm="6" md="4" lg="3">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Rechercher..."
            hide-details
            variant="outlined"
            density="comfortable"
          />
        </v-col>
        
        <!-- Filtres de statut -->
        <v-col cols="12" sm="12" md="8" lg="9">
          <v-chip-group>
            <v-chip
              v-for="status in ['nouveau', 'en_cours', 'attente_pieces', 'termine']"
              :key="status"
              :color="filters.status.includes(status) ? getStatusColor(status) : undefined"
              :variant="filters.status.includes(status) ? 'elevated' : 'outlined'"
              @click="toggleFilter('status', status)"
              filter
              class="ma-1"
            >
              {{ formatRepairStatus(status) }}
            </v-chip>
          </v-chip-group>
        </v-col>
      </v-row>

      <!-- Filtres de priorité -->
      <v-row class="mb-4">
        <v-col cols="12" sm="12" md="8" lg="9">
          <v-chip-group>
            <v-chip
              v-for="priority in ['basse', 'normal', 'haute', 'urgente']"
              :key="priority"
              :color="filters.priority.includes(priority) ? getPriorityColor(priority) : undefined"
              :variant="filters.priority.includes(priority) ? 'elevated' : 'outlined'"
              @click="toggleFilter('priority', priority)"
              filter
              class="ma-1"
            >
              {{ formatRepairPriority(priority) }}
            </v-chip>
          </v-chip-group>
        </v-col>

        <!-- Boutons d'action -->
        <v-col cols="12" sm="12" md="4" lg="3" class="d-flex justify-end align-center gap-2">
          <v-btn
            variant="text"
            @click="clearFilters"
            prepend-icon="mdi-refresh"
            :disabled="!hasActiveFilters"
          >
            Réinitialiser
          </v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="openRepairDialog()"
          >
            Nouvelle réparation
          </v-btn>
        </v-col>
      </v-row>

      <!-- Liste des réparations -->
      <repair-list
        :repairs="filteredRepairs"
        :loading="loading"
        @edit="openRepairDialog"
        @delete="openDeleteDialog"
        @refresh="loadRepairs"
      />
    </v-container>

    <!-- Dialogs -->
    <repair-dialog
      v-model="showRepairDialog"
      :repair="selectedRepair"
      @saved="handleRepairSaved"
    />

    <delete-dialog
      v-model="showDeleteDialog"
      :repair="selectedRepair"
      @confirm="handleRepairDeleted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRepairStore } from '@/stores/repair'
import { useSnackbar } from '@/composables/useSnackbar'
import { formatRepairStatus, formatRepairPriority, getStatusColor, getPriorityColor } from '@/utils/formatters'
import { useRoute, useRouter } from 'vue-router'
import RepairList from '@/components/repairs/RepairList.vue'
import RepairDialog from '@/components/repairs/RepairDialog.vue'
import DeleteDialog from '@/components/repairs/DeleteDialog.vue'

// Store
const repairStore = useRepairStore()
const { showSnackbar } = useSnackbar()
const route = useRoute()
const router = useRouter()

// État local
const search = ref('')
const loading = ref(false)
const showRepairDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedRepair = ref(null)
const filters = ref({
  status: [],
  priority: []
})

// Computed
const hasActiveFilters = computed(() => {
  return filters.value.status.length > 0 || filters.value.priority.length > 0
})

const filteredRepairs = computed(() => {
  let result = repairStore.repairs

  // Filtre par texte
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    result = result.filter(repair => {
      return (
        repair.repairNumber?.toLowerCase().includes(searchLower) ||
        repair.customer?.name?.toLowerCase().includes(searchLower) ||
        repair.deviceModel?.toLowerCase().includes(searchLower) ||
        repair.description?.toLowerCase().includes(searchLower) ||
        repair.issues?.some(issue => issue.name?.toLowerCase().includes(searchLower))
      )
    })
  }

  // Filtre par statut
  if (filters.value.status.length) {
    result = result.filter(repair => filters.value.status.includes(repair.status))
  }

  // Filtre par priorité
  if (filters.value.priority.length) {
    result = result.filter(repair => filters.value.priority.includes(repair.priority))
  }

  return result
})

// Chargement des réparations
const loadRepairs = async () => {
  loading.value = true
  try {
    await repairStore.fetchRepairs()
    loading.value = false
  } catch (error) {
    console.error('Erreur lors du chargement des réparations:', error)
    showSnackbar({
      text: 'Erreur lors du chargement des réparations',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Methods
const toggleFilter = (type, value) => {
  const index = filters.value[type].indexOf(value)
  if (index === -1) {
    filters.value[type].push(value)
  } else {
    filters.value[type].splice(index, 1)
  }
}

const clearFilters = () => {
  filters.value.status = []
  filters.value.priority = []
  search.value = ''
}

const openRepairDialog = async (repair = null) => {
  console.log('Ouverture du dialogue avec la réparation:', repair)
  
  if (repair) {
    try {
      loading.value = true
      // Récupérer la réparation complète depuis le store
      const fullRepair = await repairStore.getRepairById(repair.id)
      console.log('Réparation complète:', fullRepair)
      selectedRepair.value = fullRepair
    } catch (error) {
      console.error('Erreur lors de la récupération de la réparation:', error)
      return
    } finally {
      loading.value = false
    }
  } else {
    selectedRepair.value = null
  }
  
  showRepairDialog.value = true
}

const openDeleteDialog = (repair) => {
  selectedRepair.value = repair
  showDeleteDialog.value = true
}

const handleRepairSaved = async () => {
  console.log(' Réparation sauvegardée')
  showRepairDialog.value = false
  selectedRepair.value = null
  await repairStore.fetchRepairs()
}

const handleRepairDeleted = async (repair) => {
  try {
    await repairStore.deleteRepair(repair.id)
    showDeleteDialog.value = false
    showSnackbar('Réparation supprimée avec succès', 'success')
    await repairStore.fetchRepairs()
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    showSnackbar('Erreur lors de la suppression de la réparation', 'error')
  }
}

// Surveiller le paramètre openRepair dans l'URL
watch(() => route.query.openRepair, async (repairId) => {
  if (repairId) {
    try {
      const repair = await repairStore.getRepairById(repairId)
      if (repair) {
        openRepairDialog(repair)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la réparation:', error)
    }
  }
})

// Initialisation
onMounted(async () => {
  await loadRepairs()
})
</script>

<style scoped>
.repairs-container {
  height: 100%;
}
</style>
