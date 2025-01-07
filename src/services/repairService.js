import { db } from '@/firebase'
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore'
import { notificationService } from './notificationService'
import { useAuthStore } from '@/stores/auth'

const REPAIR_STATUS_MESSAGES = {
  nouveau: 'Votre réparation a été enregistrée',
  en_cours: 'Votre réparation est en cours',
  diagnostic_termine: 'Le diagnostic de votre appareil est terminé',
  attente_pieces: 'En attente de pièces pour votre réparation',
  pret_pour_reparation: 'Votre appareil est prêt pour la réparation',
  termine: 'Votre réparation est terminée',
  annule: 'Votre réparation a été annulée'
}

export const repairService = {
  async getAll(status = null) {
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.uid
      
      if (!userId) {
        throw new Error('Utilisateur non connecté')
      }

      let q;
      if (status) {
        q = query(
          collection(db, 'repairs'),
          where('userId', '==', userId),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          collection(db, 'repairs'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const repairs = [];

      for (const docSnapshot of querySnapshot.docs) {
        const repairData = docSnapshot.data();
        let customerData = null;
        let manufacturerData = null;

        // Récupérer les données du client
        if (repairData.customerId) {
          try {
            const customerRef = doc(db, 'customers', repairData.customerId);
            const customerDoc = await getDoc(customerRef);
            if (customerDoc.exists()) {
              customerData = {
                id: customerDoc.id,
                ...customerDoc.data()
              };
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération du client ${repairData.customerId}:`, error);
          }
        }

        // Récupérer les données du fabricant
        if (repairData.manufacturerId) {
          try {
            const manufacturerRef = doc(db, 'manufacturers', repairData.manufacturerId);
            const manufacturerDoc = await getDoc(manufacturerRef);
            if (manufacturerDoc.exists()) {
              manufacturerData = {
                id: manufacturerDoc.id,
                ...manufacturerDoc.data()
              };
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération du fabricant ${repairData.manufacturerId}:`, error);
          }
        }

        repairs.push({
          id: docSnapshot.id,
          ...repairData,
          customer: customerData,
          manufacturer: manufacturerData,
          createdAt: repairData.createdAt?.toDate()
        });
      }

      return repairs;
    } catch (error) {
      console.error('Erreur lors de la récupération des réparations:', error);
      throw error;
    }
  },

  async createRepair(repairData) {
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.uid
      
      if (!userId) {
        throw new Error('Utilisateur non connecté')
      }

      const docRef = await addDoc(collection(db, 'repairs'), {
        ...repairData,
        userId,
        status: 'nouveau',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      await notificationService.sendRepairStatusNotification(
        docRef.id,
        userId,
        'nouveau',
        REPAIR_STATUS_MESSAGES.nouveau
      )

      return docRef.id
    } catch (error) {
      console.error('Error creating repair:', error)
      throw error
    }
  },

  async updateRepairStatus(repairId, status, notes = '') {
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.uid
      
      if (!userId) {
        throw new Error('Utilisateur non connecté')
      }

      const repairRef = doc(db, 'repairs', repairId)
      const repairDoc = await getDoc(repairRef)
      
      if (!repairDoc.exists()) {
        throw new Error('Repair not found')
      }

      const repairData = repairDoc.data()

      await updateDoc(repairRef, {
        status,
        statusNotes: notes,
        updatedAt: new Date()
      })

      await notificationService.sendRepairStatusNotification(
        repairId,
        userId,
        status,
        REPAIR_STATUS_MESSAGES[status]
      )
    } catch (error) {
      console.error('Error updating repair status:', error)
      throw error
    }
  },

  async getRepairsByClient(clientId) {
    try {
      const q = query(
        collection(db, 'repairs'),
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error getting repairs by client:', error)
      throw error
    }
  },

  async getRepairsByStatus(status) {
    try {
      const q = query(
        collection(db, 'repairs'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error getting repairs by status:', error)
      throw error
    }
  },

  async addRepairNote(repairId, note) {
    try {
      const authStore = useAuthStore()
      const userId = authStore.user?.uid
      
      if (!userId) {
        throw new Error('Utilisateur non connecté')
      }

      const repairRef = doc(db, 'repairs', repairId)
      const repairDoc = await getDoc(repairRef)
      
      if (!repairDoc.exists()) {
        throw new Error('Repair not found')
      }

      const repairData = repairDoc.data()
      const notes = repairData.notes || []

      await updateDoc(repairRef, {
        notes: [...notes, {
          content: note,
          createdAt: new Date(),
          createdBy: userId
        }],
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error adding repair note:', error)
      throw error
    }
  }
}
