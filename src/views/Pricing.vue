<template>
  <div class="pricing-page">
    <v-container>
      <div class="text-center mb-12">
        <h1 class="text-h3 font-weight-bold mb-4">
          Choisissez votre plan
        </h1>
        <p class="text-h6 text-medium-emphasis">
          Des tarifs adaptés à vos besoins, sans engagement
        </p>
      </div>

      <v-row justify="center" class="pricing-cards">
        <v-col
          v-for="(plan, key) in SUBSCRIPTION_PLANS"
          :key="key"
          cols="12"
          sm="6"
          md="4"
          lg="4"
          class="d-flex"
        >
          <v-card class="pricing-card flex-grow-1" elevation="2">
            <v-card-text class="pa-8">
              <div class="text-center mb-6">
                <h2 class="text-h4 font-weight-bold mb-2">{{ plan.name }}</h2>
                <div class="pricing-amount">
                  <span class="text-h3 font-weight-bold">{{ plan.price }}€</span>
                  <span class="text-subtitle-1 text-medium-emphasis">/{{ plan.interval }}</span>
                </div>
              </div>

              <v-divider class="mb-6"></v-divider>

              <div class="features mb-6">
                <div
                  v-for="(feature, index) in plan.features"
                  :key="index"
                  class="feature-item d-flex align-center mb-4"
                >
                  <v-icon
                    icon="mdi-check-circle"
                    color="success"
                    class="mr-3"
                  ></v-icon>
                  <span class="text-body-1">{{ feature }}</span>
                </div>
              </div>

              <v-btn
                block
                color="primary"
                size="large"
                :loading="loading === plan.priceId"
                @click="handleSubscribe(plan.priceId)"
                class="mt-4"
              >
                {{ currentPlan?.priceId === plan.priceId ? 'Plan actuel' : 'Choisir ce plan' }}
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-dialog v-model="showLoginDialog" max-width="400">
        <v-card>
          <v-card-text class="pa-6">
            <p class="text-body-1 mb-4">
              Vous devez être connecté pour souscrire à un abonnement.
            </p>
            <v-btn
              block
              color="primary"
              :to="{ name: 'Login', query: { redirect: '/pricing' } }"
            >
              Se connecter
            </v-btn>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { SUBSCRIPTION_PLANS } from '@/constants/plans'
import { subscriptionService } from '@/services/subscription.service'
import { useAuth } from '@/composables/useAuth'
import { useSnackbar } from '@/composables/useSnackbar'
import { loadStripe } from '@stripe/stripe-js'

const { isAuthenticated, user } = useAuth()
const { showSnackbar } = useSnackbar()

const loading = ref(null)
const showLoginDialog = ref(false)
const currentPlan = ref(null)
let unsubscribe = null

onMounted(() => {
  if (isAuthenticated.value) {
    unsubscribe = subscriptionService.watchSubscription((subscription) => {
      currentPlan.value = subscriptionService.getCurrentPlan(subscription)
    })
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

const handleSubscribe = async (priceId) => {
  if (!isAuthenticated.value) {
    showLoginDialog.value = true
    return
  }

  if (currentPlan.value?.priceId === priceId) {
    showSnackbar({
      text: 'Vous êtes déjà abonné à ce plan',
      color: 'info'
    })
    return
  }

  try {
    loading.value = priceId
    const sessionId = await subscriptionService.startSubscription(priceId)
    const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
    await stripe.redirectToCheckout({ sessionId })
  } catch (error) {
    console.error('Erreur lors de la souscription:', error)
    showSnackbar({
      text: 'Une erreur est survenue lors de la souscription',
      color: 'error'
    })
  } finally {
    loading.value = null
  }
}
</script>

<style scoped>
.pricing-page {
  padding: 4rem 0;
  background: linear-gradient(180deg, rgba(var(--v-theme-primary), 0.05) 0%, rgba(var(--v-theme-primary), 0) 100%);
}

.pricing-cards {
  gap: 2rem;
}

.pricing-card {
  border-radius: 16px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;
}

.pricing-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15) !important;
}

.pricing-amount {
  margin: 1.5rem 0;
}

.feature-item {
  opacity: 0;
  animation: fadeIn 0.5s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-item:nth-child(1) { animation-delay: 0.1s; }
.feature-item:nth-child(2) { animation-delay: 0.2s; }
.feature-item:nth-child(3) { animation-delay: 0.3s; }
.feature-item:nth-child(4) { animation-delay: 0.4s; }
.feature-item:nth-child(5) { animation-delay: 0.5s; }
.feature-item:nth-child(6) { animation-delay: 0.6s; }
</style>
