import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDXe0F9fDZvJQm3osWFxZZc_p_wZJXjYuY",
  authDomain: "phonego-crm.firebaseapp.com",
  projectId: "phonego-crm",
  storageBucket: "phonego-crm.appspot.com",
  messagingSenderId: "742796030118",
  appId: "1:742796030118:web:f2d7d0a639084dcc3fb66b"
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

const defaultIssues = [
  { name: 'Écran cassé', estimatedPrice: 89 },
  { name: 'Batterie défectueuse', estimatedPrice: 49 },
  { name: 'Problème de charge', estimatedPrice: 39 },
  { name: 'Boutons défectueux', estimatedPrice: 29 },
  { name: 'Problème de son', estimatedPrice: 45 },
  { name: 'Caméra défectueuse', estimatedPrice: 59 },
  { name: 'Problème de réseau', estimatedPrice: 35 },
  { name: 'Problème de wifi', estimatedPrice: 35 },
  { name: 'Oxydation', estimatedPrice: 79 },
  { name: 'Problème logiciel', estimatedPrice: 49 }
]

async function addDefaultIssues() {
  try {
    // Se connecter d'abord
    await signInWithEmailAndPassword(auth, process.env.FIREBASE_EMAIL, process.env.FIREBASE_PASSWORD)
    console.log('Authentification réussie')

    // Récupérer tous les stores
    const storesRef = collection(db, 'stores')
    const storesSnapshot = await getDocs(storesRef)

    for (const storeDoc of storesSnapshot.docs) {
      const storeId = storeDoc.id
      console.log(`Processing store: ${storeId}`)

      // Récupérer tous les fabricants du store
      const manufacturersRef = collection(db, `stores/${storeId}/manufacturers`)
      const manufacturersSnapshot = await getDocs(manufacturersRef)

      for (const manufacturerDoc of manufacturersSnapshot.docs) {
        const manufacturerId = manufacturerDoc.id
        const manufacturerData = manufacturerDoc.data()

        // Ne pas écraser les problèmes existants
        if (!manufacturerData.issues || manufacturerData.issues.length === 0) {
          console.log(`Adding default issues to manufacturer: ${manufacturerData.name}`)
          
          // Mettre à jour le fabricant avec les problèmes par défaut
          const manufacturerRef = doc(db, `stores/${storeId}/manufacturers/${manufacturerId}`)
          await updateDoc(manufacturerRef, {
            issues: defaultIssues,
            updatedAt: new Date()
          })
        }
      }
    }

    console.log('Migration completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('Error during migration:', error)
    process.exit(1)
  }
}

// Exécuter la migration
addDefaultIssues()
