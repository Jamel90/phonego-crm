<template>
  <div class="payment-method">
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <span>Mode de paiement</span>
        <v-spacer></v-spacer>
        <v-btn
          v-if="!hasPaymentMethod"
          color="primary"
          prepend-icon="mdi-plus"
          @click="showAddCard = true"
        >
          Ajouter une carte
        </v-btn>
      </v-card-title>

      <v-card-text>
        <div v-if="loading" class="d-flex justify-center">
          <v-progress-circular indeterminate></v-progress-circular>
        </div>

        <div v-else-if="hasPaymentMethod" class="current-card">
          <div class="d-flex align-center">
            <v-icon icon="mdi-credit-card" class="mr-2"></v-icon>
            <span class="text-body-1">•••• •••• •••• {{ cardLast4 }}</span>
            <v-chip
              class="ml-2"
              size="small"
              color="success"
              v-if="isDefault"
            >
              Par défaut
            </v-chip>
            <v-spacer></v-spacer>
            <v-btn
              variant="text"
              color="primary"
              density="comfortable"
              @click="showAddCard = true"
            >
              Changer
            </v-btn>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            Expire {{ cardExpiry }}
          </div>
        </div>

        <div v-else class="text-center py-4">
          <v-icon
            icon="mdi-credit-card-outline"
            size="48"
            class="mb-2 text-medium-emphasis"
          ></v-icon>
          <div class="text-body-1 text-medium-emphasis">
            Aucune carte enregistrée
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Dialog pour ajouter/modifier une carte -->
    <v-dialog v-model="showAddCard" max-width="500">
      <v-card>
        <v-card-title>
          {{ hasPaymentMethod ? 'Modifier la carte' : 'Ajouter une carte' }}
        </v-card-title>
        <v-card-text>
          <div class="stripe-element-container mb-4">
            <!-- Stripe Elements sera monté ici -->
            <div ref="cardElement"></div>
          </div>

          <v-checkbox
            v-model="saveAsDefault"
            label="Définir comme moyen de paiement par défaut"
            hide-details
          ></v-checkbox>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showAddCard = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            :loading="processingCard"
            @click="saveCard"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="4000"
    >
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="showSnackbar = false"
        >
          Fermer
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { loadStripe } from '@stripe/stripe-js'
import { useOrganizationStore } from '@/stores/organization'

const organizationStore = useOrganizationStore()
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

// Refs
const cardElement = ref(null)
const stripe = ref(null)
const card = ref(null)
const loading = ref(true)
const processingCard = ref(false)
const showAddCard = ref(false)
const saveAsDefault = ref(true)
const showSnackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// État de la carte
const hasPaymentMethod = ref(false)
const cardLast4 = ref('')
const cardExpiry = ref('')
const isDefault = ref(false)

// Initialisation de Stripe
onMounted(async () => {
  try {
    stripe.value = await stripePromise

    // Créer l'instance Elements
    const elements = stripe.value.elements()
    
    // Créer l'élément Card
    card.value = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#9e2146',
        },
      },
    })

    // Monter l'élément Card
    card.value.mount(cardElement.value)

    // Charger les informations de carte existantes
    await loadPaymentMethod()
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de Stripe:', error)
    showError('Erreur lors de l\'initialisation du système de paiement')
  }
})

// Nettoyage
onUnmounted(() => {
  if (card.value) {
    card.value.destroy()
  }
})

// Charger la méthode de paiement existante
const loadPaymentMethod = async () => {
  try {
    loading.value = true
    const paymentMethod = await organizationStore.getPaymentMethod()
    
    if (paymentMethod) {
      hasPaymentMethod.value = true
      cardLast4.value = paymentMethod.card.last4
      cardExpiry.value = `${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`
      isDefault.value = paymentMethod.isDefault
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la méthode de paiement:', error)
    showError('Impossible de charger les informations de paiement')
  } finally {
    loading.value = false
  }
}

// Sauvegarder une nouvelle carte
const saveCard = async () => {
  if (!stripe.value || !card.value) return

  try {
    processingCard.value = true
    
    const { token, error } = await stripe.value.createToken(card.value)
    if (error) {
      throw new Error(error.message)
    }

    await organizationStore.updatePaymentMethod({
      token: token.id,
      isDefault: saveAsDefault.value
    })

    showSuccess('Carte enregistrée avec succès')
    showAddCard.value = false
    await loadPaymentMethod()
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la carte:', error)
    showError(error.message || 'Erreur lors de l\'enregistrement de la carte')
  } finally {
    processingCard.value = false
  }
}

// Utilitaires pour les notifications
const showSuccess = (message) => {
  snackbarText.value = message
  snackbarColor.value = 'success'
  showSnackbar.value = true
}

const showError = (message) => {
  snackbarText.value = message
  snackbarColor.value = 'error'
  showSnackbar.value = true
}
</script>

<style scoped>
.stripe-element-container {
  padding: 10px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}

.current-card {
  padding: 12px;
  border-radius: 8px;
  background-color: var(--surface-color);
}
</style>
