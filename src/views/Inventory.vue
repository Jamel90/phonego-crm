<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h1 class="text-h3">Inventaire</h1>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="dialog = true"
          variant="elevated"
          rounded="lg"
          density="comfortable"
          elevation="2"
          class="px-4"
        >
          {{ activeTab === 0 ? 'Nouvelle pièce' : 'Nouveau fournisseur' }}
        </v-btn>
      </v-col>
    </v-row>

    <v-tabs 
      v-model="activeTab" 
      class="mb-4" 
      @update:modelValue="resetForm"
      rounded="pill"
      color="primary"
      bg-color="surface"
    >
      <v-tab :value="0" rounded="pill">Stock</v-tab>
      <v-tab :value="1" rounded="pill">Fournisseurs</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <!-- Onglet Stock -->
      <v-window-item value="0">
        <v-row>
          <v-col cols="12">
            <v-card elevation="3" rounded="xl" class="pa-2">
              <v-card-title>
                <v-text-field
                  v-model="search"
                  append-icon="mdi-magnify"
                  label="Rechercher"
                  single-line
                  hide-details
                  variant="solo"
                  rounded="pill"
                  density="comfortable"
                  class="search-field"
                ></v-text-field>
              </v-card-title>

              <v-data-table
                :headers="headers"
                :items="items"
                :search="search"
                :loading="storeLoading"
                hover
                class="inventory-table"
              >
                <template #item="{ item }">
                  <tr>
                    <td>{{ item.name }}</td>
                    <td>{{ item.description }}</td>
                    <td class="text-center">
                      <v-chip
                        :color="getStockColor(item.stock)"
                        :class="{'font-weight-bold': item.stock <= item.minStock}"
                      >
                        {{ item.stock }}
                      </v-chip>
                    </td>
                    <td class="text-center">{{ item.minStock }}</td>
                    <td class="text-end">{{ formatPrice(item.price) }}</td>
                    <td>{{ item.manufacturer?.name || '-' }}</td>
                    <td>{{ item.supplier?.name || '-' }}</td>
                    <td class="text-center">
                      <div class="d-flex gap-2 justify-center">
                        <v-btn
                          icon="mdi-pencil"
                          size="small"
                          color="primary"
                          variant="text"
                          @click="editPart(item)"
                        />
                        <v-btn
                          icon="mdi-delete"
                          size="small"
                          color="error"
                          variant="text"
                          @click="deletePart(item)"
                        />
                        <v-btn
                          icon="mdi-plus-minus"
                          size="small"
                          color="warning"
                          variant="text"
                          @click="adjustStock(item)"
                        />
                        <v-btn
                          icon="mdi-cart"
                          size="small"
                          color="success"
                          variant="text"
                          @click="orderPart(item)"
                        />
                      </div>
                    </td>
                  </tr>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Onglet Fournisseurs -->
      <v-window-item value="1">
        <v-row>
          <v-col cols="12">
            <v-card elevation="3" rounded="xl" class="pa-2">
              <v-card-title>
                <v-text-field
                  v-model="supplierSearch"
                  append-icon="mdi-magnify"
                  label="Rechercher un fournisseur"
                  single-line
                  hide-details
                  variant="solo"
                  rounded="pill"
                  density="comfortable"
                  class="search-field"
                ></v-text-field>
              </v-card-title>

              <v-data-table
                :headers="supplierHeaders"
                :items="suppliers"
                :search="supplierSearch"
                :loading="storeLoading"
                hover
                class="inventory-table"
              >
                <template #item.actions="{ item }">
                  <div class="d-flex gap-2">
                    <v-btn
                      icon="mdi-pencil"
                      variant="tonal"
                      color="primary"
                      size="small"
                      rounded="lg"
                      density="comfortable"
                      @click="editSupplier(item)"
                    ></v-btn>
                    <v-btn
                      icon="mdi-delete"
                      variant="tonal"
                      color="error"
                      size="small"
                      rounded="lg"
                      density="comfortable"
                      @click="deleteSupplier(item)"
                    ></v-btn>
                  </div>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>

    <!-- Dialog pour nouvelle/modification pièce -->
    <v-dialog
      v-model="dialog"
      max-width="600px"
    >
      <v-card
        elevation="2"
        rounded
      >
        <v-card-title class="text-h6 px-4 pt-4">
          {{ formTitle }}
        </v-card-title>

        <v-card-text class="px-4 py-4">
          <v-container>
            <template v-if="activeTab === 0">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.name"
                    label="Nom"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    hide-details="auto"
                    class="mb-3"
                    :rules="[rules.required]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="editedItem.description"
                    label="Description"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    hide-details="auto"
                    class="mb-3"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="editedItem.price"
                    label="Prix"
                    type="number"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    hide-details="auto"
                    class="mb-3"
                    :rules="[rules.required, rules.nonNegative]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="editedItem.stock"
                    label="Stock"
                    type="number"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    hide-details="auto"
                    class="mb-3"
                    :rules="[rules.required, rules.nonNegative]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model.number="editedItem.minStock"
                    label="Stock minimum"
                    type="number"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    hide-details="auto"
                    class="mb-3"
                    :rules="[rules.required, rules.nonNegative]"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="editedItem.manufacturerId"
                    :items="sortedManufacturers"
                    item-title="name"
                    item-value="id"
                    label="Fabricant"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    hide-details="auto"
                    class="mb-3"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="editedItem.supplierId"
                    :items="sortedSuppliers"
                    item-title="name"
                    item-value="id"
                    label="Fournisseur"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    hide-details="auto"
                    class="mb-3"
                  ></v-select>
                </v-col>
              </v-row>
            </template>
            <template v-else>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedSupplier.name"
                    label="Nom du fournisseur"
                    required
                    :rules="[v => !!v || 'Le nom est requis']"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    hide-details="auto"
                    class="mb-3"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedSupplier.email"
                    label="Email"
                    type="email"
                    required
                    :rules="[
                      v => !!v || 'L\'email est requis',
                      v => /.+@.+\..+/.test(v) || 'L\'email doit être valide'
                    ]"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    hide-details="auto"
                    class="mb-3"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedSupplier.phone"
                    label="Téléphone"
                    required
                    :rules="[v => !!v || 'Le téléphone est requis']"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    hide-details="auto"
                    class="mb-3"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedSupplier.address"
                    label="Adresse"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    hide-details="auto"
                    class="mb-3"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="editedSupplier.notes"
                    label="Notes"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    hide-details="auto"
                    auto-grow
                    rows="3"
                  ></v-textarea>
                </v-col>
              </v-row>
            </template>
          </v-container>
        </v-card-text>

        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn 
            color="error" 
            variant="tonal"
            rounded
            @click="close"
            class="mr-2"
          >
            Annuler
          </v-btn>
          <v-btn 
            color="primary" 
            rounded
            @click="save" 
            :disabled="!isFormValid"
            class="elevation-2"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog pour ajuster le stock -->
    <v-dialog
      v-model="stockDialog"
      max-width="400px"
    >
      <v-card
        elevation="2"
        rounded
      >
        <v-card-title class="text-h6 px-4 pt-4">
          Ajuster le stock de {{ selectedPart?.name }}
        </v-card-title>

        <v-card-text class="px-4 py-4">
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model.number="stockAdjustment"
                  label="Quantité à ajuster"
                  type="number"
                  required
                  :rules="[
                    v => !!v || 'La quantité est requise',
                    v => (Number(v) + Number(selectedPart?.stock)) >= 0 || 'Le stock ne peut pas être négatif'
                  ]"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  hide-details="auto"
                  class="mb-3"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="stockAdjustmentNote"
                  label="Note (optionnel)"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  hide-details="auto"
                  auto-grow
                  rows="3"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn 
            color="error" 
            variant="tonal"
            rounded
            @click="stockDialog = false"
            class="mr-2"
          >
            Annuler
          </v-btn>
          <v-btn 
            color="primary" 
            rounded
            @click="submitStockAdjustment"
            :disabled="!isStockAdjustmentValid"
            class="elevation-2"
          >
            Valider
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog pour commander -->
    <v-dialog
      v-model="orderDialog"
      max-width="400px"
    >
      <v-card
        elevation="2"
        rounded
      >
        <v-card-title class="text-h6 px-4 pt-4">
          Commander {{ selectedPart?.name }}
        </v-card-title>

        <v-card-text class="px-4 py-4">
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model.number="orderQuantity"
                  label="Quantité à commander"
                  type="number"
                  required
                  :rules="[
                    v => !!v || 'La quantité est requise',
                    v => v > 0 || 'La quantité doit être supérieure à 0'
                  ]"
                  variant="outlined"
                  density="comfortable"
                  rounded="lg"
                  hide-details="auto"
                  class="mb-3"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn 
            color="error" 
            variant="tonal"
            rounded
            @click="orderDialog = false"
            class="mr-2"
          >
            Annuler
          </v-btn>
          <v-btn 
            color="primary" 
            rounded
            @click="submitOrder"
            class="elevation-2"
          >
            Commander
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useInventoryStore } from '@/stores/inventory'
import { useSnackbar } from '@/composables/useSnackbar'

