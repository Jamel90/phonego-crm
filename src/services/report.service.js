import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { historyService } from './history.service'

class ReportService {
  constructor() {
    this.doc = null
  }

  // Initialise un nouveau document PDF
  initDocument() {
    this.doc = new jsPDF()
    this.doc.setLanguage('fr')
    this.doc.setFont('helvetica')
  }

  // Ajoute le header avec le logo et les informations de l'entreprise
  async addHeader(title) {
    this.doc.setFontSize(20)
    this.doc.text(title, 20, 20)
    
    this.doc.setFontSize(10)
    this.doc.text('Phone GO CRM', 20, 30)
    this.doc.text('Service de réparation de smartphones', 20, 35)
    this.doc.text(new Date().toLocaleDateString('fr-FR'), 20, 40)
    
    this.doc.line(20, 45, 190, 45)
  }

  // Ajoute les informations du client
  addClientInfo(client) {
    this.doc.setFontSize(12)
    this.doc.text('Informations client:', 20, 55)
    
    this.doc.setFontSize(10)
    this.doc.text(`Nom: ${client.lastName} ${client.firstName}`, 30, 65)
    this.doc.text(`Téléphone: ${client.phone}`, 30, 70)
    if (client.email) this.doc.text(`Email: ${client.email}`, 30, 75)
    if (client.address) this.doc.text(`Adresse: ${client.address}`, 30, 80)
  }

  // Ajoute les détails de la réparation
  addRepairDetails(repair) {
    this.doc.setFontSize(12)
    this.doc.text('Détails de la réparation:', 20, 95)
    
    this.doc.setFontSize(10)
    this.doc.text(`Appareil: ${repair.deviceModel}`, 30, 105)
    this.doc.text(`Problème: ${repair.issue}`, 30, 110)
    this.doc.text(`Statut: ${repair.status}`, 30, 115)
    if (repair.solution) this.doc.text(`Solution: ${repair.solution}`, 30, 120)
    this.doc.text(`Prix: ${repair.price}€`, 30, 125)
  }

  // Ajoute l'historique des modifications
  async addHistory(itemId, itemType) {
    const history = await historyService.getHistory(itemId, itemType)
    
    this.doc.setFontSize(12)
    this.doc.text('Historique:', 20, 140)
    
    const tableData = history.map(item => [
      new Date(item.timestamp.toDate()).toLocaleDateString('fr-FR'),
      this.getActionLabel(item.type),
      item.userName,
      typeof item.changes === 'string' ? item.changes : this.formatChanges(item.changes)
    ])

    this.doc.autoTable({
      startY: 145,
      head: [['Date', 'Action', 'Utilisateur', 'Détails']],
      body: tableData,
      margin: { left: 20 },
      headStyles: { fillColor: [66, 66, 66] }
    })
  }

  // Ajoute les photos et documents
  async addDocuments(itemId, itemType) {
    const documents = await historyService.getDocuments(itemId, itemType)
    if (!documents.length) return

    this.doc.addPage()
    this.doc.setFontSize(12)
    this.doc.text('Documents joints:', 20, 20)

    let y = 30
    for (const doc of documents) {
      this.doc.setFontSize(10)
      this.doc.text(`• ${doc.name} (${this.formatFileSize(doc.size)})`, 30, y)
      this.doc.setTextColor(0, 0, 255)
      this.doc.textWithLink('Voir le document', 150, y, { url: doc.url })
      this.doc.setTextColor(0, 0, 0)
      y += 10
    }
  }

  // Génère un rapport de réparation complet
  async generateRepairReport(repair, client) {
    this.initDocument()
    await this.addHeader('Rapport de réparation')
    this.addClientInfo(client)
    this.addRepairDetails(repair)
    await this.addHistory(repair.id, 'repair')
    await this.addDocuments(repair.id, 'repair')
    
    return this.doc.save(`rapport_reparation_${repair.id}.pdf`)
  }

  // Helpers
  getActionLabel(type) {
    const labels = {
      create: 'Création',
      update: 'Modification',
      delete: 'Suppression',
      status_change: 'Changement de statut',
      document_added: 'Ajout de document'
    }
    return labels[type] || type
  }

  formatChanges(changes) {
    if (!changes) return ''
    return Object.entries(changes)
      .map(([key, value]) => `${this.getFieldLabel(key)}: ${value}`)
      .join(', ')
  }

  getFieldLabel(key) {
    const labels = {
      status: 'Statut',
      priority: 'Priorité',
      notes: 'Notes',
      deviceModel: 'Modèle',
      issue: 'Problème',
      solution: 'Solution',
      price: 'Prix'
    }
    return labels[key] || key
  }

  formatFileSize(bytes) {
    const sizes = ['o', 'Ko', 'Mo', 'Go']
    if (bytes === 0) return '0 o'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
    if (i === 0) return `${bytes} ${sizes[i]}`
    return `${(bytes / (1024 ** i)).toFixed(1)} ${sizes[i]}`
  }
}

export const reportService = new ReportService()
