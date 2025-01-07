import { collection, getDocs, addDoc } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBqkqNWxTHRqpz5M5GZiSuXtEIY5sE7Vw4",
  authDomain: "phonego-crm.firebaseapp.com",
  projectId: "phonego-crm",
  storageBucket: "phonego-crm.appspot.com",
  messagingSenderId: "1025864835936",
  appId: "1:1025864835936:web:a7c0e3c5c9d2a7c4d9d9d9"
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const COLLECTION_NAME = 'repair-issues'

// Liste des problèmes communs par fabricant
const commonIssues = [
  {
    name: 'Écran cassé',
    estimatedTime: 60, // 1 heure
    basePrice: 89.99
  },
  {
    name: 'Batterie défectueuse',
    estimatedTime: 45, // 45 minutes
    basePrice: 49.99
  },
  {
    name: 'Port de charge endommagé',
    estimatedTime: 90, // 1 heure 30
    basePrice: 69.99
  },
  {
    name: 'Boutons défectueux',
    estimatedTime: 45, // 45 minutes
    basePrice: 39.99
  },
  {
    name: 'Problème de son',
    estimatedTime: 30, // 30 minutes
    basePrice: 29.99
  },
  {
    name: 'Caméra défectueuse',
    estimatedTime: 60, // 1 heure
    basePrice: 79.99
  }
]

// Prix spécifiques par fabricant (multiplicateurs)
const manufacturerPriceMultipliers = {
  'Apple': 1.5,    // Apple est généralement plus cher
  'Samsung': 1.3,  // Samsung est un peu plus cher
  'Xiaomi': 0.8,   // Xiaomi est moins cher
  'default': 1.0   // Prix par défaut pour les autres fabricants
}

async function createDefaultIssues() {
  try {
    // Récupérer tous les fabricants
    const manufacturersRef = collection(db, 'manufacturers')
    const manufacturersSnapshot = await getDocs(manufacturersRef)
    const manufacturers = manufacturersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    console.log('Found manufacturers:', manufacturers)

    // Pour chaque fabricant
    for (const manufacturer of manufacturers) {
      console.log(`Creating issues for ${manufacturer.name}...`)
      
      // Déterminer le multiplicateur de prix pour ce fabricant
      const priceMultiplier = manufacturerPriceMultipliers[manufacturer.name] || manufacturerPriceMultipliers.default

      // Créer chaque problème commun
      for (const issue of commonIssues) {
        const issueData = {
          ...issue,
          manufacturerId: manufacturer.id,
          basePrice: Math.round(issue.basePrice * priceMultiplier * 100) / 100 // Arrondir à 2 décimales
        }

        try {
          // Ajouter le problème dans Firestore
          const docRef = await addDoc(collection(db, COLLECTION_NAME), issueData)
          console.log(`Created issue ${issue.name} for ${manufacturer.name} with ID: ${docRef.id}`)
        } catch (error) {
          console.error(`Error creating issue ${issue.name} for ${manufacturer.name}:`, error)
        }
      }
    }

    console.log('Finished creating default issues')
  } catch (error) {
    console.error('Error creating default issues:', error)
  }
}

// Exécuter le script
createDefaultIssues()
