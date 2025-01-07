<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-clock-outline" class="mr-2" />
      Gestion des Périodes d'Essai
    </v-card-title>
    <v-card-text>
      <!-- Liste des utilisateurs en période d'essai -->
      <v-data-table
        :headers="headers"
        :items="trialUsers"
        :loading="loading"
        class="elevation-1"
      >
        <!-- Colonne utilisateur -->
        <template v-slot:item.user="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="32" class="mr-2">
              <v-img :src="item.user.photoURL || '/default-avatar.png'" />
            </v-avatar>
            <div>
              <div>{{ item.user.displayName }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.user.email }}</div>
            </div>
          </div>
        </template>

        <!-- Colonne plan -->
        <template v-slot:item.plan="{ item }">
          <v-chip
            :color="getPlanColor(item.plan.name)"
            size="small"
          >
            {{ item.plan.name }}
          </v-chip>
        </template>

        <!-- Colonne temps restant -->
        <template v-slot:item.remainingDays="{ item }">
          <v-chip
            :color="getTimeColor(item.remainingDays)"
            size="small"
          >
            {{ item.remainingDays }} jours
          </v-chip>
        </template>

        <!-- Colonne statut -->
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
          >
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>

        <!-- Colonne actions -->
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-email-outline"
            size="small"
            variant="text"
            class="mr-2"
            @click="sendReminder(item)"
            :loading="item.sending"
          >
            <v-tooltip activator="parent">
              Envoyer un rappel
            </v-tooltip>
          </v-btn>
          <v-btn
            icon="mdi-clock-plus-outline"
            size="small"
            variant="text"
            class="mr-2"
            @click="extendTrial(item)"
            :loading="item.extending"
          >
            <v-tooltip activator="parent">
              Prolonger la période d'essai
            </v-tooltip>
          </v-btn>
          <v-btn
            icon="mdi-convert"
            size="small"
            variant="text"
            @click="convertToPaid(item)"
            :loading="item.converting"
          >
            <v-tooltip activator="parent">
              Convertir en abonnement payant
            </v-tooltip>
          </v-btn>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>

  <!-- Dialog de prolongation -->
  <v-dialog v-model="extendDialog.show" max-width="400">
    <v-card>
      <v-card-title>Prolonger la période d'essai</v-card-title>
      <v-card-text>
        <v-form ref="extendForm" v-model="extendDialog.valid">
          <v-text-field
            v-model="extendDialog.days"
            label="Nombre de jours"
            type="number"
            :rules="[
              v => !!v || 'Le nombre de jours est requis',
              v => v > 0 || 'Le nombre de jours doit être positif'
            ]"
          />
          <v-textarea
            v-model="extendDialog.reason"
            label="Raison de la prolongation"
            :rules="[v => !!v || 'La raison est requise']"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="error"
          variant="text"
          @click="extendDialog.show = false"
        >
          Annuler
        </v-btn>
        <v-btn
          color="primary"
          variant="text"
          :disabled="!extendDialog.valid"
          :loading="extendDialog.processing"
          @click="confirmExtendTrial"
        >
          Prolonger
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog de conversion -->
  <v-dialog v-model="convertDialog.show" max-width="500">
    <v-card>
      <v-card-title>Convertir en abonnement payant</v-card-title>
      <v-card-text>
        <v-form ref="convertForm" v-model="convertDialog.valid">
          <v-select
            v-model="convertDialog.planId"
            :items="availablePlans"
            label="Plan d'abonnement"
            item-title="name"
            item-value="id"
            :rules="[v => !!v || 'Le plan est requis']"
          />
          <v-checkbox
            v-model="convertDialog.sendEmail"
            label="Envoyer un email de confirmation"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="error"
          variant="text"
          @click="convertDialog.show = false"
        >
          Annuler
        </v-btn>
        <v-btn
          color="primary"
          variant="text"
          :disabled="!convertDialog.valid"
          :loading="convertDialog.processing"
          @click="confirmConversion"
        >
          Convertir
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useSnackbar } from '@/composables/useSnackbar'
import { emailService } from '@/services/email.service'

// Props
const props = defineProps({
  plans: {
    type: Array,
    required: true
  }
})

// État
const loading = ref(false)
const trialUsers = ref([])
const { showSnackbar } = useSnackbar()

