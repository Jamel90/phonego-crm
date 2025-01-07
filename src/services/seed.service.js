import { db } from '@/firebase'
import { 
  collection, 
  addDoc, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore'

export const seedService = {
  async seedTestData() {
    try {
      // Créer quelques réparations de test
      const repairs = [
        {
          deviceName: 'iPhone 13',
          clientName: 'Sophie Martin',
          status: 'in_progress',
          price: 89,
          createdAt: Timestamp.fromDate(new Date())
        },
        {
          deviceName: 'Samsung Galaxy S21',
          clientName: 'Thomas Dubois',
          status: 'completed',
          price: 149,
          createdAt: Timestamp.fromDate(new Date())
        },
        {
          deviceName: 'iPad Pro',
          clientName: 'Marie Lambert',
          status: 'pending',
          price: 199,
          createdAt: Timestamp.fromDate(new Date())
        }
      ]

      // Créer quelques clients de test
      const clients = [
        {
          name: 'Sophie Martin',
          email: 'sophie.martin@example.com',
          phone: '0612345678',
          createdAt: serverTimestamp()
        },
        {
          name: 'Thomas Dubois',
          email: 'thomas.dubois@example.com',
          phone: '0623456789',
          createdAt: serverTimestamp()
        },
        {
          name: 'Marie Lambert',
          email: 'marie.lambert@example.com',
          phone: '0634567890',
          createdAt: serverTimestamp()
        }
      ]

      // Ajouter les réparations
      const repairsPromises = repairs.map(repair => 
        addDoc(collection(db, 'repairs'), repair)
      )

      // Ajouter les clients
      const clientsPromises = clients.map(client =>
        addDoc(collection(db, 'clients'), client)
      )

      // Attendre que toutes les données soient ajoutées
      await Promise.all([...repairsPromises, ...clientsPromises])

      console.log('Données de test ajoutées avec succès')
      return true
    } catch (error) {
      console.error('Erreur lors de l\'ajout des données de test:', error)
      return false
    }
  }
}
