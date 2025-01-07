<template>
  <v-card class="task-list">
    <v-card-title class="d-flex justify-end align-center py-3 px-4">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        size="small"
        variant="flat"
        @click="showAddTask = true"
      >
        Nouvelle
      </v-btn>
    </v-card-title>

    <v-card-text class="pt-0">
      <v-list v-if="!loading" class="task-list-items px-2">
        <template v-if="tasks.length > 0">
          <v-list-item
            v-for="task in tasks"
            :key="task.id"
            :value="task"
            class="task-item mb-2 rounded"
            :class="{ 'completed-task': task.completed }"
          >
            <div class="d-flex align-center task-container pa-2 w-100">
              <!-- Checkbox alignée avec le texte -->
              <div class="checkbox-wrapper d-flex align-center">
                <v-checkbox
                  v-model="task.completed"
                  @change="toggleTask(task)"
                  :color="getPriorityColor(task.priority)"
                  density="compact"
                  hide-details
                ></v-checkbox>
              </div>

              <!-- Contenu de la tâche -->
              <div class="task-content flex-grow-1 py-1">
                <div 
                  class="task-title"
                  :class="{ 'text-grey': task.completed }"
                >
                  {{ task.title }}
                </div>
              </div>

              <!-- Actions -->
              <div class="task-actions d-flex align-center">
                <v-chip
                  :color="getPriorityColor(task.priority)"
                  size="x-small"
                  class="mr-2"
                  variant="tonal"
                  label
                >
                  {{ getPriorityLabel(task.priority) }}
                </v-chip>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  density="compact"
                  @click="deleteTask(task)"
                ></v-btn>
              </div>
            </div>
          </v-list-item>
        </template>
        <v-list-item v-else>
          <div class="text-center pa-4 text-medium-emphasis">
            Aucune tâche pour le moment
          </div>
        </v-list-item>
      </v-list>
      <div v-else class="d-flex justify-center pa-4">
        <v-progress-circular indeterminate></v-progress-circular>
      </div>
    </v-card-text>

    <!-- Dialog pour ajouter une tâche -->
    <v-dialog v-model="showAddTask" max-width="500px">
      <v-card>
        <v-card-title>Nouvelle tâche</v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="addTask">
            <v-text-field
              v-model="newTask.title"
              label="Titre"
              required
              :rules="[v => !!v || 'Le titre est requis']"
            ></v-text-field>

            <v-select
              v-model="newTask.priority"
              :items="priorities"
              label="Priorité"
              item-title="label"
              item-value="value"
              required
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="addTask"
          >
            Ajouter
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="showAddTask = false"
          >
            Annuler
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useTaskStore } from '@/stores/task'

// État
const loading = ref(false)
const showAddTask = ref(false)
const form = ref(null)
const tasks = ref([])
const taskStore = useTaskStore()

const newTask = ref({
  title: '',
  priority: 'normal'
})

// Priorités disponibles
const priorities = [
  { label: 'Urgent', value: 'high' },
  { label: 'Normal', value: 'normal' },
  { label: 'Faible', value: 'low' }
]

// Méthodes
const getPriorityColor = (priority) => {
  const colors = {
    high: 'error',
    normal: 'primary',
    low: 'success'
  }
  return colors[priority] || 'grey'
}

const getPriorityLabel = (priority) => {
  const labels = {
    high: 'Urgent',
    normal: 'Normal',
    low: 'Faible'
  }
  return labels[priority] || priority
}

const loadTasks = async () => {
  try {
    loading.value = true
    tasks.value = await taskStore.getTasks()
  } catch (error) {
    console.error('Erreur lors du chargement des tâches:', error)
  } finally {
    loading.value = false
  }
}

const addTask = async () => {
  if (!form.value.validate()) return

  try {
    await taskStore.addTask({
      ...newTask.value,
      completed: false,
      createdAt: new Date()
    })
    
    showAddTask.value = false
    newTask.value = {
      title: '',
      priority: 'normal'
    }
    
    await loadTasks()
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la tâche:', error)
  }
}

const toggleTask = async (task) => {
  try {
    await taskStore.updateTask(task.id, {
      completed: task.completed
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la tâche:', error)
    task.completed = !task.completed // Revenir à l'état précédent en cas d'erreur
  }
}

const deleteTask = async (task) => {
  try {
    await taskStore.deleteTask(task.id)
    await loadTasks()
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error)
  }
}

// Charger les tâches au montage
onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.task-list {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 8px;
}

.task-list-items {
  max-height: 400px;
  overflow-y: auto;
}

.task-item {
  background-color: rgba(var(--v-theme-surface), 0.5);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  margin-bottom: 8px !important;
  padding: 0 !important;
}

.task-item:hover {
  background-color: rgba(var(--v-theme-surface-variant), 0.08);
}

.task-container {
  gap: 8px;
}

.checkbox-wrapper {
  min-width: 40px;
}

.task-content {
  min-width: 0;
  padding: 4px 0;
}

.task-title {
  font-size: 0.9375rem !important;
  line-height: 1.4;
  white-space: normal !important;
  word-break: break-word;
}

.completed-task .task-title {
  text-decoration: line-through;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.task-actions {
  margin-left: auto;
  gap: 8px;
}

/* Style de la barre de défilement */
.task-list-items::-webkit-scrollbar {
  width: 6px;
}

.task-list-items::-webkit-scrollbar-track {
  background: transparent;
}

.task-list-items::-webkit-scrollbar-thumb {
  background-color: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 3px;
}

.task-list-items::-webkit-scrollbar-thumb:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.3);
}
</style>
