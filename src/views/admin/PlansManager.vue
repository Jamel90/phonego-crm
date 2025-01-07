<template>
  <v-container fluid>
    <!-- En-tête -->
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <h1 class="text-h4 font-weight-bold primary-gradient-text mb-1">Gestion des Plans</h1>
            <p class="text-subtitle-1 text-medium-emphasis">Configuration et attribution des abonnements</p>
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="dialog = true"
          >
            Nouveau Plan
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Statistiques -->
    <PlanStatistics :plans="plans" />

    <!-- Intégration Stripe -->
    <StripeIntegration />

    <!-- Gestion des périodes d'essai -->
    <TrialManagement :plans="plans" />

    <!-- Liste des plans -->
    <v-row>
      <v-col 
        v-for="plan in plans" 
        :key="plan.id" 
        cols="12" 
        md="4"
      >
        <v-card class="plan-card">
          <v-card-item>
            <div class="d-flex justify-space-between align-center">
              <div>
                <v-card-title>{{ plan.name }}</v-card-title>
                <v-card-subtitle>{{ formatPrice(plan.price) }}€/mois</v-card-subtitle>
              </div>
              <v-chip
                :color="plan.status === 'active' ? 'success' : 'error'"
                size="small"
              >
                {{ plan.status === 'active' ? 'Actif' : 'Inactif' }}
              </v-chip>
            </div>
          </v-card-item>

          <v-card-text>
            <p class="text-body-1">{{ plan.description }}</p>
            
            <v-list density="compact" class="bg-transparent">
              <v-list-item prepend-icon="mdi-account-multiple">
                <v-list-item-title>{{ plan.maxUsers }} utilisateurs max.</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-store">
                <v-list-item-title>{{ plan.maxStores }} magasins max.</v-list-item-title>
              </v-list-item>
            </v-list>

            <v-divider class="my-2" />

            <div class="d-flex align-center mt-2">
              <v-icon
                :color="plan.stripeProductId ? 'success' : 'warning'"
                :icon="plan.stripeProductId ? 'mdi-check-circle' : 'mdi-alert'"
                class="mr-2"
              />
              <span class="text-caption">
                {{ plan.stripeProductId ? 'Synchronisé avec Stripe' : 'Non synchronisé' }}
              </span>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn
              color="primary"
              variant="text"
              @click="editPlan(plan)"
            >
              Modifier
            </v-btn>
            <v-btn
              color="error"
              variant="text"
              @click="confirmDeletePlan(plan)"
            >
              Supprimer
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog d'édition -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 pa-4">
          {{ editedPlan.id ? 'Modifier le Plan' : 'Nouveau Plan' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="editedPlan.name"
              label="Nom du plan"
              :rules="nameRules"
              required
            />

            <v-textarea
              v-model="editedPlan.description"
              label="Description"
              :rules="descriptionRules"
              required
            />

            <v-text-field
              v-model.number="editedPlan.price"
              label="Prix mensuel (€)"
              type="number"
              :rules="priceRules"
              required
            />

            <v-text-field
              v-model="editedPlan.stripeProductId"
              label="ID du produit Stripe"
              :rules="stripeProductIdRules"
              hint="L'ID du produit dans votre compte Stripe (ex: prod_xxx)"
              persistent-hint
            />

            <v-text-field
              v-model.number="editedPlan.maxUsers"
              label="Nombre maximum d'utilisateurs"
              type="number"
              :rules="maxUsersRules"
              required
            />

            <v-text-field
              v-model.number="editedPlan.maxStores"
              label="Nombre maximum de magasins"
              type="number"
              :rules="maxStoresRules"
              required
            />

            <v-switch
              v-model="editedPlan.trialEnabled"
              label="Activer la période d'essai"
              color="primary"
            />

            <v-text-field
              v-if="editedPlan.trialEnabled"
              v-model.number="editedPlan.trialDays"
              label="Durée de l'essai (jours)"
              type="number"
              :rules="trialDaysRules"
            />
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="error"
            variant="text"
            @click="closeDialog"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            :loading="saving"
            :disabled="!valid"
            @click="savePlan"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmation de suppression -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirmer la suppression</v-card-title>
        <v-card-text>
          Êtes-vous sûr de vouloir supprimer ce plan ? Cette action est irréversible.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="error"
            variant="text"
            @click="deleteDialog = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            :loading="deleting"
            @click="deletePlan"
          >
            Supprimer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { collection, doc, getDocs, updateDoc, addDoc, deleteDoc, query } from 'firebase/firestore'
import { db } from '@/firebase'
import { useSnackbar } from '@/composables/useSnackbar'
import PlanStatistics from './plans/components/PlanStatistics.vue'
import StripeIntegration from './plans/components/StripeIntegration.vue'
import TrialManagement from './plans/components/TrialManagement.vue'

// État
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const valid = ref(true)
const form = ref(null)
const plans = ref([])
const { showSnackbar } = useSnackbar()

// Plan en cours d'édition
const editedPlan = ref({
  name: '',
  description: '',
  price: 0,
  stripeProductId: '',
  maxUsers: 1,
  maxStores: 1,
  trialEnabled: false,
  trialDays: 14,
  status: 'active'
})

// Règles de validation
const nameRules = [
  v => !!v || 'Le nom est requis',
  v => v.length >= 3 || 'Le nom doit contenir au moins 3 caractères'
]

const descriptionRules = [
  v => !!v || 'La description est requise',
  v => v.length >= 10 || 'La description doit contenir au moins 10 caractères'
]

const priceRules = [
  v => !!v || 'Le prix est requis',
  v => v >= 0 || 'Le prix ne peut pas être négatif'
]

const stripeProductIdRules = [
  v => !v || v.startsWith('prod_') || 'L\'ID doit commencer par "prod_"'
]

const maxUsersRules = [
  v => !!v || 'Le nombre maximum d\'utilisateurs est requis',
  v => v >= 1 || 'Le nombre doit être supérieur à 0'
]

const maxStoresRules = [
  v => !!v || 'Le nombre maximum de magasins est requis',
  v => v >= 1 || 'Le nombre doit être supérieur à 0'
]

const trialDaysRules = [
  v => !editedPlan.value.trialEnabled || !!v || 'La durée de l\'essai est requise',
  v => !editedPlan.value.trialEnabled || v >= 1 || 'La durée doit être supérieure à 0'
]

// Méthodes
const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

const editPlan = (plan) => {
  editedPlan.value = { ...plan }
  dialog.value = true
}

const closeDialog = () => {
  dialog.value = false
  editedPlan.value = {
    name: '',
    description: '',
    price: 0,
    stripeProductId: '',
    maxUsers: 1,
    maxStores: 1,
    trialEnabled: false,
    trialDays: 14,
    status: 'active'
  }
  form.value?.resetValidation()
}

const savePlan = async () => {
  if (!form.value.validate()) return

  saving.value = true
  try {
    const planData = {
      name: editedPlan.value.name,
      description: editedPlan.value.description,
      price: Number(editedPlan.value.price),
      stripeProductId: editedPlan.value.stripeProductId,
      maxUsers: Number(editedPlan.value.maxUsers),
      maxStores: Number(editedPlan.value.maxStores),
      trialEnabled: editedPlan.value.trialEnabled,
      trialDays: Number(editedPlan.value.trialDays),
      status: editedPlan.value.status,
      updatedAt: new Date()
    }

    if (editedPlan.value.id) {
      // Mise à jour
      const planRef = doc(db, 'plans', editedPlan.value.id)
      await updateDoc(planRef, planData)
      showSnackbar({
        message: 'Plan mis à jour avec succès',
        color: 'success'
      })
    } else {
      // Création
      planData.createdAt = new Date()
      const plansRef = collection(db, 'plans')
      await addDoc(plansRef, planData)
      showSnackbar({
        message: 'Plan créé avec succès',
        color: 'success'
      })
    }

    closeDialog()
    loadPlans()
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du plan:', error)
    showSnackbar({
      message: 'Erreur lors de l\'enregistrement du plan',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

const confirmDeletePlan = (plan) => {
  editedPlan.value = plan
  deleteDialog.value = true
}

const deletePlan = async () => {
  deleting.value = true
  try {
    const planRef = doc(db, 'plans', editedPlan.value.id)
    await deleteDoc(planRef)
    showSnackbar({
      message: 'Plan supprimé avec succès',
      color: 'success'
    })
    deleteDialog.value = false
    loadPlans()
  } catch (error) {
    console.error('Erreur lors de la suppression du plan:', error)
    showSnackbar({
      message: 'Erreur lors de la suppression du plan',
      color: 'error'
    })
  } finally {
    deleting.value = false
  }
}

const loadPlans = async () => {
  loading.value = true
  try {
    const plansRef = collection(db, 'plans')
    const q = query(plansRef)
    const snapshot = await getDocs(q)
    plans.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Erreur lors du chargement des plans:', error)
    showSnackbar({
      message: 'Erreur lors du chargement des plans',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

// Initialisation
onMounted(() => {
  loadPlans()
})
</script>

<style scoped>
.plan-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.plan-card .v-card-text {
  flex-grow: 1;
}

.primary-gradient-text {
  background: linear-gradient(45deg, var(--v-primary-base), var(--v-secondary-base));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
