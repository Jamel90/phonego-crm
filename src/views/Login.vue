<template>
  <v-container class="login-container" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="login-card elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title class="login-title">Connexion Phone GO CRM</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form ref="form" v-model="valid" @submit.prevent="handleLogin">
              <v-text-field
                v-model="email"
                :rules="emailRules"
                label="Email"
                name="email"
                prepend-icon="mdi-email"
                type="email"
                required
              ></v-text-field>

              <v-text-field
                v-model="password"
                :rules="passwordRules"
                label="Mot de passe"
                name="password"
                prepend-icon="mdi-lock"
                type="password"
                required
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              :loading="auth.loading"
              :disabled="!valid"
              @click="handleLogin"
            >
              Se connecter
            </v-btn>
          </v-card-actions>
          <v-alert
            v-if="auth.error"
            type="error"
            class="ma-3"
          >
            {{ auth.error }}
          </v-alert>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = ref(null)
const valid = ref(false)
const email = ref('')
const password = ref('')

const emailRules = [
  v => !!v || 'L\'email est requis',
  v => /.+@.+\..+/.test(v) || 'L\'email doit être valide'
]

const passwordRules = [
  v => !!v || 'Le mot de passe est requis',
  v => v.length >= 6 || 'Le mot de passe doit contenir au moins 6 caractères'
]

async function handleLogin() {
  if (!form.value?.validate()) return

  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (error) {
    console.error('Erreur de connexion:', error)
  }
}
</script>

<style scoped>
.login-container {
  background-color: var(--bg-primary);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
}

.login-card {
  background-color: var(--bg-surface) !important;
  border: 1px solid var(--border-light);
  width: 100%;
  max-width: 400px;
}

.login-title {
  color: var(--text-primary);
}

.login-subtitle {
  color: var(--text-secondary);
}

.v-field {
  background-color: var(--bg-surface) !important;
}

.v-field__overlay {
  background-color: var(--bg-surface) !important;
}

.v-field__field {
  color: var(--text-primary) !important;
}
</style>
