<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h1 class="text-h3">Paramètres de la boutique</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title>Informations de la boutique</v-card-title>
          <v-card-text>
            <v-form v-model="storeForm.valid" @submit.prevent="saveStoreSettings">
              <v-text-field
                v-model="storeForm.name"
                label="Nom de la boutique"
                :rules="[v => !!v || 'Le nom est requis']"
                required
              />
              
              <v-text-field
                v-model="storeForm.phone"
                label="Téléphone"
                :rules="[v => !v || /^[0-9+ -]{10,}$/.test(v) || 'Numéro de téléphone invalide']"
              />
              
              <v-text-field
                v-model="storeForm.email"
                label="Email"
                type="email"
                :rules="[v => !v || /.+@.+\..+/.test(v) || 'Email invalide']"
              />
              
              <v-textarea
                v-model="storeForm.address"
                label="Adresse"
                rows="3"
              />

              <v-btn
                color="primary"
                type="submit"
                :loading="loading"
                :disabled="!storeForm.valid"
              >
                Enregistrer les modifications
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Utilisateurs de la boutique</span>
            <v-btn
              v-if="isStoreAdmin"
              color="primary"
              prepend-icon="mdi-plus"
              @click="showInviteDialog = true"
              size="small"
            >
              Inviter
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th v-if="isStoreAdmin">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in storeUsers" :key="user.id">
                  <td>{{ user.email }}</td>
                  <td>
                    <v-chip
                      :color="getRoleColor(user.role)"
                      size="small"
                    >
                      {{ user.role }}
                    </v-chip>
                  </td>
                  <td v-if="isStoreAdmin">
                    <v-btn
                      v-if="user.role !== 'owner'"
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      size="small"
                      @click="removeUser(user)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>Statistiques</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <div class="text-subtitle-1">Réparations totales</div>
                <div class="text-h4">{{ stats.repairs }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-subtitle-1">Clients</div>
                <div class="text-h4">{{ stats.customers }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-subtitle-1">Pièces en stock</div>
                <div class="text-h4">{{ stats.inventory }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-subtitle-1">CA Mensuel</div>
                <div class="text-h4">{{ formatPrice(stats.monthlyRevenue) }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog d'invitation -->
    <v-dialog v-model="showInviteDialog" max-width="500px">
      <v-card>
        <v-card-title>Inviter un utilisateur</v-card-title>
        <v-card-text>
          <v-form v-model="inviteForm.valid" @submit.prevent="inviteUser">
            <v-text-field
              v-model="inviteForm.email"
              label="Email"
              type="email"
              :rules="[v => !!v || 'Email requis', v => /.+@.+\..+/.test(v) || 'Email invalide']"
              required
            />
            
            <v-select
              v-model="inviteForm.role"
              label="Rôle"
              :items="['staff', 'admin']"
              :rules="[v => !!v || 'Rôle requis']"
              required
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="error"
            variant="text"
            @click="showInviteDialog = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            @click="inviteUser"
            :loading="loading"
            :disabled="!inviteForm.valid"
          >
            Inviter
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { db } from '@/firebase'
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore'

const authStore = useAuthStore()
const loading = ref(false)
const showInviteDialog = ref(false)
const storeUsers = ref([])
const stats = ref({
  repairs: 0,
  customers: 0,
  inventory: 0,
  monthlyRevenue: 0
})

const storeForm = ref({
  valid: true,
  name: '',
  phone: '',
  email: '',
  address: ''
})

const inviteForm = ref({
  valid: false,
  email: '',
  role: 'staff'
})

const isStoreAdmin = computed(() => authStore.isStoreAdmin)

// Charger les données de la boutique
const loadStoreData = async () => {
  try {
    loading.value = true
    const storeRef = doc(db, 'stores', authStore.storeId)
    const storeDoc = await getDoc(storeRef)
    
    if (storeDoc.exists()) {
      const data = storeDoc.data()
      storeForm.value = {
        ...storeForm.value,
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || ''
      }
    }

    // Charger les utilisateurs
    const usersRef = collection(storeRef, 'users')
    const usersSnapshot = await getDocs(usersRef)
    storeUsers.value = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Charger les statistiques
    await loadStats()
  } catch (error) {
    console.error('Error loading store data:', error)
  } finally {
    loading.value = false
  }
}

// Charger les statistiques
const loadStats = async () => {
  try {
    const storeRef = doc(db, 'stores', authStore.storeId)
    
    // Compter les réparations
    const repairsRef = collection(storeRef, 'repairs')
    const repairsSnapshot = await getDocs(repairsRef)
    stats.value.repairs = repairsSnapshot.size

    // Compter les clients
    const customersRef = collection(storeRef, 'customers')
    const customersSnapshot = await getDocs(customersRef)
    stats.value.customers = customersSnapshot.size

    // Compter les pièces
    const inventoryRef = collection(storeRef, 'inventory')
    const inventorySnapshot = await getDocs(inventoryRef)
    stats.value.inventory = inventorySnapshot.size

    // Calculer le CA mensuel
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const repairsThisMonth = repairsSnapshot.docs
      .filter(doc => doc.data().createdAt?.toDate() >= startOfMonth)
      .reduce((sum, doc) => sum + (doc.data().price || 0), 0)
    
    stats.value.monthlyRevenue = repairsThisMonth
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

// Sauvegarder les paramètres de la boutique
const saveStoreSettings = async () => {
  try {
    loading.value = true
    const storeRef = doc(db, 'stores', authStore.storeId)
    await updateDoc(storeRef, {
      name: storeForm.value.name,
      phone: storeForm.value.phone,
      email: storeForm.value.email,
      address: storeForm.value.address,
      updatedAt: Timestamp.now()
    })
  } catch (error) {
    console.error('Error saving store settings:', error)
  } finally {
    loading.value = false
  }
}

// Inviter un utilisateur
const inviteUser = async () => {
  try {
    loading.value = true
    const storeRef = doc(db, 'stores', authStore.storeId)
    const usersRef = collection(storeRef, 'users')
    
    await addDoc(usersRef, {
      email: inviteForm.value.email,
      role: inviteForm.value.role,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })

    showInviteDialog.value = false
    await loadStoreData()
  } catch (error) {
    console.error('Error inviting user:', error)
  } finally {
    loading.value = false
  }
}

// Supprimer un utilisateur
const removeUser = async (user) => {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer ${user.email} ?`)) return

  try {
    loading.value = true
    const storeRef = doc(db, 'stores', authStore.storeId)
    const userRef = doc(storeRef, 'users', user.id)
    await deleteDoc(userRef)
    await loadStoreData()
  } catch (error) {
    console.error('Error removing user:', error)
  } finally {
    loading.value = false
  }
}

// Formater le prix
const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

// Obtenir la couleur du rôle
const getRoleColor = (role) => {
  switch (role) {
    case 'owner':
      return 'purple'
    case 'admin':
      return 'primary'
    case 'staff':
      return 'success'
    default:
      return 'grey'
  }
}

onMounted(() => {
  loadStoreData()
})
</script>
