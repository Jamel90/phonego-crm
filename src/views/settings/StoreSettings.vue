<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <h1 class="text-h4 font-weight-bold primary-gradient-text mb-1">Paramètres de la Boutique</h1>
            <p class="text-subtitle-1 text-medium-emphasis">Gérez les paramètres de votre boutique</p>
          </div>
        </div>

        <v-card>
          <v-tabs v-model="activeTab" color="primary">
            <v-tab value="general">
              <v-icon start>mdi-store</v-icon>
              Général
            </v-tab>
            <v-tab value="printers">
              <v-icon start>mdi-printer</v-icon>
              Imprimantes
            </v-tab>
            <v-tab value="repair-issues">
              <v-icon start>mdi-wrench</v-icon>
              Problèmes de Réparation
            </v-tab>
            <v-tab value="manufacturers">
              <v-icon start>mdi-factory</v-icon>
              Fabricants
            </v-tab>
            <v-tab value="settings">
              <v-icon start>mdi-cog</v-icon>
              Paramètres
            </v-tab>
          </v-tabs>

          <v-card-text>
            <v-window v-model="activeTab">
              <v-window-item value="general">
                <router-view name="general"></router-view>
              </v-window-item>

              <v-window-item value="printers">
                <router-view name="printers"></router-view>
              </v-window-item>

              <v-window-item value="repair-issues">
                <router-view name="repair-issues"></router-view>
              </v-window-item>

              <v-window-item value="manufacturers">
                <router-view name="manufacturers"></router-view>
              </v-window-item>

              <v-window-item value="settings">
                <v-form @submit.prevent="saveSettings" class="mt-4">
                  <v-text-field
                    v-model="settings.name"
                    label="Nom de la boutique"
                    variant="outlined"
                    required
                  />
                  <v-text-field
                    v-model="settings.address"
                    label="Adresse"
                    variant="outlined"
                  />
                  <v-text-field
                    v-model="settings.phone"
                    label="Téléphone"
                    variant="outlined"
                  />
                  <v-text-field
                    v-model="settings.email"
                    label="Email"
                    variant="outlined"
                    type="email"
                  />
                  <v-text-field
                    v-model="settings.siret"
                    label="SIRET"
                    variant="outlined"
                  />
                  <v-text-field
                    v-model="settings.tva"
                    label="Numéro de TVA"
                    variant="outlined"
                  />
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="loading"
                    :disabled="!isFormValid"
                  >
                    Enregistrer
                  </v-btn>
                </v-form>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSnackbar } from '@/composables/useSnackbar'
import { db } from '@/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const activeTab = ref('general')

const authStore = useAuthStore()
const { showSuccess, showError } = useSnackbar()

const loading = ref(false)
const settings = ref({
  name: '',
  address: '',
  phone: '',
  email: '',
  siret: '',
  tva: ''
})

const isFormValid = computed(() => {
  return settings.value.name.trim() !== ''
})

const loadSettings = async () => {
  try {
    const storeId = authStore.currentStore?.id
    if (!storeId) return

    const storeRef = doc(db, 'stores', storeId)
    const storeDoc = await getDoc(storeRef)
    
    if (storeDoc.exists()) {
      const data = storeDoc.data()
      settings.value = {
        name: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        siret: data.siret || '',
        tva: data.tva || ''
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error)
    showError('Erreur lors du chargement des paramètres')
  }
}

const saveSettings = async () => {
  if (!isFormValid.value) return

  loading.value = true
  try {
    const storeId = authStore.currentStore?.id
    if (!storeId) throw new Error('Boutique non trouvée')

    const storeRef = doc(db, 'stores', storeId)
    await updateDoc(storeRef, {
      ...settings.value,
      updatedAt: new Date()
    })

    showSuccess('Paramètres enregistrés avec succès')
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error)
    showError('Erreur lors de la sauvegarde des paramètres')
  } finally {
    loading.value = false
  }
}

// Synchroniser l'onglet actif avec la route
watch(activeTab, (newTab) => {
  router.push({ name: `${newTab}` })
})

// Initialiser l'onglet actif en fonction de la route
watch(
  () => route.name,
  (newRouteName) => {
    if (newRouteName) {
      activeTab.value = newRouteName.toLowerCase()
    }
  },
  { immediate: true }
)

onMounted(loadSettings)
</script>

<style scoped>
.v-card-text {
  padding-top: 20px;
}
</style>
