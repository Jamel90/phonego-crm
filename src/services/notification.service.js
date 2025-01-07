import { db } from '../firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

class NotificationService {
  constructor() {
    this.collection = collection(db, 'notifications')
  }

  async sendRepairStatusUpdate(repair, customer) {
    const notification = {
      type: 'repair_status',
      repairId: repair.id,
      customerId: customer.id,
      status: repair.status,
      message: this.getStatusMessage(repair),
      createdAt: serverTimestamp(),
      sent: false,
      email: customer.email,
      phone: customer.phone
    }

    await addDoc(this.collection, notification)
  }

  async sendRepairReadyNotification(repair, customer) {
    const notification = {
      type: 'repair_ready',
      repairId: repair.id,
      customerId: customer.id,
      message: `Votre ${repair.deviceModel} est prêt ! Montant restant à payer: ${repair.price - repair.deposit}€`,
      createdAt: serverTimestamp(),
      sent: false,
      email: customer.email,
      phone: customer.phone
    }

    await addDoc(this.collection, notification)
  }

  getStatusMessage(repair) {
    const messages = {
      new: `Votre demande de réparation pour ${repair.deviceModel} a été enregistrée`,
      in_progress: `La réparation de votre ${repair.deviceModel} a commencé`,
      waiting_parts: `Nous attendons des pièces pour votre ${repair.deviceModel}`,
      completed: `La réparation de votre ${repair.deviceModel} est terminée`,
      cancelled: `La réparation de votre ${repair.deviceModel} a été annulée`
    }

    return messages[repair.status] || `Le statut de votre réparation a été mis à jour`
  }
}

export const notificationService = new NotificationService()
