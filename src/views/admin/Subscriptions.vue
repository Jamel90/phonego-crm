<template>
  <div class="subscriptions-management">
    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Abonnements des boutiques</span>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="showCreateDialog = true"
            >
              Nouvel abonnement
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Boutique</th>
                  <th>Plan</th>
                  <th>Prix</th>
                  <th>Statut</th>
                  <th>Expiration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sub in subscriptions" :key="sub.id">
                  <td>{{ sub.storeName }}</td>
                  <td>{{ sub.plan }}</td>
                  <td>{{ formatPrice(sub.price) }}</td>
                  <td>
                    <v-chip
                      :color="getStatusColor(sub.status)"
                      size="small"
                    >
                      {{ sub.status }}
                    </v-chip>
                  </td>
                  <td>{{ formatDate(sub.expiresAt) }}</td>
                  <td>
                    <v-btn
                      icon="mdi-pencil"
                      variant="text"
                      color="primary"
                      size="small"
                      class="mr-2"
                      @click="editSubscription(sub)"
                    />
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      size="small"
                      @click="confirmDelete(sub)"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Plans d'abonnement</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="plan in subscriptionPlans"
                :key="plan.id"
                :title="plan.name"
                :subtitle="formatPrice(plan.price) + '/mois'"
              >
                <template v-slot:prepend>
                  <v-icon :color="plan.color">{{ plan.icon }}</v-icon>
                </template>
                <template v-slot:append>
                  <v-btn
                    color="primary"
                    variant="text"
                    size="small"
                    @click="editPlan(plan)"
                  >
                    Modifier
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog de création/édition d'abonnement -->
    <v-dialog v-model="showDialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ isEditing ? 'Modifier l\'abonnement' : 'Nouvel abonnement' }}
        </v-card-title>
        <v-card-text>
          <v-form v-model="form.valid" @submit.prevent="saveSubscription">
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
              v-model="form.planId"
              label="Plan"
              :items="subscriptionPlans"
              item-title="name"
              item-value="id"
              :rules="[v => !!v || 'Le plan est requis']"
              required
            />

            <v-text-field
              v-model="form.price"
              label="Prix mensuel"
              type="number"
              prefix="€"
              :rules="[v => !!v || 'Le prix est requis']"
              required
            />

            <v-select
              v-model="form.status"
              label="Statut"
              :items="['active', 'pending', 'cancelled']"
              required
            />

            <v-text-field
              v-model="form.expiresAt"
              label="Date d'expiration"
              type="date"
              :rules="[v => !!v || 'La date d\'expiration est requise']"
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
            @click="saveSubscription"
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
          Êtes-vous sûr de vouloir supprimer cet abonnement ?
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
            @click="deleteSubscription"
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

const subscriptions = ref([])
const stores = ref([])
const loading = ref(false)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const subscriptionToDelete = ref(null)

const subscriptionPlans = ref([
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    icon: 'mdi-star-outline',
    color: 'primary'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    icon: 'mdi-star',
    color: 'success'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    icon: 'mdi-star-circle',
    color: 'purple'
  }
])

const form = ref({
  valid: true,
  id: null,
  storeId: null,
  planId: null,
  price: null,
  status: 'active',
  expiresAt: null
})

const resetForm = () => {
  form.value = {
    valid: true,
    id: null,
    storeId: null,
    planId: null,
    price: null,
    status: 'active',
    expiresAt: null
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

const fetchSubscriptions = async () => {
  try {
    loading.value = true
    const subsRef = collection(db, 'subscriptions')
    const snapshot = await getDocs(subsRef)
    
    const subsData = await Promise.all(snapshot.docs.map(async doc => {
      const data = doc.data()
      
      // Récupérer les informations de la boutique
      let storeName = 'N/A'
      if (data.storeId) {
        const storeDoc = await getDoc(doc(db, 'stores', data.storeId))
        if (storeDoc.exists()) {
          storeName = storeDoc.data().name
        }
      }
      
      return {
        id: doc.id,
        ...data,
        storeName,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        expiresAt: data.expiresAt?.toDate()
      }
    }))
    
    subscriptions.value = subsData
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
  } finally {
    loading.value = false
  }
}

const editSubscription = (subscription) => {
  isEditing.value = true
  form.value = {
    ...subscription,
    expiresAt: formatDateForInput(subscription.expiresAt),
    valid: true
  }
  showDialog.value = true
}

const saveSubscription = async () => {
  try {
    loading.value = true
    const subscriptionData = {
      storeId: form.value.storeId,
      planId: form.value.planId,
      price: Number(form.value.price),
      status: form.value.status,
      expiresAt: Timestamp.fromDate(new Date(form.value.expiresAt)),
      updatedAt: Timestamp.now()
    }

    if (isEditing.value) {
      const subRef = doc(db, 'subscriptions', form.value.id)
      await updateDoc(subRef, subscriptionData)
    } else {
      const subRef = doc(collection(db, 'subscriptions'))
      await setDoc(subRef, {
        ...subscriptionData,
        createdAt: Timestamp.now()
      })
    }

    showDialog.value = false
    resetForm()
    await fetchSubscriptions()
  } catch (error) {
    console.error('Error saving subscription:', error)
  } finally {
    loading.value = false
  }
}

const confirmDelete = (subscription) => {
  subscriptionToDelete.value = subscription
  showDeleteDialog.value = true
}

const deleteSubscription = async () => {
  try {
    loading.value = true
    await deleteDoc(doc(db, 'subscriptions', subscriptionToDelete.value.id))
    showDeleteDialog.value = false
    subscriptionToDelete.value = null
    await fetchSubscriptions()
  } catch (error) {
    console.error('Error deleting subscription:', error)
  } finally {
    loading.value = false
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'pending':
      return 'warning'
    case 'cancelled':
      return 'error'
    default:
      return 'grey'
  }
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

const formatDateForInput = (date) => {
  if (!date) return null
  return date.toISOString().split('T')[0]
}

onMounted(async () => {
  await fetchStores()
  await fetchSubscriptions()
})
</script>