const authStore = useAuthStore()
const inventoryStore = useInventoryStore()
const { showSnackbar } = useSnackbar()

const activeTab = ref(0)
const dialog = ref(false)
const orderDialog = ref(false)
const stockDialog = ref(false)
const search = ref('')
const supplierSearch = ref('')
const editedIndex = ref(-1)
const selectedPart = ref(null)
const stockAdjustment = ref(0)
const stockAdjustmentNote = ref('')
const editedItem = ref({
  id: '',
  name: '',
  description: '',
  stock: 0,
  minStock: 0,
  price: 0,
  manufacturerId: null,
  supplierId: null
})

const editedSupplier = ref({
  name: '',
  email: '',
  phone: '',
  address: ''
})

const defaultItem = {
  id: '',
  name: '',
  description: '',
  stock: 0,
  minStock: 0,
  price: 0,
  manufacturerId: null,
  supplierId: null
}

const defaultSupplier = {
  name: '',
  email: '',
  phone: '',
  address: ''
}

const manufacturers = computed(() => inventoryStore.manufacturers)
const suppliers = computed(() => inventoryStore.suppliers)
const items = computed(() => inventoryStore.items)
const storeLoading = computed(() => inventoryStore.loading)

const sortedManufacturers = computed(() => {
  return [...manufacturers.value].sort((a, b) => a.name.localeCompare(b.name))
})

