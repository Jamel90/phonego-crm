<template>
  <div class="stores-management">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Liste des boutiques</span>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="showCreateDialog = true"
            >
              Nouvelle boutique
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Propriétaire</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="store in stores" :key="store.id">
                  <td>{{ store.name }}</td>
                  <td>{{ store.email }}</td>
                  <td>{{ store.ownerEmail }}</td>
                  <td>
                    <v-chip
                      :color="getStatusColor(store.status)"
                      size="small"
                    >
                      {{ store.status }}
                    </v-chip>
                  </td>
                  <td>
                    <v-btn
                      icon="mdi-pencil"
                      variant="text"
                      color="primary"
                      size="small"
                      class="mr-2"
                      @click="editStore(store)"
                    />
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      size="small"
                      @click="confirmDelete(store)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog de création/édition -->
    <v-dialog v-model="showDialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ isEditing ? 'Modifier la boutique' : 'Nouvelle boutique' }}
        </v-card-title>
        <v-card-text>
          <v-form v-model="form.valid" @submit.prevent="saveStore">
            <v-text-field
              v-model="form.name"
              label="Nom de la boutique"
              :rules="[v => !!v || 'Le nom est requis']"
              required
            />
            
            <v-text-field
              v-model="form.email"
              label="Email"
              type="email"
              :rules="[
                v => !!v || 'L\'email est requis',
                v => /.+@.+\..+/.test(v) || 'Email invalide'
              ]"
              required
            />
            
            <v-text-field
              v-model="form.phone"
              label="Téléphone"
              :rules="[v => !v || /^[0-9+ -]{10,}$/.test(v) || 'Numéro de téléphone invalide']"
            />
            
            <v-textarea
              v-model="form.address"
              label="Adresse"
              rows="3"
            />

            <v-select
              v-model="form.status"
              label="Statut"
              :items="['active', 'inactive', 'suspended']"
              required
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="error"
            variant="text"
            @click="showDialog = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            @click="saveStore"
            :loading="loading"
            :disabled="!form.valid"
          >
            {{ isEditing ? 'Modifier' : 'Créer' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">
          Confirmer la suppression
        </v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer la boutique "{{ storeToDelete?.name }}" ?
          Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="showDeleteDialog = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="error"
            @click="deleteStore"
            :loading="loading"
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
import { db } from '@/firebase'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore'

const stores = ref([])
const loading = ref(false)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const storeToDelete = ref(null)

const form = ref({
  valid: true,
  id: null,
  name: '',
  email: '',
  phone: '',
  address: '',
  status: 'active'
})

const resetForm = () => {
  form.value = {
    valid: true,
    id: null,
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'active'
  }
}

const fetchStores = async () => {
  try {
    loading.value = true
    const storesRef = collection(db, 'stores')
    const snapshot = await getDocs(storesRef)
    
    const storesData = await Promise.all(snapshot.docs.map(async storeDoc => {
      const data = storeDoc.data()
      
      // Récupérer les informations du propriétaire
      let ownerEmail = data.email
      if (data.owner) {
        const ownerRef = doc(db, 'users', data.owner)
        const ownerDoc = await getDoc(ownerRef)
        if (ownerDoc.exists()) {
          ownerEmail = ownerDoc.data().email
        }
      }
      
      return {
        id: storeDoc.id,
        ...data,
        ownerEmail,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      }
    }))
    
    stores.value = storesData
  } catch (error) {
    console.error('Error fetching stores:', error)
  } finally {
    loading.value = false
  }
}

const editStore = (store) => {
  isEditing.value = true
  form.value = { ...store, valid: true }
  showDialog.value = true
}

const saveStore = async () => {
  try {
    loading.value = true
    const storeData = {
      name: form.value.name,
      email: form.value.email,
      phone: form.value.phone || null,
      address: form.value.address || null,
      status: form.value.status,
      updatedAt: Timestamp.now()
    }

    if (isEditing.value) {
      const storeRef = doc(db, 'stores', form.value.id)
      await updateDoc(storeRef, storeData)
    } else {
      const storeRef = doc(db, 'stores', form.value.email.toLowerCase())
      await setDoc(storeRef, {
        ...storeData,
        createdAt: Timestamp.now(),
        owner: form.value.email.toLowerCase()
      })
    }

    showDialog.value = false
    resetForm()
    await fetchStores()
  } catch (error) {
    console.error('Error saving store:', error)
  } finally {
    loading.value = false
  }
}

const confirmDelete = (store) => {
  storeToDelete.value = store
  showDeleteDialog.value = true
}

const deleteStore = async () => {
  try {
    loading.value = true
    await deleteDoc(doc(db, 'stores', storeToDelete.value.id))
    showDeleteDialog.value = false
    storeToDelete.value = null
    await fetchStores()
  } catch (error) {
    console.error('Error deleting store:', error)
  } finally {
    loading.value = false
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'warning'
    case 'suspended':
      return 'error'
    default:
      return 'grey'
  }
}

onMounted(() => {
  fetchStores()
})
</script>
