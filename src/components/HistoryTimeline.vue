<template>
  <div class="history-timeline">
    <div class="d-flex justify-space-between align-center mb-4">
      <h3 class="text-h6">{{ title }}</h3>
      <v-btn
        v-if="canAddFiles"
        color="primary"
        prepend-icon="mdi-upload"
        @click="$refs.fileInput.click()"
      >
        Ajouter un document
      </v-btn>
      <input
        ref="fileInput"
        type="file"
        multiple
        class="d-none"
        @change="handleFileUpload"
        accept="image/*,.pdf,.doc,.docx"
      >
    </div>

    <!-- Documents -->
    <v-expand-transition>
      <div v-if="documents.length > 0" class="mb-6">
        <v-card variant="outlined">
          <v-list lines="two">
            <v-list-item
              v-for="doc in documents"
              :key="doc.id"
              :title="doc.name"
              :subtitle="formatDate(doc.createdAt)"
            >
              <template v-slot:prepend>
                <v-icon :color="getFileIconColor(doc.type)">
                  {{ getFileIcon(doc.type) }}
                </v-icon>
              </template>

              <template v-slot:append>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :href="doc.url"
                  target="_blank"
                >
                  <v-icon>mdi-download</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </div>
    </v-expand-transition>

    <!-- Timeline -->
    <v-timeline side="end" density="compact" line-color="grey-lighten-1">
      <v-timeline-item
        v-for="item in history"
        :key="item.id"
        :dot-color="getActionColor(item.type)"
        size="small"
      >
        <template v-slot:opposite>
          <div class="text-caption">{{ formatDate(item.timestamp) }}</div>
        </template>
        
        <div class="text-subtitle-2">
          {{ getActionLabel(item.type) }}
          <span class="text-caption">par {{ item.userName }}</span>
        </div>
        
        <div v-if="item.changes" class="text-body-2 mt-1">
          <template v-if="typeof item.changes === 'string'">
            {{ item.changes }}
          </template>
          <template v-else>
            <div v-for="(value, key) in item.changes" :key="key">
              <strong>{{ getFieldLabel(key) }}:</strong> {{ value }}
            </div>
          </template>
        </div>
      </v-timeline-item>
    </v-timeline>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { historyService } from '../services/history.service'
import { useNotification } from '../composables/useNotification'

const props = defineProps({
  itemId: {
    type: String,
    required: true
  },
  itemType: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Historique'
  },
  canAddFiles: {
    type: Boolean,
    default: true
  },
  userId: String,
  userName: String
})

const history = ref([])
const documents = ref([])
const { showSuccess, showError } = useNotification()

// Charger l'historique et les documents
const loadData = async () => {
  try {
    const [historyData, docsData] = await Promise.all([
      historyService.getHistory(props.itemId, props.itemType),
      historyService.getDocuments(props.itemId, props.itemType)
    ])
    history.value = historyData
    documents.value = docsData
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
    showError('Erreur lors du chargement de l\'historique')
  }
}

// Gestion des fichiers
const handleFileUpload = async (event) => {
  const files = Array.from(event.target.files)
  if (!files.length) return

  for (const file of files) {
    try {
      // Upload du fichier
      const fileInfo = await historyService.uploadFile(file, `${props.itemType}/${props.itemId}`)
      
      // Sauvegarde des métadonnées
      await historyService.saveDocument({
        fileInfo,
        itemId: props.itemId,
        itemType: props.itemType,
        userId: props.userId,
        userName: props.userName
      })

      // Log dans l'historique
      await historyService.logChange({
        type: 'document_added',
        itemId: props.itemId,
        itemType: props.itemType,
        changes: `Document ajouté: ${file.name}`,
        userId: props.userId,
        userName: props.userName
      })

      showSuccess('Document ajouté avec succès')
      loadData() // Recharger les données
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error)
      showError(`Erreur lors de l'upload de ${file.name}`)
    }
  }

  // Réinitialiser l'input file
  event.target.value = ''
}

// Helpers
const getActionColor = (type) => {
  const colors = {
    create: 'success',
    update: 'info',
    delete: 'error',
    status_change: 'warning',
    document_added: 'primary'
  }
  return colors[type] || 'grey'
}

const getActionLabel = (type) => {
  const labels = {
    create: 'Création',
    update: 'Modification',
    delete: 'Suppression',
    status_change: 'Changement de statut',
    document_added: 'Ajout de document'
  }
  return labels[type] || type
}

const getFieldLabel = (key) => {
  const labels = {
    status: 'Statut',
    priority: 'Priorité',
    notes: 'Notes',
    deviceModel: 'Modèle',
    issue: 'Problème',
    solution: 'Solution',
    price: 'Prix'
  }
  return labels[key] || key
}

const getFileIcon = (type) => {
  if (type.startsWith('image/')) return 'mdi-image'
  if (type.includes('pdf')) return 'mdi-file-pdf-box'
  if (type.includes('word')) return 'mdi-file-word'
  return 'mdi-file-document'
}

const getFileIconColor = (type) => {
  if (type.startsWith('image/')) return 'primary'
  if (type.includes('pdf')) return 'error'
  if (type.includes('word')) return 'info'
  return 'grey'
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate()
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.history-timeline {
  padding: 16px;
}
</style>
