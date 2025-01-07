`<template>
  <div>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <h2 class="text-h5">Notifications & Alertes</h2>
          <v-btn-group>
            <v-btn
              prepend-icon="mdi-bell-ring"
              color="primary"
              @click="sendTestNotification"
            >
              Tester Notification
            </v-btn>
            <v-btn
              prepend-icon="mdi-cog"
              variant="outlined"
              color="primary"
              @click="showSettings = true"
            >
              Paramètres
            </v-btn>
          </v-btn-group>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-tabs v-model="activeTab">
            <v-tab value="scheduled">Programmées</v-tab>
            <v-tab value="sent">Envoyées</v-tab>
            <v-tab value="templates">Modèles</v-tab>
          </v-tabs>

          <v-window v-model="activeTab">
            <v-window-item value="scheduled">
              <v-table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Destinataire</th>
                    <th>Date Prévue</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="notif in scheduledNotifications" :key="notif.id">
                    <td>
                      <v-icon :color="getTypeColor(notif.type)" size="small" class="mr-2">
                        {{ getTypeIcon(notif.type) }}
                      </v-icon>
                      {{ notif.type }}
                    </td>
                    <td>{{ notif.recipient }}</td>
                    <td>{{ formatDate(notif.scheduledDate) }}</td>
                    <td>
                      <v-chip
                        size="small"
                        :color="notif.status === 'pending' ? 'warning' : 'success'"
                      >
                        {{ notif.status }}
                      </v-chip>
                    </td>
                    <td>
                      <v-btn
                        icon
                        variant="text"
                        size="small"
                        @click="cancelNotification(notif)"
                      >
                        <v-icon>mdi-close</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-window-item>

            <v-window-item value="sent">
              <v-table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Destinataire</th>
                    <th>Date d'envoi</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="notif in sentNotifications" :key="notif.id">
                    <td>
                      <v-icon :color="getTypeColor(notif.type)" size="small" class="mr-2">
                        {{ getTypeIcon(notif.type) }}
                      </v-icon>
                      {{ notif.type }}
                    </td>
                    <td>{{ notif.recipient }}</td>
                    <td>{{ formatDate(notif.sentDate) }}</td>
                    <td>
                      <v-chip
                        size="small"
                        :color="notif.status === 'delivered' ? 'success' : 'error'"
                      >
                        {{ notif.status }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-window-item>

            <v-window-item value="templates">
              <v-list>
                <v-list-item
                  v-for="template in notificationTemplates"
                  :key="template.id"
                  :title="template.name"
                  :subtitle="template.description"
                >
                  <template v-slot:prepend>
                    <v-icon :color="getTypeColor(template.type)">
                      {{ getTypeIcon(template.type) }}
                    </v-icon>
                  </template>
                  <template v-slot:append>
                    <v-btn
                      icon="mdi-pencil"
                      variant="text"
                      size="small"
                      @click="editTemplate(template)"
                    ></v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title>Statistiques d'Envoi</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-email-outline</v-icon>
                </template>
                <v-list-item-title>Total Envoyé</v-list-item-title>
                <v-list-item-subtitle>{{ stats.totalSent }} notifications</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="success">mdi-check-circle</v-icon>
                </template>
                <v-list-item-title>Taux de Livraison</v-list-item-title>
                <v-list-item-subtitle>{{ stats.deliveryRate }}%</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="info">mdi-eye</v-icon>
                </template>
                <v-list-item-title>Taux d'Ouverture</v-list-item-title>
                <v-list-item-subtitle>{{ stats.openRate }}%</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>Alertes Automatiques</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="alert in automaticAlerts"
                :key="alert.id"
              >
                <template v-slot:prepend>
                  <v-switch
                    v-model="alert.active"
                    color="primary"
                    @change="updateAlertStatus(alert)"
                  ></v-switch>
                </template>
                <v-list-item-title>{{ alert.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ alert.description }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Paramètres -->
    <v-dialog v-model="showSettings" max-width="600px">
      <v-card>
        <v-card-title>Paramètres des Notifications</v-card-title>
        <v-card-text>
          <v-form ref="settingsForm">
            <v-switch
              v-model="settings.emailEnabled"
              label="Notifications par Email"
              color="primary"
            ></v-switch>

            <v-switch
              v-model="settings.smsEnabled"
              label="Notifications par SMS"
              color="primary"
            ></v-switch>

            <v-switch
              v-model="settings.pushEnabled"
              label="Notifications Push"
              color="primary"
            ></v-switch>

            <v-text-field
              v-model="settings.emailFrom"
              label="Email d'expédition"
              :disabled="!settings.emailEnabled"
            ></v-text-field>

            <v-text-field
              v-model="settings.smsFrom"
              label="Numéro d'expédition SMS"
              :disabled="!settings.smsEnabled"
            ></v-text-field>

            <v-select
              v-model="settings.defaultLanguage"
              :items="availableLanguages"
              label="Langue par défaut"
            ></v-select>

            <v-slider
              v-model="settings.retryAttempts"
              label="Tentatives de réenvoi"
              min="1"
              max="5"
              step="1"
              thumb-label
            ></v-slider>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="text"
            @click="showSettings = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            @click="saveSettings"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Template -->
    <v-dialog v-model="showTemplateDialog" max-width="800px">
      <v-card>
        <v-card-title>
          {{ editedTemplate.id ? 'Modifier le Modèle' : 'Nouveau Modèle' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="templateForm">
            <v-text-field
              v-model="editedTemplate.name"
              label="Nom du modèle"
              required
            ></v-text-field>

            <v-select
              v-model="editedTemplate.type"
              :items="notificationTypes"
              label="Type de notification"
              required
            ></v-select>

            <v-textarea
              v-model="editedTemplate.description"
              label="Description"
              rows="2"
            ></v-textarea>

            <v-textarea
              v-model="editedTemplate.content"
              label="Contenu"
              rows="5"
              hint="Utilisez {variable} pour les variables dynamiques"
              persistent-hint
            ></v-textarea>

            <v-combobox
              v-model="editedTemplate.variables"
              label="Variables disponibles"
              multiple
              chips
              small-chips
            ></v-combobox>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="text"
            @click="showTemplateDialog = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            @click="saveTemplate"
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
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import { db } from '@/firebase'

const activeTab = ref('scheduled')
const showSettings = ref(false)
const showTemplateDialog = ref(false)
const settingsForm = ref(null)
const templateForm = ref(null)

// Données
const scheduledNotifications = ref([])
const sentNotifications = ref([])
const notificationTemplates = ref([])
const automaticAlerts = ref([])

// Stats
const stats = ref({
  totalSent: 0,
  deliveryRate: 0,
  openRate: 0
})

// Settings
const settings = ref({
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: true,
  emailFrom: 'noreply@phonego.com',
  smsFrom: '',
  defaultLanguage: 'fr',
  retryAttempts: 3
})

const availableLanguages = [
  { title: 'Français', value: 'fr' },
  { title: 'English', value: 'en' }
]

const notificationTypes = [
  { title: 'Email', value: 'email' },
  { title: 'SMS', value: 'sms' },
  { title: 'Push', value: 'push' },
  { title: 'In-App', value: 'in-app' }
]

const defaultTemplate = {
  name: '',
  type: 'email',
  description: '',
  content: '',
  variables: []
}

const editedTemplate = ref({ ...defaultTemplate })

// Fonctions utilitaires
function formatDate(date) {
  return new Date(date).toLocaleString('fr-FR')
}

function getTypeColor(type) {
  const colors = {
    email: 'primary',
    sms: 'success',
    push: 'warning',
    'in-app': 'info'
  }
  return colors[type] || 'grey'
}

function getTypeIcon(type) {
  const icons = {
    email: 'mdi-email',
    sms: 'mdi-message',
    push: 'mdi-bell',
    'in-app': 'mdi-application'
  }
  return icons[type] || 'mdi-help'
}

// Fonctions CRUD
async function loadNotifications() {
  try {
    // Charger les notifications programmées
    const scheduledQuery = query(
      collection(db, 'notifications'),
      where('status', '==', 'pending')
    )
    const scheduledSnapshot = await getDocs(scheduledQuery)
    scheduledNotifications.value = scheduledSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Charger les notifications envoyées
    const sentQuery = query(
      collection(db, 'notifications'),
      where('status', 'in', ['delivered', 'failed'])
    )
    const sentSnapshot = await getDocs(sentQuery)
    sentNotifications.value = sentSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Calculer les stats
    const total = sentNotifications.value.length
    const delivered = sentNotifications.value.filter(n => n.status === 'delivered').length
    const opened = sentNotifications.value.filter(n => n.opened).length

    stats.value = {
      totalSent: total,
      deliveryRate: total ? Math.round((delivered / total) * 100) : 0,
      openRate: delivered ? Math.round((opened / delivered) * 100) : 0
    }
  } catch (error) {
    console.error('Error loading notifications:', error)
  }
}

async function loadTemplates() {
  try {
    const templatesRef = collection(db, 'notification_templates')
    const snapshot = await getDocs(templatesRef)
    notificationTemplates.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading templates:', error)
  }
}

async function loadAutomaticAlerts() {
  try {
    const alertsRef = collection(db, 'automatic_alerts')
    const snapshot = await getDocs(alertsRef)
    automaticAlerts.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading automatic alerts:', error)
  }
}

async function cancelNotification(notification) {
  try {
    await updateDoc(doc(db, 'notifications', notification.id), {
      status: 'cancelled',
      cancelledAt: new Date()
    })
    const index = scheduledNotifications.value.findIndex(n => n.id === notification.id)
    scheduledNotifications.value.splice(index, 1)
  } catch (error) {
    console.error('Error cancelling notification:', error)
  }
}

async function sendTestNotification() {
  try {
    await addDoc(collection(db, 'notifications'), {
      type: 'email',
      recipient: settings.value.emailFrom,
      subject: 'Test de Notification',
      content: 'Ceci est un test de notification depuis le panneau d\'administration.',
      status: 'pending',
      scheduledDate: new Date(),
      createdAt: new Date()
    })
    // Recharger les notifications
    loadNotifications()
  } catch (error) {
    console.error('Error sending test notification:', error)
  }
}

async function updateAlertStatus(alert) {
  try {
    await updateDoc(doc(db, 'automatic_alerts', alert.id), {
      active: alert.active
    })
  } catch (error) {
    console.error('Error updating alert status:', error)
  }
}

async function saveSettings() {
  try {
    const settingsRef = doc(db, 'settings', 'notifications')
    await updateDoc(settingsRef, settings.value)
    showSettings.value = false
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}

function editTemplate(template) {
  editedTemplate.value = { ...template }
  showTemplateDialog.value = true
}

async function saveTemplate() {
  try {
    const templateData = {
      name: editedTemplate.value.name,
      type: editedTemplate.value.type,
      description: editedTemplate.value.description,
      content: editedTemplate.value.content,
      variables: editedTemplate.value.variables,
      updatedAt: new Date()
    }

    if (editedTemplate.value.id) {
      await updateDoc(doc(db, 'notification_templates', editedTemplate.value.id), templateData)
    } else {
      templateData.createdAt = new Date()
      await addDoc(collection(db, 'notification_templates'), templateData)
    }

    showTemplateDialog.value = false
    editedTemplate.value = { ...defaultTemplate }
    loadTemplates()
  } catch (error) {
    console.error('Error saving template:', error)
  }
}

onMounted(() => {
  loadNotifications()
  loadTemplates()
  loadAutomaticAlerts()
})
</script>

<style scoped>
.v-list-item {
  min-height: 64px;
}
</style>`
