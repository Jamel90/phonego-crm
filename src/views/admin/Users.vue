<template>
  <div class="users-management">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Liste des utilisateurs</span>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="showCreateDialog = true"
            >
              Nouvel utilisateur
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-data-table
              :headers="[
                { title: 'Email', key: 'email' },
                { title: 'Boutique', key: 'storeName' },
                { title: 'Rôle', key: 'role' },
                { title: 'Statut', key: 'status' },
                { title: 'Actions', key: 'actions', sortable: false }
              ]"
              :items="users"
              class="elevation-1"
            >
              <template v-slot:item.actions="{ item }">
                <v-icon
                  size="small"
                  class="me-2"
                  @click="editUser(item)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  size="small"
                  class="me-2"
                  @click="confirmDelete(item)"
                >
                  mdi-delete
                </v-icon>
              </template>
              <template v-slot:item.role="{ item }">
                <span :style="{ color: getRoleColor(item.role) }">{{ getRoleLabel(item.role) }}</span>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog de création/édition -->
    <v-dialog v-model="showDialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur' }}
        </v-card-title>
        <v-card-text>
          <v-form v-model="form.valid" @submit.prevent="saveUser">
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

            <v-select
              v-model="form.storeId"
              label="Boutique"
              :items="stores"
              item-title="name"
              item-value="id"
              :rules="[v => !!v || 'La boutique est requise']"
              required
            />
            
            <v-select
              v-model="form.role"
              label="Rôle"
              :items="roles"
              item-title="title"
              item-value="value"
              :rules="[v => !!v || 'Le rôle est requis']"
              required
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
            @click="saveUser"
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
          Êtes-vous sûr de vouloir supprimer l'utilisateur "{{ userToDelete?.email }}" ?
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
            @click="deleteUser"
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
import { ref, onMounted, computed } from 'vue'
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
import { useSnackbar } from '@/composables/useSnackbar'

const { showSnackbar } = useSnackbar()

const users = ref([])
const stores = ref([])
const loading = ref(false)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const userToDelete = ref(null)

const form = ref({
  valid: true,
  id: null,
  email: '',
  storeId: null,
  role: 'staff',
  status: 'active'
})

const roles = [
  { title: 'Super Admin', value: 'super_admin' },
  { title: 'Propriétaire', value: 'owner' },
  { title: 'Admin', value: 'admin' },
  { title: 'Staff', value: 'staff' }
]

const roleColors = {
  super_admin: 'red',
  owner: 'purple',
  admin: 'blue',
  staff: 'green'
}

const getRoleColor = (role) => roleColors[role] || 'grey'

const getRoleLabel = (roleValue) => {
  const role = roles.find(r => r.value === roleValue)
  return role ? role.title : roleValue
}

const resetForm = () => {
  form.value = {
    valid: true,
    id: null,
    email: '',
    storeId: null,
    role: 'staff',
    status: 'active'
  }
}

const fetchStores = async () => {
  try {
    const storesRef = collection(db, 'stores')
    const snapshot = await getDocs(storesRef)
    stores.value = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    }))
  } catch (error) {
    console.error('Error fetching stores:', error)
  }
}

const fetchUsers = async () => {
  try {
    loading.value = true
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    
    const usersData = await Promise.all(snapshot.docs.map(async userDoc => {
      const data = userDoc.data()
      
      // Récupérer les informations de la boutique
      let storeName = 'N/A'
      if (data.storeId) {
        const storeRef = doc(db, 'stores', data.storeId)
        const storeDoc = await getDoc(storeRef)
        if (storeDoc.exists()) {
          storeName = storeDoc.data().name
        }
      }
      
      return {
        id: userDoc.id,
        ...data,
        storeName,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      }
    }))
    
    users.value = usersData
  } catch (error) {
    console.error('Error fetching users:', error)
  } finally {
    loading.value = false
  }
}

const editUser = (user) => {
  isEditing.value = true
  form.value = { ...user, valid: true }
  showDialog.value = true
}

const saveUser = async () => {
  try {
    loading.value = true
    const userData = {
      email: form.value.email,
      storeId: form.value.storeId,
      role: form.value.role,
      status: form.value.status,
      updatedAt: Timestamp.now()
    }

    if (isEditing.value) {
      const userRef = doc(db, 'users', form.value.id)
      await updateDoc(userRef, userData)
      
      // Mettre à jour l'utilisateur dans le store
      const storeUserRef = doc(db, 'stores', form.value.storeId, 'users', form.value.id)
      await updateDoc(storeUserRef, {
        email: form.value.email,
        role: form.value.role,
        updatedAt: Timestamp.now()
      })
    } else {
      const userRef = doc(db, 'users', form.value.email.toLowerCase())
      await setDoc(userRef, {
        ...userData,
        createdAt: Timestamp.now()
      })
      
      // Créer l'utilisateur dans le store
      const storeUserRef = doc(db, 'stores', form.value.storeId, 'users', form.value.email.toLowerCase())
      await setDoc(storeUserRef, {
        email: form.value.email,
        role: form.value.role,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    }

    showDialog.value = false
    resetForm()
    await fetchUsers()
  } catch (error) {
    console.error('Error saving user:', error)
  } finally {
    loading.value = false
  }
}

const confirmDelete = (user) => {
  userToDelete.value = user
  showDeleteDialog.value = true
}

const deleteUser = async () => {
  try {
    loading.value = true
    // Supprimer l'utilisateur global
    await deleteDoc(doc(db, 'users', userToDelete.value.id))
    
    // Supprimer l'utilisateur du store
    if (userToDelete.value.storeId) {
      await deleteDoc(doc(db, 'stores', userToDelete.value.storeId, 'users', userToDelete.value.id))
    }
    
    showDeleteDialog.value = false
    userToDelete.value = null
    await fetchUsers()
  } catch (error) {
    console.error('Error deleting user:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchStores()
  await fetchUsers()
})
</script>
