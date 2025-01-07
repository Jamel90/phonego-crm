<template>
  <div class="auth-page">
    <v-container class="fill-height">
      <v-row justify="center" align="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="pa-8" elevation="8">
            <div class="text-center mb-8">
              <v-img
                src="/logo.png"
                alt="PhoneGO Logo"
                height="40"
                contain
                class="mb-4 mx-auto"
              />
              <h1 class="text-h4 font-weight-bold mb-2">Connexion</h1>
              <p class="text-body-1 text-medium-emphasis">
                Connectez-vous à votre compte PhoneGO CRM
              </p>
            </div>

            <v-form @submit.prevent="handleLogin" ref="form">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                required
                :rules="[v => !!v || 'Email requis', v => /.+@.+\..+/.test(v) || 'Email invalide']"
              />

              <v-text-field
                v-model="password"
                label="Mot de passe"
                type="password"
                required
                :rules="[v => !!v || 'Mot de passe requis']"
              />

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="loading"
                class="mt-6"
              >
                Se connecter
              </v-btn>
              <v-alert v-if="errorMessage" type="error" class="mt-4">
                {{ errorMessage }}
              </v-alert>
            </v-form>

            <div class="text-center mt-6">
              <p class="text-body-2 text-medium-emphasis">
                Pas encore de compte ?
                <router-link :to="{ name: 'register' }" class="text-primary font-weight-medium">
                  S'inscrire
                </router-link>
              </p>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const form = ref(null)
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return

  loading.value = true
  errorMessage.value = ''

  try {
    await authStore.login(email.value, password.value)
    router.push({ name: 'dashboard' })
  } catch (error) {
    console.error('Erreur de connexion:', error)
    errorMessage.value = error.message || 'Erreur lors de la connexion'
  } finally {
    loading.value = false
  }
}

// Vérifier la connexion internet
const checkConnection = () => {
  if (!navigator.onLine) {
    errorMessage.value = 'Pas de connexion internet. Veuillez vérifier votre connexion.'
  } else {
    errorMessage.value = ''
  }
}

// Ajouter les écouteurs d'événements pour la connexion internet
onMounted(() => {
  window.addEventListener('online', checkConnection)
  window.addEventListener('offline', checkConnection)
  checkConnection()
})

onUnmounted(() => {
  window.removeEventListener('online', checkConnection)
  window.removeEventListener('offline', checkConnection)
})
</script>

<style scoped>
.auth-page {
  background: linear-gradient(135deg, 135deg 0%, 135deg 100%);
  min-height: 100vh;
}
</style>
