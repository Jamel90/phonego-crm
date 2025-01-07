<template>
  <div>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-6">
          <h1 class="text-h4 font-weight-bold primary-gradient-text">Problèmes de réparation</h1>
        </div>
      </v-col>
    </v-row>

    <v-card class="mb-6">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedManufacturer"
              :items="manufacturers"
              item-title="name"
              item-value="id"
              label="Fabricant"
              return-object
              :loading="loadingManufacturers"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :title="null">
                  <template v-slot:prepend>
                    {{ item.raw.logo }}
                  </template>
                  <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
        </v-row>

        <v-divider class="my-4"></v-divider>

        <v-row v-if="selectedManufacturer">
          <v-col cols="12">
            <div class="d-flex justify-space-between align-center mb-4">
              <h2 class="text-h5">Problèmes pour {{ selectedManufacturer.name }}</h2>
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="openIssueDialog()"
              >
                Ajouter un problème
              </v-btn>
            </div>

            <v-data-table
              :headers="headers"
              :items="issues"
              :loading="loadingIssues"
            >
              <template v-slot:item.estimatedTime="{ item }">
                {{ formatMinutesToTime(item.estimatedTime) }}
              </template>

              <template v-slot:item.basePrice="{ item }">
                {{ item.basePrice }}€
              </template>

              <template v-slot:item.actions="{ item }">
                <div class="d-flex justify-end">
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    color="primary"
                    class="mr-2"
                    @click="openIssueDialog(item)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    color="error"
                    @click="confirmDelete(item)"
                  ></v-btn>
                </div>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Dialog d'édition -->
    <v-dialog v-model="dialog.show" max-width="500px">
      <v-card>
        <v-card-title>
          {{ dialog.isEdit ? 'Modifier le problème' : 'Nouveau problème' }}
        </v-card-title>
        
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="dialog.issue.name"
                  label="Nom du problème*"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="dialog.issue.estimatedTime"
                  label="Temps estimé*"
                  hint="Format: 30min, 1h, 1h30min"
                  persistent-hint
                  :rules="[rules.required, rules.time]"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="dialog.issue.basePrice"
                  label="Prix de base*"
                  type="number"
                  prefix="€"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="closeDialog">Annuler</v-btn>
          <v-btn color="primary" @click="saveIssue" :loading="dialog.loading">
            {{ dialog.isEdit ? 'Modifier' : 'Créer' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog.show" max-width="500px">
      <v-card>
        <v-card-title>Confirmer la suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer ce problème ? Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="deleteDialog.show = false">Annuler</v-btn>
          <v-btn color="error" @click="deleteIssue" :loading="deleteDialog.loading">Supprimer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-row>
      <v-col cols="12" class="d-flex justify-end">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openIssueDialog()"
        >
          Ajouter un problème
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { manufacturerService } from '@/services/manufacturer.service'
import { repairIssuesService } from '@/services/repair-issues.service'
import { useSnackbar } from '@/composables/useSnackbar'
import { formatMinutesToTime, parseTimeToMinutes } from '@/utils/timeUtils'

const { showSnackbar } = useSnackbar()

// États réactifs
const manufacturers = ref([])
const selectedManufacturer = ref(null)
const issues = ref([])
const loadingManufacturers = ref(false)
const loadingIssues = ref(false)

const dialog = ref({
  show: false,
  isEdit: false,
  issue: null,
  loading: false
})

const deleteDialog = ref({
  show: false,
  issue: null,
  loading: false
})

// En-têtes du tableau
const headers = [
  { title: 'Problème', key: 'name' },
  { title: 'Temps estimé', key: 'estimatedTime' },
  { title: 'Prix de base', key: 'basePrice', align: 'end' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
]

const rules = {
  required: v => !!v || 'Ce champ est requis',
  time: v => {
    if (!v) return true
    // Accepte les formats: 30, 30min, 1h, 1h30, 1h30min
    const timeRegex = /^(\d+h)?(\d+min?)?$|^\d+$/
    return timeRegex.test(v.toString().replace(/\s+/g, '')) || 'Format invalide. Utilisez: 30, 30min, 1h, 1h30, 1h30min'
  }
}

// Chargement des fabricants
async function loadManufacturers() {
  try {
    loadingManufacturers.value = true
    manufacturers.value = await manufacturerService.getAllManufacturers()
  } catch (error) {
    console.error('Error loading manufacturers:', error)
    showSnackbar('Erreur lors du chargement des fabricants', 'error')
  } finally {
    loadingManufacturers.value = false
  }
}

// Chargement des problèmes
async function loadIssues() {
  if (!selectedManufacturer.value?.id) {
    issues.value = []
    return
  }

  try {
    loadingIssues.value = true
    const result = await repairIssuesService.getIssuesByManufacturer(selectedManufacturer.value.id)
    issues.value = result
  } catch (error) {
    console.error('Error loading issues:', error)
    showSnackbar('Erreur lors du chargement des problèmes', 'error')
  } finally {
    loadingIssues.value = false
  }
}

// Gestion du dialog d'édition
function openIssueDialog(issue = null) {
  dialog.value = {
    show: true,
    isEdit: !!issue,
    issue: issue ? { 
      id: issue.id,
      name: issue.name,
      estimatedTime: formatMinutesToTime(issue.estimatedTime),
      basePrice: Number(issue.basePrice),
      manufacturerId: issue.manufacturerId || selectedManufacturer.value.id,
      isDefault: issue.isDefault || false
    } : {
      name: '',
      estimatedTime: '',
      basePrice: '',
      manufacturerId: selectedManufacturer.value.id,
      isDefault: false
    }
  }
}

function closeDialog() {
  dialog.value = {
    show: false,
    isEdit: false,
    issue: {
      name: '',
      estimatedTime: '',
      basePrice: '',
      manufacturerId: selectedManufacturer.value?.id
    }
  }
}

async function saveIssue() {
  try {
    dialog.value.loading = true
    
    // Convertir le temps en minutes et ajouter l'ID du fabricant
    const issueData = {
      ...dialog.value.issue,
      manufacturerId: selectedManufacturer.value.id,
      estimatedTime: parseTimeToMinutes(dialog.value.issue.estimatedTime)
    }

    if (dialog.value.isEdit) {
      await repairIssuesService.updateIssue(issueData.id, issueData)
      showSnackbar('Problème mis à jour avec succès')
    } else {
      await repairIssuesService.createIssue(issueData)
      showSnackbar('Problème créé avec succès')
    }

    await loadIssues()
    closeDialog()
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du problème:', error)
    showSnackbar(error.message || 'Erreur lors de la sauvegarde', 'error')
  } finally {
    dialog.value.loading = false
  }
}

// Gestion de la suppression
function confirmDelete(issue) {
  deleteDialog.value = {
    show: true,
    issue
  }
}

async function deleteIssue() {
  try {
    deleteDialog.value.loading = true
    await repairIssuesService.deleteIssue(
      deleteDialog.value.issue.id,
      selectedManufacturer.value.id
    )
    deleteDialog.value.show = false
    await loadIssues()
    showSnackbar('Problème supprimé avec succès', 'success')
  } catch (error) {
    console.error('Error deleting issue:', error)
    showSnackbar('Erreur lors de la suppression du problème', 'error')
  } finally {
    deleteDialog.value.loading = false
  }
}

// Surveillance du fabricant sélectionné
watch(selectedManufacturer, () => {
  loadIssues()
})

// Chargement initial
onMounted(() => {
  loadManufacturers()
})
</script>
