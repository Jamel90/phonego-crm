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
              <h1 class="text-h4 font-weight-bold mb-2">Inscription</h1>
              <p class="text-body-1 text-medium-emphasis">
                Créez votre compte PhoneGO CRM gratuitement
              </p>
            </div>

            <v-form @submit.prevent="handleRegister" ref="form">
              <v-text-field
                v-model="shopName"
                label="Nom de la boutique"
                required
                :rules="[v => !!v || 'Nom de la boutique requis']"
              />

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
                :rules="[
                  v => !!v || 'Mot de passe requis',
                  v => v.length >= 8 || 'Le mot de passe doit contenir au moins 8 caractères'
                ]"
              />

              <v-text-field
                v-model="confirmPassword"
                label="Confirmer le mot de passe"
                type="password"
                required
                :rules="[
                  v => !!v || 'Confirmation du mot de passe requise',
                  v => v === password || 'Les mots de passe ne correspondent pas'
                ]"
              />

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="loading"
                class="mt-6"
              >
                S'inscrire
              </v-btn>
            </v-form>

            <div class="text-center mt-6">
              <p class="text-body-2 text-medium-emphasis">
                Déjà un compte ?
                <router-link :to="{ name: 'login' }" class="text-primary font-weight-medium">
                  Se connecter
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const form = ref(null)
const shopName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const handleRegister = async () => {
  const { valid } = await form.value.validate()
  if (!valid) return

  loading.value = true
  try {
    await authStore.register(email.value, password.value, shopName.value)
    router.push({ name: 'dashboard' })
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  min-height: 100vh;
}
</style>
