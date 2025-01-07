<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="8" offset-md="2">
        <v-card>
          <v-card-title class="text-h5 pa-4">
            Nouvelle réparation
          </v-card-title>

          <v-card-text>
            <v-form ref="form" @submit.prevent="submitRepair">
              <!-- Informations client -->
              <v-row>
                <v-col cols="12">
                  <h3 class="text-h6">Informations client</h3>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-autocomplete
                    v-model="repair.clientId"
                    :items="clients"
                    label="Client"
                    item-title="name"
                    item-value="id"
                    :loading="loadingClients"
                    required
                    :rules="[v => !!v || 'Client requis']"
                  >
                    <template v-slot:append-inner>
                      <v-btn
                        icon="mdi-plus"
                        size="small"
                        variant="text"
                        @click.stop="showNewClientDialog = true"
                      ></v-btn>
                    </template>
                  </v-autocomplete>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="repair.contactPhone"
                    label="Téléphone de contact"
                    type="tel"
                  ></v-text-field>
                </v-col>
              </v-row>

              <!-- Informations appareil -->
              <v-row>
                <v-col cols="12">
                  <h3 class="text-h6">Informations appareil</h3>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="repair.deviceName"
                    label="Nom de l'appareil"
                    required
                    :rules="[v => !!v || 'Nom de l\'appareil requis']"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="repair.deviceModel"
                    label="Modèle"
                    required
                    :rules="[v => !!v || 'Modèle requis']"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="repair.serialNumber"
                    label="Numéro de série"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="repair.deviceCondition"
                    :items="deviceConditions"
                    label="État de l'appareil"
                    required
                    :rules="[v => !!v || 'État requis']"
                  ></v-select>
                </v-col>
              </v-row>

              <!-- Problème et réparation -->
              <v-row>
                <v-col cols="12">
                  <h3 class="text-h6">Problème et réparation</h3>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="repair.paymentType"
                    :items="paymentTypes"
                    label="Type de paiement"
                    required
                    :rules="[v => !!v || 'Type de paiement requis']"
                  ></v-select>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="repair.issue"
                    label="Description du problème"
                    required
                    :rules="[v => !!v || 'Description requise']"
                  ></v-textarea>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="repair.priority"
                    :items="priorities"
                    label="Priorité"
                    required
                  ></v-select>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="repair.estimatedCost"
                    label="Coût estimé"
                    type="number"
                    prefix="€"
                    required
                    :rules="[v => !!v || 'Coût estimé requis']"
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="repair.notes"
                    label="Notes additionnelles"
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>

          <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            <v-btn
              color="error"
              variant="text"
              :to="{ name: 'Repairs' }"
            >
              Annuler
            </v-btn>
            <v-btn
              color="primary"
              @click="submitRepair"
              :loading="loading"
            >
              Créer la réparation
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog nouveau client -->
    <v-dialog v-model="showNewClientDialog" max-width="600px">
      <v-card>
        <v-card-title>Nouveau client</v-card-title>
        <v-card-text>
          <v-form ref="clientForm" @submit.prevent="submitNewClient">
            <v-text-field
              v-model="newClient.name"
              label="Nom complet"
              required
              :rules="[v => !!v || 'Nom requis']"
            ></v-text-field>

            <v-text-field
              v-model="newClient.email"
              label="Email"
              type="email"
            ></v-text-field>

            <v-text-field
              v-model="newClient.phone"
              label="Téléphone"
              type="tel"
              required
              :rules="[v => !!v || 'Téléphone requis']"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="text"
            @click="showNewClientDialog = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            @click="submitNewClient"
            :loading="loadingNewClient"
          >
            Ajouter
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotification } from '@/composables/useNotification'
import { repairService } from '@/services/repair.service'
import { clientService } from '@/services/client.service'

const router = useRouter()
const { showSuccess, showError } = useNotification()

// État
const form = ref(null)
const clientForm = ref(null)
const loading = ref(false)
const loadingClients = ref(false)
const loadingNewClient = ref(false)
const showNewClientDialog = ref(false)
const clients = ref([])

const repair = ref({
  clientId: null,
  contactPhone: '',
  deviceName: '',
  deviceModel: '',
  serialNumber: '',
  deviceCondition: '',
  issue: '',
  priority: 'normal',
  estimatedCost: '',
  notes: '',
  status: 'pending',
  paymentType: ''
})

const newClient = ref({
  name: '',
  email: '',
  phone: ''
})

// Options pour les select
const deviceConditions = [
  { title: 'Excellent', value: 'excellent' },
  { title: 'Bon', value: 'good' },
  { title: 'Moyen', value: 'fair' },
  { title: 'Mauvais', value: 'poor' }
]

const priorities = [
  { title: 'Basse', value: 'low' },
  { title: 'Normale', value: 'normal' },
  { title: 'Haute', value: 'high' },
  { title: 'Urgente', value: 'urgent' }
]

const paymentTypes = [
  { title: 'Espèces', value: 'cash' },
  { title: 'Carte de crédit', value: 'credit_card' },
  { title: 'Virement bancaire', value: 'bank_transfer' }
]

// Méthodes
const loadClients = async () => {
  try {
    loadingClients.value = true
    clients.value = await clientService.getClients()
  } catch (error) {
    console.error('Erreur lors du chargement des clients:', error)
    showError('Erreur lors du chargement des clients')
  } finally {
    loadingClients.value = false
  }
}

const submitRepair = async () => {
  if (!form.value.validate()) return

  try {
    loading.value = true
    await repairService.createRepair(repair.value)
    showSuccess('Réparation créée avec succès')
    router.push({ name: 'Repairs' })
  } catch (error) {
    console.error('Erreur lors de la création de la réparation:', error)
    showError('Erreur lors de la création de la réparation')
  } finally {
    loading.value = false
  }
}

const submitNewClient = async () => {
  if (!clientForm.value.validate()) return

  try {
    loadingNewClient.value = true
    const newClientData = await clientService.createClient(newClient.value)
    clients.value.push(newClientData)
    repair.value.clientId = newClientData.id
    repair.value.contactPhone = newClientData.phone
    showNewClientDialog.value = false
    showSuccess('Client ajouté avec succès')
  } catch (error) {
    console.error('Erreur lors de la création du client:', error)
    showError('Erreur lors de la création du client')
  } finally {
    loadingNewClient.value = false
  }
}

// Charger les données initiales
onMounted(() => {
  loadClients()
})
</script>
