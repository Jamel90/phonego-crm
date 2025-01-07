import { collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/firebase'
import { DEFAULT_REPAIR_ISSUES } from '@/constants/repairIssues'

export async function initializeRepairIssues(manufacturerId) {
  try {
    // Vérifier si des problèmes existent déjà pour ce fabricant
    const issuesRef = collection(db, 'repair_issues')
    const q = query(issuesRef, where('manufacturerId', '==', manufacturerId))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      console.log('Initialisation des problèmes de réparation pour le fabricant:', manufacturerId)
      
      // Ajouter les problèmes par défaut
      const promises = DEFAULT_REPAIR_ISSUES.map(issue => 
        addDoc(issuesRef, {
          ...issue,
          manufacturerId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      )

      await Promise.all(promises)
      console.log('Problèmes de réparation initialisés avec succès')
      return true
    } else {
      console.log('Les problèmes de réparation existent déjà pour ce fabricant')
      return false
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des problèmes:', error)
    throw error
  }
}