const sortedSuppliers = computed(() => {
  return [...suppliers.value].sort((a, b) => a.name.localeCompare(b.name))
})

const rules = {
  required: v => !!v || 'Ce champ est requis',
  nonNegative: v => v >= 0 || 'La valeur ne peut pas être négative'
}

// Fonction pour ajouter un fournisseur de test
const addTestSupplier = async () => {
  try {
    const testSupplier = {
      name: 'PhoneParts Pro',
      email: 'contact@phonepartspro.com',
      phone: '+33123456789',
      address: '123 Rue de la Réparation, Paris'
    }
    
    await inventoryStore.addSupplier(testSupplier)
    showSnackbar('Fournisseur de test ajouté avec succès', 'success')
    await loadData()
  } catch (error) {
    console.error('Error adding test supplier:', error)
    showSnackbar('Erreur lors de l\'ajout du fournisseur de test', 'error')
  }
}

// Chargement des données
const loadData = async () => {
  try {
    await inventoryStore.fetchInventory()
    // Si aucun fournisseur n'existe, ajouter le fournisseur de test
    if (inventoryStore.suppliers.length === 0) {
      await addTestSupplier()
    }
  } catch (error) {
    console.error('Error loading data:', error)
    showSnackbar('Erreur lors du chargement des données', 'error')
  }
}

