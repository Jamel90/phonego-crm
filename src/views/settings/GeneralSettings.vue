<template>
  <v-form v-model="form" @submit.prevent="saveSettings">
    <v-row>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="settings.storeName"
          label="Nom de la boutique"
          required
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="settings.phone"
          label="Téléphone"
          type="tel"
          required
        ></v-text-field>
      </v-col>
      <v-col cols="12">
        <v-text-field
          v-model="settings.email"
          label="Email"
          type="email"
          required
        ></v-text-field>
      </v-col>
      <v-col cols="12">
        <v-textarea
          v-model="settings.address"
          label="Adresse"
          required
          rows="3"
        ></v-textarea>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="settings.siret"
          label="SIRET"
          required
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="settings.tva"
          label="Numéro de TVA"
          required
        ></v-text-field>
      </v-col>
      <v-col cols="12">
        <v-textarea
          v-model="settings.footerText"
          label="Texte de pied de page (factures)"
          rows="3"
        ></v-textarea>
      </v-col>
      <v-col cols="12">
        <v-file-input
          v-model="logo"
          label="Logo de la boutique"
          accept="image/*"
          prepend-icon="mdi-camera"
          @change="handleLogoChange"
        ></v-file-input>
      </v-col>
    </v-row>
    <v-btn
      color="primary"
      type="submit"
      :loading="loading"
      :disabled="!form"
    >
      Sauvegarder
    </v-btn>
  </v-form>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { showSuccess, showError } = useSnackbar()

const form = ref(false)
const loading = ref(false)
const logo = ref(null)

const settings = ref({
  storeName: '',
  phone: '',
  email: '',
  address: '',
  siret: '',
  tva: '',
  footerText: '',
  logoUrl: ''
})

onMounted(async () => {
  await loadSettings()
})

async function loadSettings() {
  try {
    const storeId = authStore.user.storeId
    const docRef = doc(db, 'stores', storeId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      settings.value = { ...docSnap.data() }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error)
    showError('Erreur lors du chargement des paramètres')
  }
}

async function handleLogoChange(file) {
  if (!file) return

  try {
    const storeId = authStore.user.storeId
    const logoRef = storageRef(storage, `stores/${storeId}/logo`)
    
    await uploadBytes(logoRef, file)
    const logoUrl = await getDownloadURL(logoRef)
    settings.value.logoUrl = logoUrl
  } catch (error) {
    console.error('Erreur lors du téléchargement du logo:', error)
    showError('Erreur lors du téléchargement du logo')
  }
}

async function saveSettings() {
  if (!form.value) return

  try {
    loading.value = true
    const storeId = authStore.user.storeId
    const docRef = doc(db, 'stores', storeId)
    
    await updateDoc(docRef, settings.value)
    showSuccess('Paramètres sauvegardés avec succès')
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error)
    showError('Erreur lors de la sauvegarde des paramètres')
  } finally {
    loading.value = false
  }
}
</script>
