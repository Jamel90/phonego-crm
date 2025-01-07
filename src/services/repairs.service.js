import { db } from '@/firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'

/**
 * Récupère les réparations pour un client donné
 * @param {string} clientId - L'ID du client
 * @returns {Promise<Array>} - Liste des réparations
 */
export const getRepairsForClient = async (clientId) => {
  try {
    const repairsRef = collection(db, 'repairs')
    const q = query(
      repairsRef,
      where('clientId', '==', clientId),
      orderBy('date', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des réparations:', error)
    throw error
  }
}

/**
 * Formate le prix en euros
 * @param {number} price - Le prix à formater
 * @returns {string} - Prix formaté
 */
export const formatRepairPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}