const headers = ref([
  { title: 'Nom', key: 'name', align: 'start' },
  { title: 'Description', key: 'description', align: 'start' },
  { title: 'Stock', key: 'stock', align: 'center', sortable: true },
  { title: 'Stock min.', key: 'minStock', align: 'center', sortable: true },
  { title: 'Prix', key: 'price', align: 'end', sortable: true },
  { title: 'Fabricant', key: 'manufacturer.name', align: 'start' },
  { title: 'Fournisseur', key: 'supplier.name', align: 'start' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
])

const supplierHeaders = ref([
  { title: 'Nom', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Téléphone', key: 'phone' },
  { title: 'Adresse', key: 'address' },
  { title: 'Actions', key: 'actions', sortable: false }
])

const parts = computed(() => items.value)
const formTitle = computed(() => {
  if (activeTab.value === 0) {
    return editedIndex.value === -1 ? 'Nouvelle pièce' : 'Modifier la pièce'
  } else {
    return editedSupplier.value.id ? 'Modifier le fournisseur' : 'Nouveau fournisseur'
  }
})

const getStockColor = (stock) => {
  const numStock = Number(stock) || 0
  if (numStock <= 0) return 'error'
  if (numStock <= 5) return 'warning'
  return 'success'
}

const isFormValid = computed(() => {
  if (activeTab.value === 0) {
    return (
      editedItem.value.name &&
      editedItem.value.stock >= 0 &&
      editedItem.value.minStock >= 0 &&
      editedItem.value.price >= 0 &&
      editedItem.value.manufacturerId &&
      editedItem.value.supplierId
    )
  } else {
    return (
      editedSupplier.value.name &&
      editedSupplier.value.email &&
      editedSupplier.value.phone
    )
  }
})

const isStockAdjustmentValid = computed(() => {
  return selectedPart.value && 
    (selectedPart.value.stock + stockAdjustment.value) >= 0
})

const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

const suppliersList = computed(() => {
  return suppliers.value.map(s => ({
    id: s.id,
    name: s.name
  }))
})

const editPart = (item) => {
  editedIndex.value = items.value.indexOf(item)
  editedItem.value = {
    id: item.id,
    name: item.name,
    description: item.description,
    stock: item.stock,
    minStock: item.minStock,
    price: item.price,
    manufacturerId: item.manufacturerId,
    supplierId: item.supplierId
  }
  activeTab.value = 0
  dialog.value = true
}

const orderPart = (item) => {
  selectedPart.value = item
  orderDialog.value = true
}

const submitOrder = () => {
  console.log(`Commander ${orderQuantity.value} ${selectedPart.value.name}`)
  orderDialog.value = false
  orderQuantity.value = 1
}

const deletePart = async (item) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette pièce ?')) return
  
  try {
    await deleteDoc(doc(db, 'inventory', item.id))
    const index = items.value.indexOf(item)
    items.value.splice(index, 1)
  } catch (error) {
    console.error('Erreur lors de la suppression de la pièce:', error)
  }
}

const editSupplier = (item) => {
  editedSupplier.value = Object.assign({}, item)
  dialog.value = true
}

const deleteSupplier = async (item) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) return

  try {
    await deleteDoc(doc(db, 'suppliers', item.id))
    const index = suppliers.value.indexOf(item)
    suppliers.value.splice(index, 1)
  } catch (error) {
    console.error('Erreur lors de la suppression du fournisseur:', error)
  }
}

const adjustStock = (item) => {
  selectedPart.value = item
  stockAdjustment.value = 0
  stockAdjustmentNote.value = ''
  stockDialog.value = true
}

const submitStockAdjustment = async () => {
  try {
    if (!selectedPart.value || stockAdjustment.value === 0) {
      showSnackbar('Veuillez saisir une quantité valide', 'error')
      return
    }

    const newStock = Number(selectedPart.value.stock) + Number(stockAdjustment.value)
    if (newStock < 0) {
      showSnackbar('Le stock ne peut pas être négatif', 'error')
      return
    }

    // Mettre à jour le stock via le store
    await inventoryStore.updateItemQuantity(selectedPart.value.id, newStock)
    
    // Mettre à jour l'interface
    selectedPart.value.stock = newStock
    
    showSnackbar('Stock ajusté avec succès', 'success')
    stockDialog.value = false
    
    // Réinitialiser les valeurs
    stockAdjustment.value = 0
    stockAdjustmentNote.value = ''
    selectedPart.value = null
  } catch (error) {
    console.error('Erreur lors de l\'ajustement du stock:', error)
    showSnackbar('Erreur lors de l\'ajustement du stock', 'error')
  }
}

const close = () => {
  dialog.value = false
  if (activeTab.value === 0) {
    editedIndex.value = -1
    editedItem.value = Object.assign({}, defaultItem)
  } else {
    editedSupplier.value = Object.assign({}, defaultSupplier)
  }
}

