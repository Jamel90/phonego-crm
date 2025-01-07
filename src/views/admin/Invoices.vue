<template>
  <div>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <h2 class="text-h5">Gestion des Factures</h2>
          <v-btn-group>
            <v-btn
              prepend-icon="mdi-plus"
              color="primary"
              @click="createInvoice"
            >
              Nouvelle Facture
            </v-btn>
            <v-btn
              prepend-icon="mdi-file-export"
              variant="outlined"
              color="primary"
              @click="exportData"
            >
              Export Comptable
            </v-btn>
          </v-btn-group>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-data-table
            :headers="headers"
            :items="invoices"
            :loading="loading"
            :search="search"
          >
            <template v-slot:top>
              <v-toolbar flat>
                <v-text-field
                  v-model="search"
                  append-inner-icon="mdi-magnify"
                  label="Rechercher"
                  single-line
                  hide-details
                  density="compact"
                  class="search-field"
                  style="max-width: 300px"
                ></v-text-field>
                <v-spacer></v-spacer>
                <v-btn-group>
                  <v-btn
                    prepend-icon="mdi-filter"
                    variant="text"
                    @click="showFilters = !showFilters"
                  >
                    Filtres
                  </v-btn>
                  <v-btn
                    prepend-icon="mdi-refresh"
                    variant="text"
                    @click="loadInvoices"
                  >
                    Actualiser
                  </v-btn>
                </v-btn-group>
              </v-toolbar>

              <v-expand-transition>
                <div v-show="showFilters" class="pa-4">
                  <v-row>
                    <v-col cols="12" sm="4">
                      <v-select
                        v-model="filters.status"
                        :items="statusOptions"
                        label="Statut"
                        clearable
                        density="compact"
                      ></v-select>
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model="filters.dateFrom"
                        label="Date début"
                        type="date"
                        density="compact"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="4">
                      <v-text-field
                        v-model="filters.dateTo"
                        label="Date fin"
                        type="date"
                        density="compact"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </div>
              </v-expand-transition>
            </template>

            <template v-slot:item.amount="{ item }">
              {{ formatPrice(item.amount) }}
            </template>

            <template v-slot:item.status="{ item }">
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-chip
                    :color="getStatusColor(item.status)"
                    size="small"
                    v-bind="props"
                    class="cursor-pointer"
                  >
                    {{ getStatusLabel(item.status) }}
                  </v-chip>
                </template>
                <v-list>
                  <v-list-item
                    v-for="status in statusOptions"
                    :key="status.value"
                    :value="status.value"
                    @click="updateInvoiceStatus(item, status.value)"
                  >
                    <v-list-item-title>{{ status.title }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                icon
                variant="text"
                size="small"
                color="primary"
                @click="viewInvoice(item)"
              >
                <v-icon>mdi-eye</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                color="primary"
                @click="downloadInvoice(item)"
              >
                <v-icon>mdi-download</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                color="primary"
                @click="sendInvoice(item)"
              >
                <v-icon>mdi-email</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title>Résumé Financier</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="success">mdi-cash-multiple</v-icon>
                </template>
                <v-list-item-title>Chiffre d'Affaires</v-list-item-title>
                <v-list-item-subtitle>{{ formatPrice(stats.totalRevenue) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="error">mdi-cash-remove</v-icon>
                </template>
                <v-list-item-title>Impayés</v-list-item-title>
                <v-list-item-subtitle>{{ formatPrice(stats.unpaidAmount) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="warning">mdi-clock</v-icon>
                </template>
                <v-list-item-title>En Attente</v-list-item-title>
                <v-list-item-subtitle>{{ formatPrice(stats.pendingAmount) }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title>Paramètres de Facturation</v-card-title>
          <v-card-text>
            <v-form ref="settingsForm">
              <v-text-field
                v-model="settings.companyName"
                label="Nom de l'entreprise"
                density="compact"
              ></v-text-field>

              <v-text-field
                v-model="settings.vatNumber"
                label="Numéro de TVA"
                density="compact"
              ></v-text-field>

              <v-text-field
                v-model="settings.address"
                label="Adresse"
                density="compact"
              ></v-text-field>

              <v-text-field
                v-model="settings.prefix"
                label="Préfixe des factures"
                density="compact"
              ></v-text-field>

              <v-select
                v-model="settings.paymentDelay"
                :items="paymentDelays"
                label="Délai de paiement"
                density="compact"
              ></v-select>

              <v-btn
                block
                color="primary"
                @click="saveSettings"
                class="mt-4"
              >
                Enregistrer les paramètres
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Création/Modification Facture -->
    <v-dialog v-model="dialog" max-width="800px">
      <v-card>
        <v-card-title>
          {{ editedItem.id ? 'Modifier la Facture' : 'Nouvelle Facture' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-row>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="editedItem.clientId"
                  :items="clientItems"
                  label="Client"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.date"
                  label="Date de facturation"
                  type="date"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>

            <div v-for="(item, index) in editedItem.items" :key="index" class="mb-4">
              <v-row align="center">
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="item.description"
                    label="Description"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" sm="2">
                  <v-text-field
                    v-model.number="item.quantity"
                    label="Quantité"
                    type="number"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="6" sm="2">
                  <v-text-field
                    v-model.number="item.price"
                    label="Prix unitaire"
                    type="number"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="2" class="d-flex align-center">
                  <span class="mr-4">{{ formatPrice(item.quantity * item.price) }}</span>
                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    color="error"
                    @click="removeItem(index)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </div>

            <v-btn
              prepend-icon="mdi-plus"
              variant="text"
              @click="addItem"
              class="mb-4"
            >
              Ajouter une ligne
            </v-btn>

            <v-divider class="mb-4"></v-divider>

            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="editedItem.notes"
                  label="Notes"
                  density="compact"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <div class="text-right">
                  <div class="text-subtitle-2">Total HT: {{ formatPrice(subtotal) }}</div>
                  <div class="text-subtitle-2">TVA (20%): {{ formatPrice(vat) }}</div>
                  <div class="text-h6">Total TTC: {{ formatPrice(total) }}</div>
                </div>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="text"
            @click="dialog = false"
          >
            Annuler
          </v-btn>
          <v-btn
            color="primary"
            @click="saveInvoice"
          >
            Enregistrer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { collection, doc, getDocs, addDoc, updateDoc, query, where, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useRouter } from 'vue-router'
import html2pdf from 'html2pdf.js'

const router = useRouter()

// États
const dialog = ref(false)
const loading = ref(false)
const search = ref('')
const showFilters = ref(false)
const form = ref(null)
const settingsForm = ref(null)

// Données
const invoices = ref([])
const clients = ref([])
const settings = ref({
  companyName: '',
  vatNumber: '',
  address: '',
  prefix: 'FACT-',
  paymentDelay: 30
})

// Filtres
const filters = ref({
  status: null,
  dateFrom: '',
  dateTo: ''
})

// Statistiques
const stats = ref({
  totalRevenue: 0,
  unpaidAmount: 0,
  pendingAmount: 0
})

// Options
const statusOptions = [
  { title: 'Payée', value: 'paid' },
  { title: 'En attente', value: 'pending' },
  { title: 'En retard', value: 'overdue' },
  { title: 'Annulée', value: 'cancelled' }
]

const paymentDelays = [
  { title: 'À réception', value: 0 },
  { title: '15 jours', value: 15 },
  { title: '30 jours', value: 30 },
  { title: '45 jours', value: 45 },
  { title: '60 jours', value: 60 }
]

const headers = [
  { title: 'N° Facture', key: 'number', align: 'start' },
  { title: 'Client', key: 'client' },
  { title: 'Date', key: 'date' },
  { title: 'Montant', key: 'amount', align: 'end' },
  { title: 'Statut', key: 'status', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false }
]

// Item en édition
const defaultItem = {
  clientId: '',
  date: new Date().toISOString().substr(0, 10),
  items: [{ description: '', quantity: 1, price: 0 }],
  notes: '',
  status: 'pending'
}

const editedItem = ref({ ...defaultItem })

// Calculs
const subtotal = computed(() => {
  return editedItem.value.items.reduce((sum, item) => {
    return sum + (item.quantity * item.price)
  }, 0)
})

const vat = computed(() => subtotal.value * 0.20)
const total = computed(() => subtotal.value + vat.value)

// Computed property pour formater les noms des clients
const clientItems = computed(() => {
  return clients.value.map(client => {
    const displayName = client.lastName 
      ? `${client.firstName} ${client.lastName}`
      : client.name || client.email
    return {
      title: displayName,
      value: client.id,
      raw: client
    }
  })
})

// Fonctions utilitaires
function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

function getStatusLabel(status) {
  const statusOption = statusOptions.find(option => option.value === status)
  return statusOption ? statusOption.title : status
}

function getStatusColor(status) {
  const colors = {
    paid: 'success',
    pending: 'warning',
    overdue: 'error',
    cancelled: 'grey'
  }
  return colors[status] || 'grey'
}

const loadSettings = async () => {
  try {
    const settingsRef = doc(db, 'settings', 'invoicing')
    const docSnap = await getDoc(settingsRef)
    if (docSnap.exists()) {
      const data = docSnap.data()
      settings.value = {
        companyName: data.companyName || '',
        vatNumber: data.vatNumber || '',
        address: data.address || '',
        prefix: data.prefix || 'FACT-',
        paymentDelay: data.paymentDelay || 30
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

// Actions CRUD
async function loadInvoices() {
  try {
    loading.value = true
    const invoicesRef = collection(db, 'invoices')
    let q = invoicesRef

    // Appliquer les filtres
    if (filters.value.status) {
      q = query(q, where('status', '==', filters.value.status))
    }
    if (filters.value.dateFrom) {
      q = query(q, where('date', '>=', filters.value.dateFrom))
    }
    if (filters.value.dateTo) {
      q = query(q, where('date', '<=', filters.value.dateTo))
    }

    const snapshot = await getDocs(q)
    invoices.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Calculer les statistiques
    stats.value = {
      totalRevenue: invoices.value.reduce((sum, inv) => sum + (inv.status === 'paid' ? inv.amount : 0), 0),
      unpaidAmount: invoices.value.reduce((sum, inv) => sum + (inv.status === 'overdue' ? inv.amount : 0), 0),
      pendingAmount: invoices.value.reduce((sum, inv) => sum + (inv.status === 'pending' ? inv.amount : 0), 0)
    }
  } catch (error) {
    console.error('Error loading invoices:', error)
  } finally {
    loading.value = false
  }
}

async function loadClients() {
  try {
    const clientsRef = collection(db, 'users')
    const snapshot = await getDocs(clientsRef)
    clients.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error loading clients:', error)
  }
}

function createInvoice() {
  editedItem.value = { ...defaultItem }
  dialog.value = true
}

async function saveInvoice() {
  try {
    const invoiceData = {
      clientId: editedItem.value.clientId,
      date: editedItem.value.date,
      items: editedItem.value.items,
      notes: editedItem.value.notes,
      status: editedItem.value.status,
      amount: total.value,
      number: settings.value.prefix + new Date().getTime(),
      createdAt: new Date()
    }

    if (editedItem.value.id) {
      await updateDoc(doc(db, 'invoices', editedItem.value.id), invoiceData)
    } else {
      await addDoc(collection(db, 'invoices'), invoiceData)
    }

    dialog.value = false
    loadInvoices()
  } catch (error) {
    console.error('Error saving invoice:', error)
  }
}

async function saveSettings() {
  try {
    const settingsRef = doc(db, 'settings', 'invoicing')
    const docSnap = await getDoc(settingsRef)
    
    if (!docSnap.exists()) {
      // Document doesn't exist, create it
      await setDoc(settingsRef, settings.value)
    } else {
      // Document exists, update it
      await updateDoc(settingsRef, settings.value)
    }
  } catch (error) {
    console.error('Error saving settings:', error)
    throw error // Re-throw to handle in the UI if needed
  }
}

// Gestion des items de facture
function addItem() {
  editedItem.value.items.push({ description: '', quantity: 1, price: 0 })
}

function removeItem(index) {
  editedItem.value.items.splice(index, 1)
}

// Actions sur les factures
async function viewInvoice(invoice) {
  router.push({
    name: 'InvoiceView',
    params: { id: invoice.id }
  })
}

async function downloadInvoice(invoice) {
  try {
    // Créer un élément temporaire pour le rendu de la facture
    const element = document.createElement('div')
    element.innerHTML = await generateInvoiceHTML(invoice)
    
    const options = {
      margin: 1,
      filename: `facture-${invoice.number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    }
    
    // Générer le PDF
    html2pdf().set(options).from(element).save()
  } catch (error) {
    console.error('Erreur lors du téléchargement de la facture:', error)
    alert('Erreur lors du téléchargement de la facture')
  }
}

async function sendInvoice(invoice) {
  try {
    // Mettre à jour le statut de la facture
    const invoiceRef = doc(db, 'invoices', invoice.id)
    await updateDoc(invoiceRef, {
      status: 'sent',
      sentDate: new Date().toISOString()
    })
    
    // Envoyer la requête au serveur pour l'envoi d'email
    const response = await fetch('/api/send-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        invoiceId: invoice.id,
        clientId: invoice.clientId
      })
    })
    
    if (!response.ok) {
      throw new Error('Erreur lors de l\'envoi de la facture')
    }
    
    // Recharger les factures pour mettre à jour l'affichage
    await loadInvoices()
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la facture:', error)
    alert('Erreur lors de l\'envoi de la facture')
  }
}

async function generateInvoiceHTML(invoice) {
  // Récupérer les informations du client
  const clientDoc = await getDoc(doc(db, 'clients', invoice.clientId))
  const client = clientDoc.data()
  
  return `
    <div style="padding: 20px;">
      <h1>Facture ${invoice.number}</h1>
      <div style="margin-top: 20px;">
        <strong>Client:</strong><br>
        ${client.name}<br>
        ${client.email}<br>
        ${client.address || ''}
      </div>
      <div style="margin-top: 20px;">
        <strong>Date:</strong> ${invoice.date}
      </div>
      <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px;">Description</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Quantité</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Prix</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${item.description}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${item.quantity}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${formatPrice(item.price)}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${formatPrice(item.quantity * item.price)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>Total</strong></td>
            <td style="border: 1px solid #ddd; padding: 8px;">${formatPrice(invoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `
}

async function exportData() {
  // Implémenter l'export comptable
  console.log('Export accounting data')
}

async function updateInvoiceStatus(invoice, newStatus) {
  try {
    const invoiceRef = doc(db, 'invoices', invoice.id)
    await updateDoc(invoiceRef, {
      status: newStatus,
      updatedAt: new Date()
    })
    
    // Update local state
    const index = invoices.value.findIndex(inv => inv.id === invoice.id)
    if (index !== -1) {
      invoices.value[index] = {
        ...invoices.value[index],
        status: newStatus
      }
    }
    
    // Refresh financial stats
    await loadInvoices()
  } catch (error) {
    console.error('Error updating invoice status:', error)
    // You might want to add error handling UI feedback here
  }
}

onMounted(() => {
  loadInvoices()
  loadClients()
  loadSettings()
})
</script>

<style scoped>
.search-field {
  max-width: 300px;
}
</style>
