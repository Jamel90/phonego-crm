<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-tabs v-model="activeTab">
            <v-tab value="general">Général</v-tab>
            <v-tab value="printers">Imprimantes</v-tab>
            <v-tab value="manufacturers">Fabricants</v-tab>
            <v-tab value="repair-issues">Types de réparation</v-tab>
          </v-tabs>

          <v-card-text>
            <v-window v-model="activeTab">
              <!-- Paramètres généraux -->
              <v-window-item value="general">
                <v-form @submit.prevent="saveGeneralSettings">
                  <v-text-field
                    v-model="settings.storeName"
                    label="Nom de la boutique"
                    variant="outlined"
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
                  />
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="saving"
                  >
                    Enregistrer
                  </v-btn>
                </v-form>
              </v-window-item>

              <!-- Paramètres imprimantes -->
              <v-window-item value="printers">
                <printer-settings />
              </v-window-item>

              <!-- Paramètres fabricants -->
              <v-window-item value="manufacturers">
                <manufacturers-settings />
              </v-window-item>

              <!-- Paramètres types de réparation -->
              <v-window-item value="repair-issues">
                <repair-issues-settings />
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { db } from '@/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'
import PrinterSettings from './settings/PrinterSettings.vue'
import ManufacturersSettings from './settings/ManufacturersSettings.vue'
import RepairIssuesSettings from './settings/RepairIssuesSettings.vue'

const authStore = useAuthStore()
const { showSnackbar } = useSnackbar()

// États
const activeTab = ref('general')
const saving = ref(false)
const settings = ref({
  storeName: '',
  address: '',
  phone: '',
  email: ''
})

// Chargement des paramètres
const loadSettings = async () => {
  try {
    const storeId = authStore.currentStore?.id
    if (!storeId) return

    const storeRef = doc(db, 'stores', storeId)
    const storeDoc = await getDoc(storeRef)
    
    if (storeDoc.exists()) {
      const data = storeDoc.data()
      settings.value = {
        storeName: data.name || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || ''
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error)
    showSnackbar({
      text: 'Erreur lors du chargement des paramètres',
      color: 'error'
    })
  }
}

// Sauvegarde des paramètres généraux
const saveGeneralSettings = async () => {
  saving.value = true
  try {
    const storeId = authStore.currentStore?.id
    if (!storeId) throw new Error('Boutique non trouvée')

    const storeRef = doc(db, 'stores', storeId)
    await updateDoc(storeRef, {
      name: settings.value.storeName,
      address: settings.value.address,
      phone: settings.value.phone,
      email: settings.value.email,
      updatedAt: new Date()
    })

    showSnackbar({
      text: 'Paramètres enregistrés avec succès',
      color: 'success'
    })
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error)
    showSnackbar({
      text: 'Erreur lors de la sauvegarde des paramètres',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

// Chargement initial
onMounted(loadSettings)
</script>

<style scoped>
.v-card-text {
  padding-top: 20px;
}

.v-window {
  margin-top: 20px;
}
</style>