async function save() {
  if (activeTab.value === 0) {
    // Sauvegarde d'une pièce
    try {
      // Vérifier les données requises
      if (!editedItem.value.name?.trim()) {
        showSnackbar('Le nom est requis', 'error')
        return
      }

      // Vérifier que le prix et les stocks sont valides
      if (editedItem.value.price < 0 || editedItem.value.stock < 0 || editedItem.value.minStock < 0) {
        showSnackbar('Les valeurs numériques ne peuvent pas être négatives', 'error')
        return
      }

      const itemData = {
        name: editedItem.value.name?.trim() || '',
        description: editedItem.value.description?.trim() || '',
        stock: Number(editedItem.value.stock) || 0,
        minStock: Number(editedItem.value.minStock) || 0,
        price: Number(editedItem.value.price) || 0,
        manufacturerId: editedItem.value.manufacturerId,
        supplierId: editedItem.value.supplierId
      }

      // Vérifier que les relations existent
      if (itemData.manufacturerId && !manufacturers.value.find(m => m.id === itemData.manufacturerId)) {
        showSnackbar('Le fabricant sélectionné n\'existe pas', 'error')
        return
      }
      if (itemData.supplierId && !suppliers.value.find(s => s.id === itemData.supplierId)) {
        showSnackbar('Le fournisseur sélectionné n\'existe pas', 'error')
        return
      }

      if (editedIndex.value > -1 && editedItem.value.id) {
        // Mise à jour
        await inventoryStore.updateItem(editedItem.value.id, itemData)
        showSnackbar('Pièce mise à jour avec succès', 'success')
      } else {
        // Création
        await inventoryStore.addItem(itemData)
        showSnackbar('Pièce créée avec succès', 'success')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la pièce:', error)
      showSnackbar(error.message || 'Erreur lors de la sauvegarde de la pièce', 'error')
      return
    }
  } else {
    // Sauvegarde d'un fournisseur
    try {
      // Vérifier les données requises
      if (!editedSupplier.value.name?.trim()) {
        showSnackbar('Le nom est requis', 'error')
        return
      }

      const supplierData = {
        name: editedSupplier.value.name?.trim() || '',
        email: editedSupplier.value.email?.trim() || '',
        phone: editedSupplier.value.phone?.trim() || '',
        address: editedSupplier.value.address?.trim() || '',
        notes: editedSupplier.value.notes?.trim() || ''
      }

      if (editedIndex.value > -1 && editedSupplier.value.id) {
        // Mise à jour
        await inventoryStore.updateSupplier(editedSupplier.value.id, supplierData)
        showSnackbar('Fournisseur mis à jour avec succès', 'success')
      } else {
        // Création
        await inventoryStore.addSupplier(supplierData)
        showSnackbar('Fournisseur créé avec succès', 'success')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du fournisseur:', error)
      showSnackbar(error.message || 'Erreur lors de la sauvegarde du fournisseur', 'error')
      return
    }
  }
  
  close()
  await loadData()
}

const resetForm = () => {
  // Réinitialiser les formulaires lors du changement d'onglet
  if (activeTab.value === 0) {
    editedItem.value = { ...defaultItem }
    editedIndex.value = -1
  } else {
    editedSupplier.value = { ...defaultSupplier }
  }
}

// Variable pour stocker l'intervalle
let refreshInterval = null

// Rafraîchir les données au montage
onMounted(async () => {
  await loadData()
  // Rafraîchir les données toutes les 30 secondes
  refreshInterval = setInterval(async () => {
    await loadData()
  }, 30000)
})

// Nettoyer l'intervalle lors du démontage du composant
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})

</script>

<style scoped>
.v-data-table {
  background: transparent !important;
}

.search-field {
  max-width: 300px;
}

.inventory-table {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.v-data-table-footer) {
  background: transparent !important;
}

:deep(.v-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.v-table__wrapper) {
  border-radius: 8px;
  overflow: hidden;
}

.gap-2 {
  gap: 8px;
}

:deep(.v-dialog) {
  border-radius: 16px;
}

:deep(.v-dialog > .v-card) {
  border-radius: 16px;
  overflow: hidden;
}
</style>
