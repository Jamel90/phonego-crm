`<template>
  <div>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <h2 class="text-h5">Promotions</h2>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="dialog = true"
          >
            Nouvelle Promotion
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-data-table
            :headers="headers"
            :items="promotions"
            :loading="loading"
          >
            <template v-slot:item.status="{ item }">
              <v-chip
                :color="item.status === 'active' ? 'success' : 'error'"
                size="small"
              >
                {{ item.status === 'active' ? 'Actif' : 'Inactif' }}
              </v-chip>
            </template>

            <template v-slot:item.discount="{ item }">
              {{ item.discountType === 'percentage' ? item.discount + '%' : formatPrice(item.discount) }}
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                icon
                variant="text"
                size="small"
                color="primary"
                @click="editPromotion(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                color="error"
                @click="deletePromotion(item)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title>Performance des Promotions</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-ticket-percent</v-icon>
                </template>
                <v-list-item-title>Promotions Actives</v-list-item-title>
                <v-list-item-subtitle>{{ activePromotions }} en cours</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="success">mdi-account-check</v-icon>
                </template>
                <v-list-item-title>Utilisations Totales</v-list-item-title>
                <v-list-item-subtitle>{{ totalUsage }} utilisations</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="info">mdi-currency-eur</v-icon>
                </template>
                <v-list-item-title>Revenue Généré</v-list-item-title>
                <v-list-item-subtitle>{{ formatPrice(totalRevenue) }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>Meilleures Promotions</v-card-title>
          <v-card-text>
            <v-list lines="two">
              <v-list-item
                v-for="promo in topPromotions"
                :key="promo.code"
                :subtitle="'Utilisé ' + promo.usage + ' fois'"
              >
                <template v-slot:prepend>
                  <v-avatar
                    color="primary"
                    variant="tonal"
                  >
                    {{ promo.code.substring(0, 2) }}
                  </v-avatar>
                </template>
                <v-list-item-title>{{ promo.code }}</v-list-item-title>
                <template v-slot:append>
                  <v-chip
                    size="small"
                    color="primary"
                  >
                    {{ formatPrice(promo.revenue) }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog pour créer/modifier une promotion -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ editedItem.id ? 'Modifier la Promotion' : 'Nouvelle Promotion' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="editedItem.code"
              label="Code Promo"
              required
              :rules="[v => !!v || 'Code requis']"
            ></v-text-field>

            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="editedItem.discountType"
                  :items="discountTypes"
                  label="Type de Réduction"
                  required
                ></v-select>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="editedItem.discount"
                  :label="editedItem.discountType === 'percentage' ? 'Réduction (%)' : 'Réduction (€)'"
                  type="number"
                  required
                  :rules="discountRules"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="editedItem.startDate"
                  label="Date de début"
                  type="date"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="editedItem.endDate"
                  label="Date de fin"
                  type="date"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-text-field
              v-model.number="editedItem.maxUses"
              label="Nombre maximum d'utilisations"
              type="number"
              hint="Laisser vide pour illimité"
            ></v-text-field>

            <v-textarea
              v-model="editedItem.description"
              label="Description"
              rows="3"
            ></v-textarea>

            <v-switch
              v-model="editedItem.status"
              label="Promotion active"
              color="primary"
              :true-value="'active'"
              :false-value="'inactive'"
            ></v-switch>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="text"
            @click="dialog = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            @click="savePromotion"
            :disabled="!valid"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import { db } from '@/firebase'

const dialog = ref(false)
const valid = ref(false)
const form = ref(null)
const loading = ref(true)
const promotions = ref([])

const headers = [
  { title: 'Code', key: 'code', align: 'start' },
  { title: 'Réduction', key: 'discount', align: 'center' },
  { title: 'Début', key: 'startDate' },
  { title: 'Fin', key: 'endDate' },
  { title: 'Utilisations', key: 'uses', align: 'center' },
  { title: 'Statut', key: 'status', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false }
]

const discountTypes = [
  { title: 'Pourcentage', value: 'percentage' },
  { title: 'Montant fixe', value: 'fixed' }
]

const defaultItem = {
  code: '',
  discountType: 'percentage',
  discount: 0,
  startDate: new Date().toISOString().substr(0, 10),
  endDate: '',
  maxUses: null,
  uses: 0,
  description: '',
  status: 'active'
}

const editedItem = ref({ ...defaultItem })

const discountRules = [
  v => !!v || 'Réduction requise',
  v => v > 0 || 'La réduction doit être positive',
  v => editedItem.value.discountType !== 'percentage' || v <= 100 || 'Le pourcentage ne peut pas dépasser 100%'
]

// Statistiques
const activePromotions = computed(() => {
  return promotions.value.filter(p => p.status === 'active').length
})

const totalUsage = computed(() => {
  return promotions.value.reduce((sum, p) => sum + (p.uses || 0), 0)
})

const totalRevenue = computed(() => {
  return promotions.value.reduce((sum, p) => sum + (p.revenue || 0), 0)
})

const topPromotions = computed(() => {
  return [...promotions.value]
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, 5)
})

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

async function loadPromotions() {
  try {
    loading.value = true
    const promotionsRef = collection(db, 'promotions')
    const snapshot = await getDocs(promotionsRef)
    
    promotions.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading promotions:', error)
  } finally {
    loading.value = false
  }
}

function editPromotion(item) {
  editedItem.value = { ...item }
  dialog.value = true
}

async function deletePromotion(item) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) {
    try {
      await deleteDoc(doc(db, 'promotions', item.id))
      const index = promotions.value.findIndex(p => p.id === item.id)
      promotions.value.splice(index, 1)
    } catch (error) {
      console.error('Error deleting promotion:', error)
    }
  }
}

async function savePromotion() {
  if (!form.value.validate()) return

  try {
    const promotionData = {
      code: editedItem.value.code,
      discountType: editedItem.value.discountType,
      discount: editedItem.value.discount,
      startDate: editedItem.value.startDate,
      endDate: editedItem.value.endDate,
      maxUses: editedItem.value.maxUses,
      description: editedItem.value.description,
      status: editedItem.value.status,
      updatedAt: new Date()
    }

    if (editedItem.value.id) {
      await updateDoc(doc(db, 'promotions', editedItem.value.id), promotionData)
      const index = promotions.value.findIndex(p => p.id === editedItem.value.id)
      promotions.value[index] = { ...promotions.value[index], ...promotionData }
    } else {
      promotionData.createdAt = new Date()
      promotionData.uses = 0
      promotionData.revenue = 0
      const docRef = await addDoc(collection(db, 'promotions'), promotionData)
      promotions.value.push({ id: docRef.id, ...promotionData })
    }

    dialog.value = false
    editedItem.value = { ...defaultItem }
  } catch (error) {
    console.error('Error saving promotion:', error)
  }
}

onMounted(() => {
  loadPromotions()
})
</script>

<style scoped>
.v-list-item {
  min-height: 64px;
}
</style>`
