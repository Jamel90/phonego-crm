<template>
  <div>
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-currency-usd" class="mr-2" />
        Configuration Stripe
      </v-card-title>
      <v-card-text>
        <v-alert
          v-if="!stripeConnected"
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          La connexion avec Stripe n'est pas configurée. Veuillez vérifier vos clés API.
        </v-alert>

        <!-- Statut de la connexion -->
        <v-list-item>
          <template v-slot:prepend>
            <v-icon
              :color="stripeConnected ? 'success' : 'error'"
              :icon="stripeConnected ? 'mdi-check-circle' : 'mdi-alert-circle'"
            />
          </template>
          <v-list-item-title>
            {{ stripeConnected ? 'Connecté à Stripe' : 'Non connecté' }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ stripeConnected ? 'Votre compte est correctement configuré' : 'Vérifiez vos paramètres Stripe' }}
          </v-list-item-subtitle>
        </v-list-item>

        <!-- Webhooks -->
        <v-list-item>
          <template v-slot:prepend>
            <v-icon
              :color="webhooksConfigured ? 'success' : 'warning'"
              :icon="webhooksConfigured ? 'mdi-webhook' : 'mdi-webhook-off'"
            />
          </template>
          <v-list-item-title>
            Webhooks Stripe
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ webhooksConfigured ? 'Webhooks configurés et actifs' : 'Webhooks non configurés' }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-sync"
          :loading="syncing"
          @click="syncWithStripe"
        >
          Synchroniser avec Stripe
        </v-btn>
        <v-btn
          color="secondary"
          variant="tonal"
          prepend-icon="mdi-cog"
          @click="showSettings = true"
        >
          Paramètres
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Dialog des paramètres -->
    <v-dialog v-model="showSettings" max-width="600">
      <v-card>
        <v-card-title>Paramètres Stripe</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="settings.webhookUrl"
              label="URL du Webhook"
              :rules="[v => !!v || 'L\'URL du webhook est requise']"
              hint="URL qui recevra les événements Stripe"
              persistent-hint
            />
            <v-text-field
              v-model="settings.successUrl"
              label="URL de succès"
              :rules="[v => !!v || 'L\'URL de succès est requise']"
              hint="Redirection après un paiement réussi"
              persistent-hint
            />
            <v-text-field
              v-model="settings.cancelUrl"
              label="URL d'annulation"
              :rules="[v => !!v || 'L\'URL d\'annulation est requise']"
              hint="Redirection après annulation du paiement"
              persistent-hint
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="error"
            variant="text"
            @click="showSettings = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            :disabled="!valid"
            :loading="saving"
            @click="saveSettings"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useSnackbar } from '@/composables/useSnackbar'
import { stripeService } from '@/services/stripe.service'

// État
const stripeConnected = ref(false)
const webhooksConfigured = ref(false)
const syncing = ref(false)
const showSettings = ref(false)
const valid = ref(true)
const saving = ref(false)
const form = ref(null)
const { showSnackbar } = useSnackbar()

const settings = ref({
  webhookUrl: '',
  successUrl: '',
  cancelUrl: ''
})

// Méthodes
const checkStripeConnection = async () => {
  try {
    const result = await stripeService.checkConnection()
    stripeConnected.value = result.connected
    webhooksConfigured.value = result.webhooksConfigured
  } catch (error) {
    console.error('Erreur lors de la vérification de la connexion Stripe:', error)
    stripeConnected.value = false
    webhooksConfigured.value = false
  }
}

const syncWithStripe = async () => {
  syncing.value = true
  try {
    await stripeService.syncProducts()
    showSnackbar({
      message: 'Synchronisation avec Stripe réussie',
      color: 'success'
    })
  } catch (error) {
    console.error('Erreur lors de la synchronisation avec Stripe:', error)
    showSnackbar({
      message: 'Erreur lors de la synchronisation avec Stripe',
      color: 'error'
    })
  } finally {
    syncing.value = false
  }
}

const loadSettings = async () => {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'stripe'))
    if (settingsDoc.exists()) {
      settings.value = settingsDoc.data()
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error)
  }
}

const saveSettings = async () => {
  if (!form.value.validate()) return

  saving.value = true
  try {
    await setDoc(doc(db, 'settings', 'stripe'), settings.value)
    showSnackbar({
      message: 'Paramètres enregistrés avec succès',
      color: 'success'
    })
    showSettings.value = false
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des paramètres:', error)
    showSnackbar({
      message: 'Erreur lors de l\'enregistrement des paramètres',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

// Initialisation
onMounted(() => {
  checkStripeConnection()
  loadSettings()
})
</script>
