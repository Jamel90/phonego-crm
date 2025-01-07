<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card>
          <v-card-title class="text-center">
            Restauration Super Admin
          </v-card-title>
          
          <v-card-text>
            <v-alert
              v-if="showSuccess"
              type="success"
              class="mb-4"
            >
              Le rôle super admin a été restauré avec succès !
            </v-alert>

            <v-alert
              v-if="error"
              type="error"
              class="mb-4"
            >
              {{ error }}
            </v-alert>

            <v-form @submit.prevent="restoreSuperAdmin" ref="form">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                :rules="[v => !!v || 'Email requis']"
                required
                :disabled="loading"
              />

              <v-text-field
                v-model="password"
                label="Mot de passe"
                type="password"
                :rules="[v => !!v || 'Mot de passe requis']"
                required
                :disabled="loading"
              />

              <v-text-field
                v-model="securityCode"
                label="Code de sécurité"
                type="password"
                :rules="[v => !!v || 'Code de sécurité requis']"
                required
                :disabled="loading"
                hint="Code de sécurité fourni par l'équipe technique"
              />

              <v-btn
                color="primary"
                type="submit"
                block
                :loading="loading"
                class="mt-4"
              >
                Restaurer Super Admin
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { db, auth } from '@/firebase'
import { doc, setDoc } from 'firebase/firestore'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = ref(null)
const email = ref('admin@phonego.fr')
const password = ref('')
const securityCode = ref('')
const loading = ref(false)
const error = ref('')
const showSuccess = ref(false)

// Code de sécurité hashé (à remplacer par un vrai hash sécurisé)
const SECURITY_CODE = 'phonego2024'

const restoreSuperAdmin = async () => {
  if (!form.value.validate()) return

  if (securityCode.value !== SECURITY_CODE) {
    error.value = 'Code de sécurité invalide'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // D'abord, connectez-vous avec le compte admin
    await signInWithEmailAndPassword(auth, email.value, password.value)

    // Créer ou mettre à jour l'utilisateur dans la collection staff
    const staffRef = doc(db, 'staff', email.value)
    
    await setDoc(staffRef, {
      email: email.value,
      role: 'super_admin',
      displayName: 'Super Admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      isAdmin: true,
      isSuperAdmin: true
    }, { merge: true })

    showSuccess.value = true
    
    // Rediriger vers la page de login après 2 secondes
    setTimeout(() => {
      router.push('/login')
    }, 2000)

  } catch (err) {
    console.error('Erreur lors de la restauration du super admin:', err)
    error.value = err.message || 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}
</script>
