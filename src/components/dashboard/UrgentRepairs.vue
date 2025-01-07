<template>
  <v-card>
    <v-card-text>
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6">Réparations urgentes</h3>
        <v-chip
          color="error"
          size="small"
          v-if="urgentRepairs.length > 0"
        >
          {{ urgentRepairs.length }}
        </v-chip>
      </div>

      <v-list v-if="!loading">
        <template v-if="urgentRepairs.length > 0">
          <v-list-item
            v-for="repair in urgentRepairs"
            :key="repair.id"
            :to="{ name: 'Repairs', query: { repairId: repair.id }}"
          >
            <template v-slot:prepend>
              <v-avatar color="error" variant="tonal">
                <v-icon icon="mdi-alert"></v-icon>
              </v-avatar>
            </template>

            <template v-slot:title>
              <div class="d-flex align-center">
                {{ repair.deviceName }}
                <v-tooltip location="right">
                  <template v-slot:activator="{ props }">
                    <v-icon
                      v-bind="props"
                      icon="mdi-information"
                      size="small"
                      class="ml-2"
                    ></v-icon>
                  </template>
                  {{ getUrgentReason(repair) }}
                </v-tooltip>
              </div>
            </template>

            <template v-slot:subtitle>
              {{ repair.clientName }}
            </template>

            <template v-slot:append>
              <v-chip
                :color="getUrgencyColor(repair.priority)"
                size="small"
              >
                {{ formatDaysOverdue(repair.daysOverdue) }}
              </v-chip>
            </template>
          </v-list-item>
        </template>
        <v-list-item v-else>
          <div class="text-center pa-4 text-medium-emphasis">
            Aucune réparation urgente
          </div>
        </v-list-item>
      </v-list>
      <div v-else class="d-flex justify-center pa-4">
        <v-progress-circular indeterminate></v-progress-circular>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'

const loading = ref(true)
const urgentRepairs = ref([])

async function loadUrgentRepairs() {
  const authStore = useAuthStore()
  const storeId = authStore.storeId

  if (!storeId) {
    console.error('Aucun store ID trouvé')
    return
  }

  try {
    loading.value = true
    const repairsRef = collection(db, `stores/${storeId}/repairs`)
    const q = query(
      repairsRef,
      where('status', 'not-in', ['termine', 'annule'])
    )

    const snapshot = await getDocs(q)
    
    // Filtrer les réparations urgentes
    const now = new Date()
    const repairs = snapshot.docs
      .map(doc => {
        const data = doc.data()
        
        try {
          // Calculer les jours de retard
          const createdAt = data.createdAt instanceof Timestamp 
            ? data.createdAt.toDate() 
            : (data.createdAt?.toDate?.() || now)
          
          const daysOverdue = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))
          
          return {
            id: doc.id,
            ...data,
            deviceName: data.device?.name || 'Appareil non spécifié',
            clientName: data.customer?.name || 'Client non spécifié',
            daysOverdue,
            priority: data.priority || 'normal',
            createdAt
          }
        } catch (error) {
          console.error(`Error processing repair ${doc.id}:`, error)
          return null
        }
      })
      .filter(repair => repair && (repair.priority === 'high' || repair.daysOverdue > 7))
      .sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1
        if (a.priority !== 'high' && b.priority === 'high') return 1
        return b.daysOverdue - a.daysOverdue
      })

    urgentRepairs.value = repairs
  } catch (error) {
    console.error('Erreur lors du chargement des réparations urgentes:', error)
  } finally {
    loading.value = false
  }
}

function getUrgentReason(repair) {
  if (repair.priority === 'high') return 'Priorité haute'
  if (repair.daysOverdue > 7) return `En attente depuis ${repair.daysOverdue} jours`
  return 'Réparation urgente'
}

function getUrgencyColor(priority) {
  switch (priority) {
    case 'high':
      return 'error'
    case 'normal':
      return 'warning'
    default:
      return 'info'
  }
}

function formatDaysOverdue(days) {
  return `${days} jour${days > 1 ? 's' : ''}`
}

// Lifecycle hooks
onMounted(() => {
  loadUrgentRepairs()
})
</script>
