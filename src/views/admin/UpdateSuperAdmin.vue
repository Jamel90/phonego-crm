<template>
  <v-container>
    <v-card>
      <v-card-title>
        Mettre à jour le Super Admin
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="updateAdmin">
          <v-text-field
            v-model="email"
            label="Email de l'administrateur"
            type="email"
            required
            :disabled="loading"
          />
          <v-btn
            color="primary"
            type="submit"
            :loading="loading"
            class="mt-4"
          >
            Définir comme Super Admin
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { updateUserRole } from '@/services/admin/updateUserRole'

const { showSnackbar } = useSnackbar()
const email = ref('admin@phonego.fr')
const loading = ref(false)

const updateAdmin = async () => {
  loading.value = true
  try {
    const result = await updateUserRole(email.value, 'super_admin')
    if (result.success) {
      showSnackbar({
        text: 'Le rôle super admin a été mis à jour avec succès',
        color: 'success'
      })
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    showSnackbar({
      text: `Erreur lors de la mise à jour: ${error.message}`,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>
