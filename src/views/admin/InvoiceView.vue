<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-4">
          <v-btn icon variant="text" @click="$router.back()" class="mr-4">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <h2 class="text-h5">Détails de la Facture</h2>
        </div>
      </v-col>
    </v-row>

    <v-row v-if="loading">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>

    <template v-else-if="invoice">
      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-card-text>
              <div class="d-flex justify-space-between align-center mb-4">
                <div>
                  <div class="text-h6">Facture {{ invoice.number }}</div>
                  <div class="text-subtitle-1">Date: {{ invoice.date }}</div>
                </div>
                <v-chip :color="getStatusColor(invoice.status)">
                  {{ invoice.status }}
                </v-chip>
              </div>

              <v-divider class="mb-4"></v-divider>

              <div v-if="client" class="mb-4">
                <div class="text-h6 mb-2">Client</div>
                <div>{{ client.name }}</div>
                <div>{{ client.email }}</div>
                <div v-if="client.address">{{ client.address }}</div>
                <div v-if="client.phone">{{ client.phone }}</div>
              </div>

              <v-table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th class="text-right">Quantité</th>
                    <th class="text-right">Prix unitaire</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in invoice.items" :key="index">
                    <td>{{ item.description }}</td>
                    <td class="text-right">{{ item.quantity }}</td>
                    <td class="text-right">{{ formatPrice(item.price) }}</td>
                    <td class="text-right">{{ formatPrice(item.quantity * item.price) }}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="text-right font-weight-bold">Total</td>
                    <td class="text-right font-weight-bold">{{ formatPrice(totalAmount) }}</td>
                  </tr>
                </tfoot>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Actions</v-card-title>
            <v-card-text>
              <v-btn
                block
                color="primary"
                class="mb-2"
                @click="downloadInvoice"
                :loading="downloading"
              >
                <v-icon start>mdi-download</v-icon>
                Télécharger
              </v-btn>
              
              <v-btn
                block
                color="secondary"
                class="mb-2"
                @click="sendInvoice"
                :loading="sending"
                :disabled="invoice.status === 'sent'"
              >
                <v-icon start>mdi-email</v-icon>
                Envoyer par email
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <v-row v-else>
      <v-col cols="12">
        <v-alert type="error">
          Facture non trouvée
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import html2pdf from 'html2pdf.js'

const route = useRoute()
const router = useRouter()

const invoice = ref(null)
const client = ref(null)
const loading = ref(true)
const downloading = ref(false)
const sending = ref(false)

const totalAmount = computed(() => {
  if (!invoice.value?.items) return 0
  return invoice.value.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
})

function getStatusColor(status) {
  const colors = {
    draft: '#6c757d',
    pending: '#ffc107',
    sent: '#17a2b8',
    paid: '#28a745',
    cancelled: '#dc3545'
  }
  return colors[status] || '#6c757d'
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value)
}

