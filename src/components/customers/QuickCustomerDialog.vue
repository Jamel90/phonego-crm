<template>
  <v-dialog
    v-model="dialog"
    max-width="500px"
    persistent
  >
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        variant="text"
        density="comfortable"
        prepend-icon="mdi-account-plus"
        class="text-none px-2"
        color="primary"
      >
        Nouveau client
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="text-h6 pa-4">
        Nouveau client
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="closeDialog"
          class="float-right"
        />
      </v-card-title>

      <v-card-text class="pa-4">
        <v-form ref="form" v-model="valid" @submit.prevent="saveCustomer">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="formData.name"
                label="Nom complet*"
                :rules="[v => !!v || 'Le nom est requis']"
                required
                autofocus
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.phone"
                label="Téléphone*"
                :rules="[
                  v => !!v || 'Le téléphone est requis',
                  v => /^[0-9+\s-]{10,}$/.test(v) || 'Numéro de téléphone invalide'
                ]"
                required
                prepend-inner-icon="mdi-phone"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.email"
                label="Email"
                :rules="[
                  v => !v || /.+@.+\..+/.test(v) || 'Email invalide'
                ]"
                prepend-inner-icon="mdi-email"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.address"
                label="Adresse"
                rows="2"
                prepend-inner-icon="mdi-map-marker"
                auto-grow
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="text"
          @click="closeDialog"
        >
          Annuler
        </v-btn>
        <v-btn
          color="primary"
          @click="saveCustomer"
          :loading="loading"
          :disabled="!valid"
        >
          Créer et sélectionner
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useCustomerStore } from '@/stores/customer'
import { useSnackbar } from '@/composables/useSnackbar'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'customer-created'])

const customerStore = useCustomerStore()
const { showSnackbar } = useSnackbar()

const dialog = ref(false)
const valid = ref(false)
const loading = ref(false)
const form = ref(null)

const formData = ref({
  name: '',
  phone: '',
  email: '',
  address: ''
})

const resetForm = () => {
  formData.value = {
    name: '',
    phone: '',
    email: '',
    address: ''
  }
  if (form.value) {
    form.value.reset()
  }
}

const closeDialog = () => {
  dialog.value = false
  resetForm()
}

const saveCustomer = async () => {
  if (!form.value.validate()) return

  loading.value = true
  try {
    const newCustomer = await customerStore.addCustomer({
      ...formData.value,
      createdAt: new Date()
    })

    showSnackbar({
      text: 'Client créé avec succès',
      color: 'success'
    })

    emit('customer-created', newCustomer)
    closeDialog()
  } catch (error) {
    console.error('Erreur lors de la création du client:', error)
    showSnackbar({
      text: 'Erreur lors de la création du client',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.float-right {
  position: absolute;
  right: 8px;
  top: 8px;
}
</style>
