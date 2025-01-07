import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase'

// Vrais problèmes pour la production
const productionIssues = [
  // Problèmes génériques (tous fabricants)
  {
    name: "Écran cassé",
    description: "Écran fissuré, cassé ou qui ne s'allume plus",
    manufacturerId: null,
    estimatedPrice: 89.99
  },
  {
    name: "Batterie défectueuse",
    description: "Batterie qui ne charge pas, se décharge rapidement ou gonfle",
    manufacturerId: null,
    estimatedPrice: 49.99
  },
  {
    name: "Problème de charge",
    description: "Ne charge pas, charge lentement ou port de charge endommagé",
    manufacturerId: null,
    estimatedPrice: 39.99
  },
  {
    name: "Problème de son",
    description: "Haut-parleur ou micro ne fonctionne pas correctement",
    manufacturerId: null,
    estimatedPrice: 45.99
  },
  {
    name: "Boutons défectueux",
    description: "Boutons physiques cassés ou ne répondant plus",
    manufacturerId: null,
    estimatedPrice: 29.99
  },
  {
    name: "Dégât des eaux",
    description: "Appareil endommagé par l'eau ou l'humidité",
    manufacturerId: null,
    estimatedPrice: 89.99
  },
  
  // Problèmes spécifiques Apple
  {
    name: "Face ID défectueux",
    description: "Système de reconnaissance faciale ne fonctionne pas",
    manufacturerId: "e03gybFC2OGfWKoSmh0P",
    estimatedPrice: 159.99
  },
  {
    name: "Touch ID défectueux",
    description: "Capteur d'empreinte digitale ne fonctionne pas",
    manufacturerId: "e03gybFC2OGfWKoSmh0P",
    estimatedPrice: 79.99
  },
  {
    name: "Problème de True Tone",
    description: "L'affichage True Tone ne fonctionne pas correctement",
    manufacturerId: "e03gybFC2OGfWKoSmh0P",
    estimatedPrice: 69.99
  }
]

// Fonction pour supprimer tous les problèmes existants
async function deleteAllIssues() {
  try {
    console.log('🗑️ Suppression des anciens problèmes...')
    const snapshot = await getDocs(collection(db, 'issues'))
    await Promise.all(
      snapshot.docs.map(doc => deleteDoc(doc.ref))
    )
    console.log('✅ Anciens problèmes supprimés')
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error)
    throw error
  }
}

// Fonction pour ajouter les vrais problèmes
export async function seedProductionIssues() {
  try {
    console.log('🔄 Réinitialisation des problèmes...')
    
    // Supprimer les anciens problèmes
    await deleteAllIssues()
    
    // Ajouter les nouveaux problèmes
    console.log('➕ Ajout des nouveaux problèmes...')
    const addedIssues = await Promise.all(
      productionIssues.map(issue => addDoc(collection(db, 'issues'), issue))
    )
    
    console.log('✅ Nouveaux problèmes ajoutés avec succès!', addedIssues.length, 'problèmes créés')
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation des problèmes:', error)
    throw error
  }
}
