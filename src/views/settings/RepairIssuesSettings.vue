<template>
  <div>
    <v-card-title class="text-h6 mb-4">
      Types de réparation
    </v-card-title>

    <v-form @submit.prevent="saveRepairIssue">
      <!-- Liste des types de réparation -->
      <v-list>
        <v-list-subheader>Types de réparation configurés</v-list-subheader>
        
        <v-list-item v-for="issue in repairIssues" :key="issue.id">
          <v-list-item-title>{{ issue.name }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ issue.category }} - {{ issue.basePrice }}€
          </v-list-item-subtitle>
          <template v-slot:append>
            <v-btn
              icon="mdi-pencil"
              variant="text"
              @click="editRepairIssue(issue)"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              variant="text"
              color="error"
              @click="deleteRepairIssue(issue)"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>

      <!-- Bouton pour ajouter un nouveau type -->
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        class="mt-4"
        @click="showAddDialog = true"
      >
        Ajouter un type de réparation
      </v-btn>
    </v-form>

    <!-- Dialog pour ajouter/modifier un type -->
    <v-dialog v-model="showAddDialog" max-width="500px">
      <v-card>
        <v-card-title>
          {{ editedRepairIssue.id ? 'Modifier' : 'Ajouter' }} un type de réparation
        </v-card-title>

        <v-card-text>
          <v-form ref="form">
            <v-text-field
              v-model="editedRepairIssue.name"
              label="Nom du type de réparation"
              required
            ></v-text-field>

            <v-select
              v-model="editedRepairIssue.category"
              :items="categories"
              label="Catégorie"
              required
            ></v-select>

            <v-text-field
              v-model.number="editedRepairIssue.basePrice"
              label="Prix de base (€)"
              type="number"
              required
            ></v-text-field>

            <v-textarea
              v-model="editedRepairIssue.description"
              label="Description"
              rows="3"
            ></v-textarea>

            <v-switch
              v-model="editedRepairIssue.requiresQuote"
              label="Nécessite un devis"
            ></v-switch>
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
            @click="saveRepairIssue"
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
          Êtes-vous sûr de vouloir supprimer ce type de réparation ?
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
const repairIssues = ref([])
const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const form = ref(null)

const categories = [
  'Écran',
  'Batterie',
  'Connecteur de charge',
  'Caméra',
  'Haut-parleur',
  'Microphone',
  'Boutons',
  'Autres'
]

const editedRepairIssue = ref({
  name: '',
  category: '',
  basePrice: 0,
  description: '',
  requiresQuote: false
})

const issueToDelete = ref(null)

// Méthodes
const loadRepairIssues = async () => {
  try {
    const storeId = authStore.currentStore?.id
    if (!storeId) return

    const issuesRef = collection(db, 'repairIssues')
    const q = query(issuesRef, where('storeId', '==', storeId))
    const querySnapshot = await getDocs(q)
    
    repairIssues.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des types de réparation:', error)
    showSnackbar({
      text: 'Erreur lors du chargement des types de réparation',
      color: 'error'
    })
  }
}

const editRepairIssue = (issue) => {
  editedRepairIssue.value = { ...issue }
  showAddDialog.value = true
}

const deleteRepairIssue = (issue) => {
  issueToDelete.value = issue
  showDeleteDialog.value = true
}

const saveRepairIssue = async () => {
  if (!form.value?.validate()) return

  saving.value = true
  try {
    const storeId = authStore.currentStore?.id
    if (!storeId) throw new Error('Boutique non trouvée')

    const issueData = {
      name: editedRepairIssue.value.name,
      category: editedRepairIssue.value.category,
      basePrice: Number(editedRepairIssue.value.basePrice),
      description: editedRepairIssue.value.description,
      requiresQuote: editedRepairIssue.value.requiresQuote,
      storeId,
      updatedAt: new Date()
    }

    if (editedRepairIssue.value.id) {
      // Mise à jour
      const issueRef = doc(db, 'repairIssues', editedRepairIssue.value.id)
      await updateDoc(issueRef, issueData)
    } else {
      // Création
      issueData.createdAt = new Date()
      await addDoc(collection(db, 'repairIssues'), issueData)
    }

    showSnackbar({
      text: 'Type de réparation enregistré avec succès',
      color: 'success'
    })
    showAddDialog.value = false
    loadRepairIssues()
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du type de réparation:', error)
    showSnackbar({
      text: 'Erreur lors de l\'enregistrement du type de réparation',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = async () => {
  if (!issueToDelete.value) return

  deleting.value = true
  try {
    await deleteDoc(doc(db, 'repairIssues', issueToDelete.value.id))
    
    showSnackbar({
      text: 'Type de réparation supprimé avec succès',
      color: 'success'
    })
    showDeleteDialog.value = false
    loadRepairIssues()
  } catch (error) {
    console.error('Erreur lors de la suppression du type de réparation:', error)
    showSnackbar({
      text: 'Erreur lors de la suppression du type de réparation',
      color: 'error'
    })
  } finally {
    deleting.value = false
    issueToDelete.value = null
  }
}

// Chargement initial
onMounted(loadRepairIssues)
</script>
