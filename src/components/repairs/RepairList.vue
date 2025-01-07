<template>
  <v-data-table
    :headers="headers"
    :items="repairs"
    :loading="loading"
    :search="search"
    class="elevation-1"
    :items-per-page="10"
    :sort-by="[{ key: 'createdAt', order: 'desc' }]"
  >
    <template #item="{ item }">
      <tr
        @click="$emit('edit', item)"
        style="cursor: pointer;"
        class="repair-row"
      >
        <td>{{ item.repairNumber || '-' }}</td>
        <td>
          <v-chip size="small" color="primary" variant="flat">
            {{ item.customer?.name || '-' }}
          </v-chip>
        </td>
        <td>
          <v-chip size="small" color="secondary" variant="flat">
            {{ item.manufacturer?.name || '-' }}
          </v-chip>
        </td>
        <td>{{ item.deviceModel || '-' }}</td>
        <td>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-chip
                v-bind="props"
                :color="getStatusColor(item.status)"
                size="small"
                style="cursor: pointer;"
              >
                {{ formatRepairStatus(item.status) }}
              </v-chip>
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="status in getStatusOptions()"
                :key="status.value"
                :value="status.value"
                @click="updateStatus(item.id, status.value)"
              >
                <v-list-item-title>
                  <v-chip
                    :color="getStatusColor(status.value)"
                    size="small"
                  >
                    {{ status.title }}
                  </v-chip>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </td>
        <td>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-chip
                v-bind="props"
                :color="getPriorityColor(item.priority)"
                size="small"
                style="cursor: pointer;"
              >
                {{ formatRepairPriority(item.priority) }}
              </v-chip>
            </template>
            <v-list>
              <v-list-item
                v-for="priority in ['basse', 'normale', 'haute', 'urgente']"
                :key="priority"
                :value="priority"
                @click="updatePriority(item.id, priority)"
              >
                <v-list-item-title>
                  <v-chip
                    :color="getPriorityColor(priority)"
                    size="small"
                  >
                    {{ priority }}
                  </v-chip>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </td>
        <td class="text-end">{{ formatPrice(item.price) }}</td>
        <td>
          <div class="d-flex gap-1 flex-wrap">
            <v-chip
              v-for="issue in item.issues"
              :key="issue.id"
              size="small"
              :color="getIssueColor(item.issues.indexOf(issue))"
            >
              {{ issue.name }}
            </v-chip>
          </div>
        </td>
        <td>{{ formatDate(item.createdAt) }}</td>
        <td class="text-end">
          <div class="d-flex gap-2 justify-end">
            <print-repair-ticket :repair="item" />
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="primary"
              @click.stop="$emit('edit', item)"
            />
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              color="error"
              @click.stop="$emit('delete', item)"
            />
          </div>
        </td>
      </tr>
    </template>

    <template #no-data>
      <v-alert
        type="info"
        text="Aucune réparation trouvée"
        class="ma-2"
      />
    </template>
  </v-data-table>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { formatPrice, formatDate, formatRepairStatus, formatRepairPriority, getStatusColor, getPriorityColor } from '@/utils/formatters'
import { useRepairStore } from '@/stores/repair'
import { useSnackbar } from '@/composables/useSnackbar'
import { getStatusOptions } from '@/utils/statusTranslations'
import PrintRepairTicket from './PrintRepairTicket.vue'

const emit = defineEmits(['edit', 'delete', 'refresh', 'status-updated'])

const repairStore = useRepairStore()
const { showSnackbar } = useSnackbar()

const props = defineProps({
  repairs: {
    type: Array,
    required: true,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  search: {
    type: String,
    default: ''
  }
})

// Couleurs pour les problèmes
const issueColors = [
  'primary',
  'purple',
  'indigo',
  'deep-purple',
  'cyan',
  'teal',
  'light-blue'
]

// Fonction pour obtenir une couleur pour un problème
const getIssueColor = (index) => {
  return issueColors[index % issueColors.length]
}

const headers = ref([
  { 
    title: 'N° Réparation',
    key: 'repairNumber',
    align: 'start',
  },
  { 
    title: 'Client',
    key: 'customer.name',
  },
  { 
    title: 'Marque',
    key: 'manufacturer.name',
  },
  { 
    title: 'Modèle',
    key: 'deviceModel',
  },
  { 
    title: 'Statut',
    key: 'status',
  },
  { 
    title: 'Priorité',
    key: 'priority',
  },
  { 
    title: 'Prix',
    key: 'price',
    align: 'end',
  },
  { 
    title: 'Problèmes',
    key: 'issues',
  },
  { 
    title: 'Créé le',
    key: 'createdAt',
  },
  { 
    title: 'Actions',
    key: 'actions',
    align: 'end',
  }
])

// Fonction pour mettre à jour le statut
async function updateStatus(repairId, newStatus) {
  try {
    await repairStore.updateRepairStatus(repairId, newStatus)
    emit('status-updated', { repairId, status: newStatus })
    showSnackbar({
      text: 'Statut mis à jour avec succès',
      color: 'success'
    })
    emit('refresh')
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error)
    showSnackbar({
      text: 'Erreur lors de la mise à jour du statut',
      color: 'error'
    })
  }
}

// Fonction pour mettre à jour la priorité
const updatePriority = async (repairId, newPriority) => {
  try {
    await repairStore.updateRepairPriority(repairId, newPriority)
    showSnackbar({
      text: 'Priorité mise à jour avec succès',
      color: 'success'
    })
    emit('refresh')
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la priorité:', error)
    showSnackbar({
      text: 'Erreur lors de la mise à jour de la priorité',
      color: 'error'
    })
  }
}

// Fonction pour formater les données de réparation pour l'impression
const formatRepairDataForPrinting = (repair) => {
  return {
    id: repair.repairNumber,
    customerName: repair.customer?.name || 'N/A',
    customerPhone: repair.customer?.phone || 'N/A',
    manufacturer: repair.manufacturer?.name || 'N/A',
    model: repair.deviceModel || 'N/A',
    imei: repair.imei || 'N/A',
    unlockCode: repair.unlockCode || 'N/A',
    repairs: repair.issues.map(issue => ({
      name: issue.name,
      price: issue.price || 0,
      estimatedTime: issue.estimatedTime || '30min',
      notes: issue.notes || ''
    })),
    totalPrice: repair.price || 0,
    estimatedTime: repair.estimatedTime || '1h',
    technicalNotes: repair.notes || '',
    status: repair.status,
    createdAt: repair.createdAt
  }
}

// Gestionnaires d'événements pour l'impression
const onPrintSuccess = () => {
  showSnackbar({
    text: 'Tickets imprimés avec succès',
    color: 'success'
  })
}

const onPrintError = (error) => {
  showSnackbar({
    text: `Erreur lors de l'impression: ${error.message}`,
    color: 'error'
  })
}

onMounted(() => {
  console.log('RepairList mounted with repairs:', props.repairs)
})
</script>

<style scoped>
.v-chip {
  margin: 2px;
}

.repair-row:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

/* Empêcher la propagation du clic sur les éléments interactifs */
.v-btn,
.v-menu,
.v-chip {
  pointer-events: auto;
}

/* Permettre le clic sur la ligne tout en évitant les conflits avec les éléments interactifs */
tr {
  pointer-events: none;
}
tr > td {
  pointer-events: auto;
}
</style>
