import { db } from '@/firebase'
import { 
  collection, 
  query, 
  getDocs,
  where,
  orderBy,
  limit 
} from 'firebase/firestore'

export const clientService = {
  async getTotalClients() {
    try {
      const clientsRef = collection(db, 'clients')
      const snapshot = await getDocs(clientsRef)
      return snapshot.size
    } catch (error) {
      console.error('Erreur lors du comptage des clients:', error)
      throw error
    }
  },

  async getRecentClients(limit = 5) {
    try {
      const clientsRef = collection(db, 'clients')
      const q = query(
        clientsRef,
        orderBy('createdAt', 'desc'),
        limit(limit)
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }))
    } catch (error) {
      console.error('Erreur lors du chargement des clients récents:', error)
      throw error
    }
  }
}