async function loadInvoice() {
  try {
    loading.value = true
    const invoiceDoc = await getDoc(doc(db, 'invoices', route.params.id))
    
    if (!invoiceDoc.exists()) {
      invoice.value = null
      return
    }

    invoice.value = { id: invoiceDoc.id, ...invoiceDoc.data() }
    
    // Charger les informations du client
    const clientDoc = await getDoc(doc(db, 'clients', invoice.value.clientId))
    if (clientDoc.exists()) {
      client.value = clientDoc.data()
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la facture:', error)
    alert('Erreur lors du chargement de la facture')
  } finally {
    loading.value = false
  }
}

async function downloadInvoice() {
  try {
    downloading.value = true
    const element = document.createElement('div')
    element.innerHTML = await generateInvoiceHTML()
    
    const options = {
      margin: 1,
      filename: `facture-${invoice.value.number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    }
    
    await html2pdf().set(options).from(element).save()
  } catch (error) {
    console.error('Erreur lors du téléchargement de la facture:', error)
    alert('Erreur lors du téléchargement de la facture')
  } finally {
    downloading.value = false
  }
}

async function sendInvoice() {
  try {
    sending.value = true
    
    // Mettre à jour le statut de la facture
    const invoiceRef = doc(db, 'invoices', invoice.value.id)
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
        invoiceId: invoice.value.id,
        clientId: invoice.value.clientId
      })
    })
    
    if (!response.ok) {
      throw new Error('Erreur lors de l\'envoi de la facture')
    }
    
    // Recharger la facture pour mettre à jour l'affichage
    await loadInvoice()
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la facture:', error)
    alert('Erreur lors de l\'envoi de la facture')
  } finally {
    sending.value = false
  }
}

function generateInvoiceHTML() {
  // Vérifier si le client existe et préparer les données client
  const clientInfo = client.value ? {
    name: client.value.name || 'N/A',
    email: client.value.email || '',
    address: client.value.address || '',
    phone: client.value.phone || ''
  } : {
    name: 'Client non trouvé',
    email: '',
    address: '',
    phone: ''
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const styles = {
    text: 'color: #000000;',
    heading: 'color: #000000; font-weight: bold;',
    lightBg: 'background-color: #f8f9fa;',
    darkBg: 'background-color: #e9ecef;',
    border: 'border: 1px solid #000000;',
    cell: 'padding: 12px 15px; border: 1px solid #000000;'
  }

  return `
    <div style="padding: 40px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background-color: #ffffff;">
      <!-- En-tête -->
      <div style="margin-bottom: 30px; border-bottom: 2px solid #000000; padding-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: top;">
          <div style="flex: 1;">
            <h1 style="${styles.heading} font-size: 28px; margin: 0;">PhoneGo CRM</h1>
            <p style="${styles.text} margin: 5px 0;">Réparation et maintenance de téléphones</p>
          </div>
          <div style="text-align: right;">
            <h2 style="${styles.heading} font-size: 24px; margin: 0;">FACTURE</h2>
            <p style="${styles.text} margin: 5px 0;">N° ${invoice.value.number}</p>
            <p style="${styles.text} margin: 5px 0;">Date: ${invoice.value.date}</p>
          </div>
        </div>
      </div>

      <!-- Informations client et facture -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="flex: 1;">
          <div style="${styles.lightBg} ${styles.border} padding: 20px; border-radius: 5px;">
            <h3 style="${styles.heading} margin: 0 0 10px 0; font-size: 16px;">FACTURER À</h3>
            <p style="${styles.text} margin: 0; line-height: 1.5;">
              <strong>${clientInfo.name}</strong><br>
              ${clientInfo.email ? `${clientInfo.email}<br>` : ''}
              ${clientInfo.address ? `${clientInfo.address}<br>` : ''}
              ${clientInfo.phone ? `${clientInfo.phone}` : ''}
            </p>
          </div>
        </div>
        <div style="flex: 1; margin-left: 40px;">
          <div style="${styles.lightBg} ${styles.border} padding: 20px; border-radius: 5px;">
            <h3 style="${styles.heading} margin: 0 0 10px 0; font-size: 16px;">DÉTAILS</h3>
            <table style="width: 100%;">
              <tr>
                <td style="${styles.text} padding: 5px 0;">Statut:</td>
                <td style="text-align: right;">
                  <span style="
                    background-color: #e9ecef;
                    color: #000000;
                    padding: 3px 8px;
                    border-radius: 3px;
                    font-size: 12px;
                    border: 1px solid #000000;
                  ">${invoice.value.status.toUpperCase()}</span>
                </td>
              </tr>
              <tr>
                <td style="${styles.text} padding: 5px 0;">Date d'émission:</td>
                <td style="${styles.text} text-align: right;">${today}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>

      <!-- Tableau des articles -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 2px solid #000000;">
        <thead>
          <tr style="${styles.darkBg}">
            <th style="${styles.cell} ${styles.heading} text-align: left;">DESCRIPTION</th>
            <th style="${styles.cell} ${styles.heading} text-align: right;">QUANTITÉ</th>
            <th style="${styles.cell} ${styles.heading} text-align: right;">PRIX UNITAIRE</th>
            <th style="${styles.cell} ${styles.heading} text-align: right;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.value.items.map((item, index) => `
            <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
              <td style="${styles.cell} ${styles.text}">${item.description}</td>
              <td style="${styles.cell} ${styles.text} text-align: right;">${item.quantity}</td>
              <td style="${styles.cell} ${styles.text} text-align: right;">${formatPrice(item.price)}</td>
              <td style="${styles.cell} ${styles.text} text-align: right;">${formatPrice(item.quantity * item.price)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="${styles.cell} ${styles.heading} text-align: right;">Total HT</td>
            <td style="${styles.cell} ${styles.heading} text-align: right;">${formatPrice(totalAmount.value)}</td>
          </tr>
          <tr>
            <td colspan="3" style="${styles.cell} ${styles.heading} text-align: right;">TVA (20%)</td>
            <td style="${styles.cell} ${styles.heading} text-align: right;">${formatPrice(totalAmount.value * 0.2)}</td>
          </tr>
          <tr style="${styles.darkBg}">
            <td colspan="3" style="${styles.cell} ${styles.heading} text-align: right; font-size: 16px;">Total TTC</td>
            <td style="${styles.cell} ${styles.heading} text-align: right; font-size: 16px;">${formatPrice(totalAmount.value * 1.2)}</td>
          </tr>
        </tfoot>
      </table>

      <!-- Pied de page -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #000000;">
        <div style="text-align: center;">
          <p style="${styles.heading} margin: 0 0 10px 0;">PhoneGo CRM</p>
          <p style="${styles.text} margin: 0 0 5px 0;">123 Rue de la Réparation, 75000 Paris</p>
          <p style="${styles.text} margin: 0 0 5px 0;">Tél: +33 1 23 45 67 89 | Email: contact@phonegocrm.com</p>
          <p style="${styles.text} margin: 10px 0 0 0; font-size: 12px;">SIRET: 123 456 789 00000 | TVA: FR12 123 456 789</p>
        </div>
      </div>

      <!-- Conditions de paiement -->
      <div style="${styles.lightBg} ${styles.border} margin-top: 30px; padding: 20px; border-radius: 5px; font-size: 14px;">
        <p style="${styles.text} margin: 0;">
          <strong>Conditions de paiement:</strong> Paiement à réception de facture<br>
          <strong>Mode de paiement:</strong> Virement bancaire, carte bancaire ou espèces
        </p>
      </div>
    </div>
  `
}

onMounted(() => {
  loadInvoice()
})
</script>
