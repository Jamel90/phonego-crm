<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <h1 class="text-h4 font-weight-bold primary-gradient-text mb-1">Paramètres Utilisateur</h1>
            <p class="text-subtitle-1 text-medium-emphasis">Gérez vos préférences personnelles</p>
          </div>
        </div>

        <v-card>
          <v-tabs v-model="activeTab" color="primary">
            <v-tab value="profile">
              <v-icon start>mdi-account</v-icon>
              Profil
            </v-tab>
            <v-tab value="preferences">
              <v-icon start>mdi-cog</v-icon>
              Préférences
            </v-tab>
            <v-tab value="notifications">
              <v-icon start>mdi-bell</v-icon>
              Notifications
            </v-tab>
          </v-tabs>

          <v-card-text>
            <v-window v-model="activeTab">
              <v-window-item value="profile">
                <v-form v-model="profileForm" @submit.prevent="saveProfile">
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="profile.firstName"
                        label="Prénom"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="profile.lastName"
                        label="Nom"
                        required
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="profile.email"
                        label="Email"
                        type="email"
                        required
                        disabled
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="profile.phone"
                        label="Téléphone"
                        type="tel"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="loading"
                    :disabled="!profileForm"
                  >
                    Sauvegarder
                  </v-btn>
                </v-form>
              </v-window-item>

              <v-window-item value="preferences">
                <v-row>
                  <v-col cols="12">
                    <v-switch
                      v-model="preferences.darkMode"
                      label="Mode sombre"
                      color="primary"
                      @change="savePreferences"
                    ></v-switch>
                  </v-col>
                  <v-col cols="12">
                    <v-select
                      v-model="preferences.language"
                      :items="languages"
                      label="Langue"
                      @update:model-value="savePreferences"
                    ></v-select>
                  </v-col>
                </v-row>
              </v-window-item>

              <v-window-item value="notifications">
                <v-row>
                  <v-col cols="12">
                    <v-switch
                      v-model="notifications.email"
                      label="Notifications par email"
                      color="primary"
                      @change="saveNotifications"
                    ></v-switch>
                  </v-col>
                  <v-col cols="12">
                    <v-switch
                      v-model="notifications.push"
                      label="Notifications push"
                      color="primary"
                      @change="saveNotifications"
                    ></v-switch>
                  </v-col>
                </v-row>
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
import { useAuthStore } from '@/stores/auth'
import { useSnackbar } from '@/composables/useSnackbar'

const authStore = useAuthStore()
const { showSuccess, showError } = useSnackbar()

const activeTab = ref('profile')
const loading = ref(false)
const profileForm = ref(false)

const profile = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
})

const preferences = ref({
  darkMode: false,
  language: 'fr'
})

const notifications = ref({
  email: true,
  push: true
})

const languages = [
  { title: 'Français', value: 'fr' },
  { title: 'English', value: 'en' }
]

onMounted(async () => {
  // Charger les données du profil
  const user = authStore.user
  if (user) {
    profile.value = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || ''
    }
  }

  // Charger les préférences
  // TODO: Implémenter le chargement des préférences depuis le store ou l'API
})

async function saveProfile() {
  try {
    loading.value = true
    // TODO: Implémenter la sauvegarde du profil
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulation
    showSuccess('Profil mis à jour avec succès')
  } catch (error) {
    showError('Erreur lors de la mise à jour du profil')
    console.error(error)
  } finally {
    loading.value = false
  }
}

async function savePreferences() {
  try {
    // TODO: Implémenter la sauvegarde des préférences
    showSuccess('Préférences mises à jour avec succès')
  } catch (error) {
    showError('Erreur lors de la mise à jour des préférences')
    console.error(error)
  }
}

async function saveNotifications() {
  try {
    // TODO: Implémenter la sauvegarde des notifications
    showSuccess('Préférences de notification mises à jour avec succès')
  } catch (error) {
    showError('Erreur lors de la mise à jour des notifications')
    console.error(error)
  }
}
</script>

<style scoped>
.v-card-text {
  padding-top: 20px;
}
</style>
