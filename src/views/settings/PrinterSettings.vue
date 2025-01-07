<template>
  <div>
    <v-card-title class="text-h6 mb-4">
      Paramètres d'impression
    </v-card-title>

    <v-form @submit.prevent="savePrinterSettings">
      <!-- Liste des imprimantes -->
      <v-list>
        <v-list-subheader>Imprimantes configurées</v-list-subheader>
        
        <v-list-item v-for="printer in printers" :key="printer.id">
          <v-list-item-title>{{ printer.name }}</v-list-item-title>
          <template v-slot:append>
            <v-btn
              icon="mdi-pencil"
              variant="text"
              @click="editPrinter(printer)"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              variant="text"
              color="error"
              @click="deletePrinter(printer)"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>

      <!-- Bouton pour ajouter une nouvelle imprimante -->
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        class="mt-4"
        @click="showAddDialog = true"
      >
        Ajouter une imprimante
      </v-btn>
    </v-form>

    <!-- Dialog pour ajouter/modifier une imprimante -->
    <v-dialog v-model="showAddDialog" max-width="500px">
      <v-card>
        <v-card-title>
          {{ editedPrinter.id ? 'Modifier' : 'Ajouter' }} une imprimante
        </v-card-title>

        <v-card-text>
          <v-form ref="form">
            <v-text-field
              v-model="editedPrinter.name"
              label="Nom de l'imprimante"
              required
            ></v-text-field>

            <v-text-field
              v-model="editedPrinter.ip"
              label="Adresse IP"
              required
            ></v-text-field>

            <v-select
              v-model="editedPrinter.type"
              :items="printerTypes"
              label="Type d'imprimante"
              required
            ></v-select>
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
            @click="savePrinter"
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
          Êtes-vous sûr de vouloir supprimer cette imprimante ?
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
const printers = ref([])
const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const form = ref(null)

const printerTypes = [
  'Ticket',
  'Étiquette',
  'Document'
]

const editedPrinter = ref({
  name: '',
  ip: '',
  type: ''
})

const printerToDelete = ref(null)

// Méthodes
const loadPrinters = async () => {
  try {
    const storeId = authStore.currentStore?.id
    if (!storeId) return

    const printersRef = collection(db, 'printers')
    const q = query(printersRef, where('storeId', '==', storeId))
    const querySnapshot = await getDocs(q)
    
    printers.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des imprimantes:', error)
    showSnackbar({
      text: 'Erreur lors du chargement des imprimantes',
      color: 'error'
    })
  }
}

const editPrinter = (printer) => {
  editedPrinter.value = { ...printer }
  showAddDialog.value = true
}

const deletePrinter = (printer) => {
  printerToDelete.value = printer
  showDeleteDialog.value = true
}

const savePrinter = async () => {
  if (!form.value?.validate()) return

  saving.value = true
  try {
    const storeId = authStore.currentStore?.id
    if (!storeId) throw new Error('Boutique non trouvée')

    const printerData = {
      name: editedPrinter.value.name,
      ip: editedPrinter.value.ip,
      type: editedPrinter.value.type,
      storeId,
      updatedAt: new Date()
    }

    if (editedPrinter.value.id) {
      // Mise à jour
      const printerRef = doc(db, 'printers', editedPrinter.value.id)
      await updateDoc(printerRef, printerData)
    } else {
      // Création
      printerData.createdAt = new Date()
      await addDoc(collection(db, 'printers'), printerData)
    }

    showSnackbar({
      text: 'Imprimante enregistrée avec succès',
      color: 'success'
    })
    showAddDialog.value = false
    loadPrinters()
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'imprimante:', error)
    showSnackbar({
      text: 'Erreur lors de l\'enregistrement de l\'imprimante',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = async () => {
  if (!printerToDelete.value) return

  deleting.value = true
  try {
    await deleteDoc(doc(db, 'printers', printerToDelete.value.id))
    
    showSnackbar({
      text: 'Imprimante supprimée avec succès',
      color: 'success'
    })
    showDeleteDialog.value = false
    loadPrinters()
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'imprimante:', error)
    showSnackbar({
      text: 'Erreur lors de la suppression de l\'imprimante',
      color: 'error'
    })
  } finally {
    deleting.value = false
    printerToDelete.value = null
  }
}

// Chargement initial
onMounted(loadPrinters)
</script>
