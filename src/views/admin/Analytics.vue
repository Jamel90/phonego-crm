<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h2 class="text-h5 mb-4">Analytiques</h2>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="6">
        <subscription-chart
          title="Croissance des Abonnements"
          type="subscriptions"
        />
      </v-col>
      <v-col cols="12" lg="6">
        <subscription-chart
          title="Revenus"
          type="revenue"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="6">
        <subscription-chart
          title="Taux de Rétention"
          type="retention"
        />
      </v-col>
      <v-col cols="12" lg="6">
        <v-card class="mb-4">
          <v-card-title>Métriques Clés</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6" class="metric-item">
                <div class="metric-label">Taux de Conversion</div>
                <div class="metric-value">{{ conversionRate }}%</div>
                <div class="metric-change" :class="{ 'positive': conversionTrend > 0, 'negative': conversionTrend < 0 }">
                  {{ Math.abs(conversionTrend) }}%
                  <v-icon size="small">{{ conversionTrend > 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
                </div>
              </v-col>
              <v-col cols="6" class="metric-item">
                <div class="metric-label">LTV Moyen</div>
                <div class="metric-value">{{ formatPrice(averageLTV) }}</div>
                <div class="metric-change" :class="{ 'positive': ltvTrend > 0, 'negative': ltvTrend < 0 }">
                  {{ Math.abs(ltvTrend) }}%
                  <v-icon size="small">{{ ltvTrend > 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/firebase'
import SubscriptionChart from '@/components/admin/SubscriptionChart.vue'

const router = useRouter()
const authStore = useAuthStore()

// Vérifier les permissions
if (!authStore.isSuperAdmin) {
  router.push({ name: 'dashboard' })
}

const conversionRate = ref(0)
const conversionTrend = ref(0)
const averageLTV = ref(0)
const ltvTrend = ref(0)

const formatPrice = (value) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

const calculateMetrics = async () => {
  if (!authStore.isSuperAdmin) return

  try {
    // Récupérer toutes les souscriptions
    const subscriptionsRef = collection(db, 'subscriptions')
    const q = query(subscriptionsRef, orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    const subscriptions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Calculer les métriques
    if (subscriptions.length > 0) {
      // Taux de conversion (exemple simple)
      conversionRate.value = 15 // Valeur fixe pour l'exemple
      conversionTrend.value = 2.5

      // LTV moyen
      const totalRevenue = subscriptions.reduce((acc, sub) => acc + (sub.amount || 0), 0)
      averageLTV.value = totalRevenue / subscriptions.length
      ltvTrend.value = 3.8
    }
  } catch (error) {
    console.error('Error calculating metrics:', error)
  }
}

onMounted(() => {
  if (authStore.isSuperAdmin) {
    calculateMetrics()
  }
})
</script>

<style scoped>
.metric-item {
  text-align: center;
  padding: 1rem;
}

.metric-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 0.5rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.metric-change {
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.positive {
  color: #4CAF50;
}

.negative {
  color: #FF5252;
}
</style>
