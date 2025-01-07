<template>
  <div>
    <v-card-title class="text-h6 mb-4">
      Gestion des fabricants
    </v-card-title>

    <v-form @submit.prevent="saveManufacturer">
      <!-- Liste des fabricants -->
      <v-list>
        <v-list-subheader>Fabricants configurés</v-list-subheader>
        
        <v-list-item v-for="manufacturer in manufacturers" :key="manufacturer.id">
          <v-list-item-title>{{ manufacturer.name }}</v-list-item-title>
          <template v-slot:append>
            <v-btn
              icon="mdi-pencil"
              variant="text"
              @click="editManufacturer(manufacturer)"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              variant="text"
              color="error"
              @click="deleteManufacturer(manufacturer)"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>

      <!-- Bouton pour ajouter un nouveau fabricant -->
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        class="mt-4"
        @click="showAddDialog = true"
      >
        Ajouter un fabricant
      </v-btn>
    </v-form>

    <!-- Dialog pour ajouter/modifier un fabricant -->
    <v-dialog v-model="showAddDialog" max-width="500px">
      <v-card>
        <v-card-title>
          {{ editedManufacturer.id ? 'Modifier' : 'Ajouter' }} un fabricant
        </v-card-title>

        <v-card-text>
          <v-form ref="form">
            <v-text-field
              v-model="editedManufacturer.name"
              label="Nom du fabricant"
              required
            ></v-text-field>

            <v-text-field
              v-model="editedManufacturer.website"
              label="Site web"
            ></v-text-field>

            <v-textarea
              v-model="editedManufacturer.description"
              label="Description"
              rows="3"
            ></v-textarea>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showAddDialog = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            @click="saveManufacturer"
            :loading="saving"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="showDeleteDialog" max-width="500px">
      <v-card>
        <v-card-title>Confirmer la suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer ce fabricant ?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showDeleteDialog = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="confirmDelete"
            :loading="deleting"
          >
            Supprimer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { db } from '@/firebase'
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { showSnackbar } = useSnackbar()

// États
const manufacturers = ref([])
const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const form = ref(null)

const editedManufacturer = ref({
  name: '',
  website: '',
  description: ''
})

const manufacturerToDelete = ref(null)

// Méthodes
const loadManufacturers = async () => {
  try {
    const storeId = authStore.currentStore?.id
    if (!storeId) return

    const manufacturersRef = collection(db, 'manufacturers')
    const q = query(manufacturersRef, where('storeId', '==', storeId))
    const querySnapshot = await getDocs(q)
    
    manufacturers.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des fabricants:', error)
    showSnackbar({
      text: 'Erreur lors du chargement des fabricants',
      color: 'error'
    })
  }
}

const editManufacturer = (manufacturer) => {
  editedManufacturer.value = { ...manufacturer }
  showAddDialog.value = true
}

const deleteManufacturer = (manufacturer) => {
  manufacturerToDelete.value = manufacturer
  showDeleteDialog.value = true
}

const saveManufacturer = async () => {
  if (!form.value?.validate()) return

  saving.value = true
  try {
    const storeId = authStore.currentStore?.id
    if (!storeId) throw new Error('Boutique non trouvée')

    const manufacturerData = {
      name: editedManufacturer.value.name,
      website: editedManufacturer.value.website,
      description: editedManufacturer.value.description,
      storeId,
      updatedAt: new Date()
    }

    if (editedManufacturer.value.id) {
      // Mise à jour
      const manufacturerRef = doc(db, 'manufacturers', editedManufacturer.value.id)
      await updateDoc(manufacturerRef, manufacturerData)
    } else {
      // Création
      manufacturerData.createdAt = new Date()
      await addDoc(collection(db, 'manufacturers'), manufacturerData)
    }

    showSnackbar({
      text: 'Fabricant enregistré avec succès',
      color: 'success'
    })
    showAddDialog.value = false
    loadManufacturers()
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du fabricant:', error)
    showSnackbar({
      text: 'Erreur lors de l\'enregistrement du fabricant',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = async () => {
  if (!manufacturerToDelete.value) return

  deleting.value = true
  try {
    await deleteDoc(doc(db, 'manufacturers', manufacturerToDelete.value.id))
    
    showSnackbar({
      text: 'Fabricant supprimé avec succès',
      color: 'success'
    })
    showDeleteDialog.value = false
    loadManufacturers()
  } catch (error) {
    console.error('Erreur lors de la suppression du fabricant:', error)
    showSnackbar({
      text: 'Erreur lors de la suppression du fabricant',
      color: 'error'
    })
  } finally {
    deleting.value = false
    manufacturerToDelete.value = null
  }
}

// Chargement initial
onMounted(loadManufacturers)
</script>
