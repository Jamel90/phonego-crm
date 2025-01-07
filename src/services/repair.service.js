import { db } from '@/firebase'
import { 
  collection, 
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'
import { useInventoryStore } from '@/stores/inventory'

class RepairService {
  getStoreCollection() {
    const authStore = useAuthStore()
    if (!authStore.storeId) {
      throw new Error('Aucun store ID trouvé')
    }
    return collection(db, `stores/${authStore.storeId}/repairs`)
  }

  async getRepairs(options = {}) {
    try {
      const repairsRef = this.getStoreCollection()
      let q = query(repairsRef)

      // Appliquer les filtres
      if (options.status) {
        q = query(q, where('status', '==', options.status))
      }
      if (options.manufacturerId) {
        q = query(q, where('manufacturerId', '==', options.manufacturerId))
      }
      if (options.customerId) {
        q = query(q, where('customerId', '==', options.customerId))
      }

      // Appliquer le tri
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy, options.orderDirection || 'desc'))
      } else {
        q = query(q, orderBy('createdAt', 'desc'))
      }

      // Appliquer la pagination
      if (options.lastVisible) {
        q = query(q, startAfter(options.lastVisible))
      }
      if (options.limit) {
        q = query(q, limit(options.limit))
      }

      const snapshot = await getDocs(q)
      const repairs = []

      for (const docSnapshot of snapshot.docs) {
        const repairData = docSnapshot.data()
        let customerData = null
        let manufacturerData = null

        // Convertir les timestamps en dates
        const createdAt = repairData.createdAt ? 
          (repairData.createdAt instanceof Timestamp ? repairData.createdAt.toDate() : new Date(repairData.createdAt)) 
          : new Date()
        
        const updatedAt = repairData.updatedAt ? 
          (repairData.updatedAt instanceof Timestamp ? repairData.updatedAt.toDate() : new Date(repairData.updatedAt))
          : createdAt

        // Garder le type de paiement original
        const originalPaymentType = repairData.paymentType

        // Récupérer les données du client
        if (repairData.customerId) {
          try {
            const customerRef = doc(db, `stores/${useAuthStore().storeId}/customers/${repairData.customerId}`)
            const customerDoc = await getDoc(customerRef)
            if (customerDoc.exists()) {
              customerData = {
                id: customerDoc.id,
                ...customerDoc.data()
              }
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération du client ${repairData.customerId}:`, error)
          }
        }

        // Récupérer les données du fabricant et mettre à jour les problèmes
        if (repairData.manufacturerId) {
          try {
            const manufacturerRef = doc(db, `stores/${useAuthStore().storeId}/manufacturers/${repairData.manufacturerId}`)
            const manufacturerDoc = await getDoc(manufacturerRef)
            if (manufacturerDoc.exists()) {
              manufacturerData = {
                id: manufacturerDoc.id,
                ...manufacturerDoc.data()
              }
              
              // Mettre à jour les problèmes avec les informations complètes du fabricant
              if (Array.isArray(repairData.issues) && manufacturerData.issues) {
                repairData.issues = repairData.issues.map(issue => {
                  const fullIssue = manufacturerData.issues.find(i => i.name === issue.name)
                  return {
                    ...issue,
                    estimatedPrice: fullIssue?.estimatedPrice || 0,
                    estimatedWorkTime: fullIssue?.estimatedWorkTime || 0
                  }
                })
              }
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération du fabricant ${repairData.manufacturerId}:`, error)
          }
        }

        // Ajouter la réparation avec toutes les données normalisées
        repairs.push({
          id: docSnapshot.id,
          ...repairData,
          createdAt,
          updatedAt,
          paymentType: originalPaymentType,
          customer: customerData,
          manufacturer: manufacturerData,
          // S'assurer que le prix est un nombre
          price: parseFloat(repairData.price) || 0,
          // S'assurer que le statut est défini
          status: repairData.status || 'en_attente',
          estimatedCompletionDate: repairData.estimatedCompletionDate instanceof Timestamp ? repairData.estimatedCompletionDate.toDate() : null
        })
      }

      return {
        repairs,
        lastVisible: snapshot.docs[snapshot.docs.length - 1]
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des réparations:', error)
      throw error
    }
  }

  async getRepairById(id) {
    try {
      const repairRef = doc(this.getStoreCollection(), id)
      const repairDoc = await getDoc(repairRef)
      
      if (!repairDoc.exists()) {
        throw new Error('Réparation non trouvée')
      }

      const repairData = repairDoc.data()
      let customerData = null
      let manufacturerData = null

      // Convertir les timestamps en dates
      const createdAt = repairData.createdAt ? 
        (repairData.createdAt instanceof Timestamp ? repairData.createdAt.toDate() : new Date(repairData.createdAt)) 
        : new Date()
      
      const updatedAt = repairData.updatedAt ? 
        (repairData.updatedAt instanceof Timestamp ? repairData.updatedAt.toDate() : new Date(repairData.updatedAt))
        : createdAt

      // Garder le type de paiement original
      const originalPaymentType = repairData.paymentType

      // Récupérer les données du client
      if (repairData.customerId) {
        try {
          const customerRef = doc(db, `stores/${useAuthStore().storeId}/customers/${repairData.customerId}`)
          const customerDoc = await getDoc(customerRef)
          if (customerDoc.exists()) {
            customerData = {
              id: customerDoc.id,
              ...customerDoc.data()
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération du client ${repairData.customerId}:`, error)
        }
      }

      // Récupérer les données du fabricant et mettre à jour les problèmes
      if (repairData.manufacturerId) {
        try {
          const manufacturerRef = doc(db, `stores/${useAuthStore().storeId}/manufacturers/${repairData.manufacturerId}`)
          const manufacturerDoc = await getDoc(manufacturerRef)
          if (manufacturerDoc.exists()) {
            manufacturerData = {
              id: manufacturerDoc.id,
              ...manufacturerDoc.data()
            }
            
            // Mettre à jour les problèmes avec les informations complètes du fabricant
            if (Array.isArray(repairData.issues) && manufacturerData.issues) {
              repairData.issues = repairData.issues.map(issue => {
                const fullIssue = manufacturerData.issues.find(i => i.name === issue.name)
                return {
                  ...issue,
                  estimatedPrice: fullIssue?.estimatedPrice || 0,
                  estimatedWorkTime: fullIssue?.estimatedWorkTime || 0
                }
              })
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération du fabricant ${repairData.manufacturerId}:`, error)
        }
      }

      // Ajouter la réparation avec toutes les données normalisées
      return {
        id: repairDoc.id,
        ...repairData,
        createdAt,
        updatedAt,
        paymentType: originalPaymentType,
        customer: customerData,
        manufacturer: manufacturerData,
        // S'assurer que le prix est un nombre
        price: parseFloat(repairData.price) || 0,
        // S'assurer que le statut est défini
        status: repairData.status || 'en_attente',
        estimatedCompletionDate: repairData.estimatedCompletionDate instanceof Timestamp ? repairData.estimatedCompletionDate.toDate() : null
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la réparation:', error)
      throw error
    }
  }

  async addRepair(repairData) {
    try {
      const repairsRef = this.getStoreCollection()
      
      // S'assurer que le type de paiement est défini
      if (!repairData.paymentType) {
        repairData.paymentType = 'cash' // Valeur par défaut
      }

      // Ajouter les timestamps
      const dataToSave = {
        ...repairData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Ajouter la réparation
      const docRef = await addDoc(repairsRef, dataToSave)
      
      // Récupérer la réparation créée
      const newDoc = await getDoc(docRef)
      return {
        id: docRef.id,
        ...newDoc.data()
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la réparation:', error)
      throw error
    }
  }

  async updateRepair(repairId, updateData) {
    try {
      const repairRef = doc(this.getStoreCollection(), repairId)
      const inventoryStore = useInventoryStore()

      // Récupérer la réparation actuelle
      const currentRepair = (await getDoc(repairRef)).data()

      // Normaliser le type de paiement si présent
      if (updateData.paymentType === undefined) {
        // Garder le type de paiement existant
        updateData.paymentType = currentRepair.paymentType || 'especes'
      } else if (updateData.paymentType) {
        // Normaliser le nouveau type de paiement
        updateData.paymentType = updateData.paymentType.toLowerCase().replace(/[\s-]/g, '_')
      }

      // Calculer le montant restant si l'acompte ou le prix total est modifié
      if (updateData.deposit !== undefined || updateData.price !== undefined) {
        const newPrice = updateData.price ?? currentRepair.price
        const newDeposit = updateData.deposit ?? currentRepair.deposit
        updateData.remainingAmount = newPrice - newDeposit
      }

      // Préparer les données de mise à jour
      const repairUpdate = {
        ...updateData,
        updatedAt: serverTimestamp()
      }

      // Mettre à jour la réparation
      await updateDoc(repairRef, repairUpdate)

      // Si le statut est modifié et qu'il y a des pièces utilisées
      if (updateData.status === 'termine' && updateData.usedParts) {
        // Mettre à jour le stock pour chaque pièce utilisée
        for (const part of updateData.usedParts) {
          if (part.quantity > 0) {
            await inventoryStore.updateItemQuantity(part.id, -part.quantity)
          }
        }
      }

      // Récupérer et retourner la réparation mise à jour
      const updatedDoc = await getDoc(repairRef)
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la réparation:', error)
      throw error
    }
  }

  async deleteRepair(id) {
    try {
      const repairRef = doc(this.getStoreCollection(), id)
      await deleteDoc(repairRef)
    } catch (error) {
      console.error('Erreur lors de la suppression de la réparation:', error)
      throw error
    }
  }

  async getNextRepairNumber() {
    try {
      const currentYear = new Date().getFullYear();
      const repairsRef = this.getStoreCollection();
      
      // Créer une requête pour obtenir toutes les réparations de l'année en cours
      const q = query(
        repairsRef,
        where('repairNumber', '>=', `${currentYear}-0000`),
        where('repairNumber', '<=', `${currentYear}-9999`),
        orderBy('repairNumber', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      // Si aucune réparation n'existe pour cette année, commencer à 1
      if (snapshot.empty) {
        return `${currentYear}-0001`;
      }
      
      // Obtenir le dernier numéro et l'incrémenter
      const lastRepair = snapshot.docs[0].data();
      const lastNumber = parseInt(lastRepair.repairNumber.split('-')[1]);
      const nextNumber = lastNumber + 1;
      
      // Formater le nouveau numéro avec des zéros devant
      return `${currentYear}-${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      console.error('Erreur lors de la génération du prochain numéro de réparation:', error);
      throw error;
    }
  }

  async getIssuesByManufacturer(manufacturerId) {
    if (!manufacturerId) {
      throw new Error('ID du fabricant requis')
    }

    try {
      const authStore = useAuthStore()
      // Récupérer le document du fabricant directement
      const manufacturerRef = doc(db, `stores/${authStore.storeId}/manufacturers/${manufacturerId}`)
      const manufacturerDoc = await getDoc(manufacturerRef)

      if (!manufacturerDoc.exists()) {
        throw new Error('Fabricant non trouvé')
      }

      const manufacturerData = manufacturerDoc.data()
      return manufacturerData.issues || []
    } catch (error) {
      console.error('Erreur lors de la récupération des problèmes:', error)
      throw error
    }
  }
}

export const repairService = new RepairService()
