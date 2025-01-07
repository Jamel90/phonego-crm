<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="8" offset-md="2">
        <v-card>
          <v-card-title class="text-h5 pa-4">
            Nouveau client
          </v-card-title>

          <v-card-text>
            <v-form ref="form" @submit.prevent="submitClient">
              <!-- Informations personnelles -->
              <v-row>
                <v-col cols="12">
                  <h3 class="text-h6">Informations personnelles</h3>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="client.name"
                    label="Nom complet"
                    required
                    :rules="[v => !!v || 'Nom requis']"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="client.email"
                    label="Email"
                    type="email"
                    :rules="[
                      v => !v || /.+@.+\..+/.test(v) || 'Email invalide'
                    ]"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="client.phone"
                    label="Téléphone"
                    type="tel"
                    required
                    :rules="[v => !!v || 'Téléphone requis']"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="client.source"
                    :items="sources"
                    label="Source"
                  ></v-select>
                </v-col>
              </v-row>

              <!-- Adresse -->
              <v-row>
                <v-col cols="12">
                  <h3 class="text-h6">Adresse</h3>
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="client.address.street"
                    label="Rue"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="client.address.city"
                    label="Ville"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="client.address.postalCode"
                    label="Code postal"
                  ></v-text-field>
                </v-col>
              </v-row>

              <!-- Notes -->
              <v-row>
                <v-col cols="12">
                  <h3 class="text-h6">Notes</h3>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="client.notes"
                    label="Notes additionnelles"
                    rows="3"
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
              :to="{ name: 'Clients' }"
            >
              Annuler
            </v-btn>
            <v-btn
              color="primary"
              @click="submitClient"
              :loading="loading"
            >
              Créer le client
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotification } from '@/composables/useNotification'
import { clientService } from '@/services/client.service'

const router = useRouter()
const { showSuccess, showError } = useNotification()

// État
const form = ref(null)
const loading = ref(false)

const client = ref({
  name: '',
  email: '',
  phone: '',
  source: '',
  address: {
    street: '',
    city: '',
    postalCode: ''
  },
  notes: ''
})

// Options pour les select
const sources = [
  { title: 'Recommandation', value: 'referral' },
  { title: 'Recherche Google', value: 'google' },
  { title: 'Réseaux sociaux', value: 'social' },
  { title: 'Publicité', value: 'advertising' },
  { title: 'Autre', value: 'other' }
]

// Méthodes
const submitClient = async () => {
  if (!form.value.validate()) return

  try {
    loading.value = true
    await clientService.createClient(client.value)
    showSuccess('Client créé avec succès')
    router.push({ name: 'Clients' })
  } catch (error) {
    console.error('Erreur lors de la création du client:', error)
    showError('Erreur lors de la création du client')
  } finally {
    loading.value = false
  }
}
</script>
