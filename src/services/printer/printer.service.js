import { db } from '@/firebase'
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

class PrinterService {
  constructor() {
    this.authStore = useAuthStore()
  }

  /**
   * Récupère la configuration de l'imprimante par défaut pour la boutique
   */
  async getDefaultPrinter() {
    try {
      const storeId = this.authStore.storeId
      if (!storeId) throw new Error('Aucune boutique sélectionnée')

      const printersRef = collection(db, 'stores', storeId, 'printers')
      const q = query(printersRef, where('isDefault', '==', true))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        return null
      }

      const printerDoc = snapshot.docs[0]
      return {
        id: printerDoc.id,
        ...printerDoc.data()
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'imprimante par défaut:', error)
      throw error
    }
  }

  /**
   * Récupère toutes les imprimantes de la boutique
   */
  async getPrinters() {
    try {
      const storeId = this.authStore.storeId
      if (!storeId) throw new Error('Aucune boutique sélectionnée')

      const printersRef = collection(db, 'stores', storeId, 'printers')
      const snapshot = await getDocs(printersRef)

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Erreur lors de la récupération des imprimantes:', error)
      throw error
    }
  }

  /**
   * Ajoute une nouvelle imprimante
   */
  async addPrinter(printerData) {
    try {
      const storeId = this.authStore.storeId
      if (!storeId) throw new Error('Aucune boutique sélectionnée')

      const printersRef = collection(db, 'stores', storeId, 'printers')
      const docRef = await addDoc(printersRef, {
        ...printerData,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      return {
        id: docRef.id,
        ...printerData
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'imprimante:', error)
      throw error
    }
  }

  /**
   * Met à jour une imprimante existante
   */
  async updatePrinter(printerId, printerData) {
    try {
      const storeId = this.authStore.storeId
      if (!storeId) throw new Error('Aucune boutique sélectionnée')

      const printerRef = doc(db, 'stores', storeId, 'printers', printerId)
      await updateDoc(printerRef, {
        ...printerData,
        updatedAt: new Date()
      })

      return {
        id: printerId,
        ...printerData
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'imprimante:', error)
      throw error
    }
  }

  /**
   * Supprime une imprimante
   */
  async deletePrinter(printerId) {
    try {
      const storeId = this.authStore.storeId
      if (!storeId) throw new Error('Aucune boutique sélectionnée')

      const printerRef = doc(db, 'stores', storeId, 'printers', printerId)
      await deleteDoc(printerRef)
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'imprimante:', error)
      throw error
    }
  }

  /**
   * Définit une imprimante comme imprimante par défaut
   */
  async setDefaultPrinter(printerId) {
    try {
      const storeId = this.authStore.storeId
      if (!storeId) throw new Error('Aucune boutique sélectionnée')

      // Récupérer toutes les imprimantes
      const printersRef = collection(db, 'stores', storeId, 'printers')
      const snapshot = await getDocs(printersRef)

      // Mettre à jour toutes les imprimantes
      const batch = db.batch()
      snapshot.docs.forEach(doc => {
        const printerRef = doc(db, 'stores', storeId, 'printers', doc.id)
        batch.update(printerRef, {
          isDefault: doc.id === printerId
        })
      })

      await batch.commit()
    } catch (error) {
      console.error('Erreur lors de la définition de l\'imprimante par défaut:', error)
      throw error
    }
  }

  /**
   * Imprime un ticket
   */
  async printTicket(data, printer = null) {
    try {
      if (!printer) {
        printer = await this.getDefaultPrinter()
      }

      if (!printer) {
        throw new Error('Aucune imprimante configurée')
      }

      // TODO: Implémenter la logique d'impression réelle ici
      console.log('Impression du ticket sur', printer.name, 'avec les données:', data)

      // Simuler un délai d'impression
      await new Promise(resolve => setTimeout(resolve, 1000))

      return {
        success: true,
        message: `Ticket imprimé sur ${printer.name}`
      }
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error)
      throw error
    }
  }
}

export const printerService = new PrinterService()