// En-têtes du tableau
const headers = [
  { title: 'Utilisateur', key: 'user', sortable: false },
  { title: 'Plan', key: 'plan', sortable: true },
  { title: 'Temps restant', key: 'remainingDays', sortable: true },
  { title: 'Statut', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Dialog de prolongation
const extendDialog = ref({
  show: false,
  valid: true,
  days: 7,
  reason: '',
  processing: false,
  selectedUser: null
})

// Dialog de conversion
const convertDialog = ref({
  show: false,
  valid: true,
  planId: null,
  sendEmail: true,
  processing: false,
  selectedUser: null
})

// Computed
const availablePlans = computed(() => 
  props.plans.filter(plan => plan.price > 0)
)

// Méthodes
const loadTrialUsers = async () => {
  loading.value = true
  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('trialEndsAt', '>', new Date()))
    const snapshot = await getDocs(q)
    
    trialUsers.value = await Promise.all(snapshot.docs.map(async doc => {
      const userData = doc.data()
      const plan = props.plans.find(p => p.id === userData.planId)
      const remainingDays = Math.ceil((userData.trialEndsAt.toDate() - new Date()) / (1000 * 60 * 60 * 24))
      
      return {
        id: doc.id,
        user: {
          displayName: userData.displayName,
          email: userData.email,
          photoURL: userData.photoURL
        },
        plan: plan || { name: 'Plan inconnu' },
        remainingDays,
        status: getTrialStatus(remainingDays),
        sending: false,
        extending: false,
        converting: false
      }
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs en période d\'essai:', error)
    showSnackbar({
      message: 'Erreur lors du chargement des utilisateurs',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const getTrialStatus = (days) => {
  if (days <= 0) return 'expired'
  if (days <= 3) return 'critical'
  if (days <= 7) return 'warning'
  return 'active'
}

const getStatusText = (status) => {
  const texts = {
    expired: 'Expiré',
    critical: 'Critique',
    warning: 'Attention',
    active: 'Actif'
  }
  return texts[status] || status
}

const getStatusColor = (status) => {
  const colors = {
    expired: 'error',
    critical: 'error',
    warning: 'warning',
    active: 'success'
  }
  return colors[status] || 'grey'
}

const getTimeColor = (days) => {
  if (days <= 0) return 'error'
  if (days <= 3) return 'error'
  if (days <= 7) return 'warning'
  return 'success'
}

const getPlanColor = (planName) => {
  // Vous pouvez personnaliser les couleurs en fonction des noms de plans
  return 'primary'
}

const sendReminder = async (user) => {
  user.sending = true
  try {
    await emailService.sendEmail({
      to: user.user.email,
      template: 'trial-reminder',
      data: {
        name: user.user.displayName,
        daysLeft: user.remainingDays,
        planName: user.plan.name
      }
    })
    showSnackbar({
      message: 'Rappel envoyé avec succès',
      color: 'success'
    })
  } catch (error) {
    console.error('Erreur lors de l\'envoi du rappel:', error)
    showSnackbar({
      message: 'Erreur lors de l\'envoi du rappel',
      color: 'error'
    })
  } finally {
    user.sending = false
  }
}

const extendTrial = (user) => {
  extendDialog.value.selectedUser = user
  extendDialog.value.show = true
}

const confirmExtendTrial = async () => {
  if (!extendDialog.value.valid) return

  const user = extendDialog.value.selectedUser
  user.extending = true
  extendDialog.value.processing = true

  try {
    const userRef = doc(db, 'users', user.id)
    const currentTrialEnd = user.trialEndsAt?.toDate() || new Date()
    const newTrialEnd = new Date(currentTrialEnd.getTime() + (extendDialog.value.days * 24 * 60 * 60 * 1000))
    
    await updateDoc(userRef, {
      trialEndsAt: newTrialEnd,
      trialExtensionReason: extendDialog.value.reason,
      trialExtendedAt: new Date()
    })

    showSnackbar({
      message: 'Période d\'essai prolongée avec succès',
      color: 'success'
    })

    // Recharger les données
    await loadTrialUsers()
  } catch (error) {
    console.error('Erreur lors de la prolongation de la période d\'essai:', error)
    showSnackbar({
      message: 'Erreur lors de la prolongation de la période d\'essai',
      color: 'error'
    })
  } finally {
    user.extending = false
    extendDialog.value.processing = false
    extendDialog.value.show = false
  }
}

const convertToPaid = (user) => {
  convertDialog.value.selectedUser = user
  convertDialog.value.planId = user.plan.id
  convertDialog.value.show = true
}

const confirmConversion = async () => {
  if (!convertDialog.value.valid) return

  const user = convertDialog.value.selectedUser
  user.converting = true
  convertDialog.value.processing = true

  try {
    const userRef = doc(db, 'users', user.id)
    await updateDoc(userRef, {
      planId: convertDialog.value.planId,
      trialEndsAt: null,
      subscriptionStatus: 'active',
      convertedAt: new Date()
    })

    if (convertDialog.value.sendEmail) {
      await emailService.sendEmail({
        to: user.user.email,
        template: 'trial-conversion',
        data: {
          name: user.user.displayName,
          planName: props.plans.find(p => p.id === convertDialog.value.planId)?.name
        }
      })
    }

    showSnackbar({
      message: 'Conversion en abonnement payant réussie',
      color: 'success'
    })

    // Recharger les données
    await loadTrialUsers()
  } catch (error) {
    console.error('Erreur lors de la conversion en abonnement payant:', error)
    showSnackbar({
      message: 'Erreur lors de la conversion en abonnement payant',
      color: 'error'
    })
  } finally {
    user.converting = false
    convertDialog.value.processing = false
    convertDialog.value.show = false
  }
}

// Initialisation
onMounted(() => {
  loadTrialUsers()
})
</script>

<style scoped>
.v-data-table {
  width: 100%;
}
</style>
