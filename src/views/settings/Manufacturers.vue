<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold primary-gradient-text mb-1">Fabricants</h1>
            <p class="text-subtitle-1 text-medium-emphasis">Gérez la liste des fabricants de téléphones</p>
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            class="elevation-2"
            rounded
            @click="openDialog()"
          >
            Nouveau fabricant
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Table des fabricants -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="manufacturers"
        :loading="loading"
        class="elevation-1"
      >
        <template v-slot:item.logo="{ item }">
          <span class="text-h6">{{ item.logo }}</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            color="primary"
            variant="text"
            class="mr-2"
            @click="openDialog(item)"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            color="error"
            variant="text"
            @click="confirmDelete(item)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog d'ajout/modification -->
    <v-dialog v-model="dialog.show" max-width="500px">
      <v-card>
        <v-card-title>{{ dialog.isEdit ? 'Modifier le fabricant' : 'Nouveau fabricant' }}</v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="dialog.manufacturer.name"
                  label="Nom du fabricant*"
                  :rules="[v => !!v || 'Le nom est requis']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="dialog.manufacturer.logo"
                  :items="availableLogos"
                  label="Logo"
                  required
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <span class="text-h6">{{ item.raw }}</span>
                      </template>
                      <v-list-item-title>{{ item.raw }}</v-list-item-title>
                    </v-list-item>
                  </template>
                  <template v-slot:selection="{ item }">
                    <span class="text-h6">{{ item.raw }}</span>
                  </template>
                </v-select>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
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
            @click="saveManufacturer"
            :disabled="!isValid"
          >
            {{ dialog.isEdit ? 'Modifier' : 'Ajouter' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog.show" max-width="500px">
      <v-card>
        <v-card-title>Confirmer la suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer ce fabricant ? Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="deleteDialog.show = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="deleteManufacturer"
          >
            Supprimer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { manufacturerService } from '@/services/manufacturer.service'
import { useSnackbar } from '@/composables/useSnackbar'

const { showSnackbar } = useSnackbar()

// État
const manufacturers = ref([])
const loading = ref(true)
const dialog = ref({
  show: false,
  isEdit: false,
  manufacturer: {
    name: '',
    logo: '📱'
  }
})
const deleteDialog = ref({
  show: false,
  manufacturer: null
})

// En-têtes de la table
const headers = [
  { title: 'Logo', key: 'logo', align: 'center', width: '100px' },
  { title: 'Nom', key: 'name' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
]

// Logos disponibles
const availableLogos = ['📱', '🍎', '📳', '📴', '🔋', '💻', '⌚️', '📲']

// Validation
const isValid = computed(() => {
  return dialog.value.manufacturer.name.trim() !== '' && 
         dialog.value.manufacturer.logo !== ''
})

// Méthodes
async function loadManufacturers() {
  try {
    loading.value = true
    manufacturers.value = await manufacturerService.getAllManufacturers()
  } catch (error) {
    showSnackbar('Erreur lors du chargement des fabricants', 'error')
  } finally {
    loading.value = false
  }
}

function openDialog(manufacturer = null) {
  if (manufacturer) {
    dialog.value = {
      show: true,
      isEdit: true,
      manufacturer: { ...manufacturer }
    }
  } else {
    dialog.value = {
      show: true,
      isEdit: false,
      manufacturer: {
        name: '',
        logo: '📱'
      }
    }
  }
}

function closeDialog() {
  dialog.value.show = false
  dialog.value.manufacturer = {
    name: '',
    logo: '📱'
  }
}

async function saveManufacturer() {
  if (!isValid.value) return

  try {
    loading.value = true
    if (dialog.value.isEdit) {
      await manufacturerService.updateManufacturer(dialog.value.manufacturer.id, dialog.value.manufacturer)
      showSnackbar('Fabricant modifié avec succès', 'success')
    } else {
      await manufacturerService.addManufacturer(dialog.value.manufacturer)
      showSnackbar('Fabricant ajouté avec succès', 'success')
    }
    closeDialog()
    await loadManufacturers()
  } catch (error) {
    showSnackbar('Erreur lors de l\'ajout/modification du fabricant', 'error')
  } finally {
    loading.value = false
  }
}

function confirmDelete(manufacturer) {
  deleteDialog.value = {
    show: true,
    manufacturer
  }
}

async function deleteManufacturer() {
  if (!deleteDialog.value.manufacturer) return

  try {
    loading.value = true
    await manufacturerService.deleteManufacturer(deleteDialog.value.manufacturer.id)
    showSnackbar('Fabricant supprimé avec succès', 'success')
    deleteDialog.value.show = false
    await loadManufacturers()
  } catch (error) {
    showSnackbar('Erreur lors de la suppression du fabricant', 'error')
  } finally {
    loading.value = false
  }
}

// Chargement initial
onMounted(loadManufacturers)
</script>

<style scoped>
.primary-gradient-text {
  background: linear-gradient(45deg, var(--v-primary-base), var(--v-secondary-base));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}
</style>
