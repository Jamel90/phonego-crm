import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import dotenv from 'dotenv'

dotenv.config()

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

async function deleteRepairIssuesCollection() {
  try {
    // Se connecter en tant qu'administrateur
    await signInWithEmailAndPassword(auth, 'admin@phonego.fr', 'admin123')
    console.log('Connecté avec succès')

    // Récupérer tous les documents de la collection repairIssues
    const repairIssuesRef = collection(db, 'repairIssues')
    const snapshot = await getDocs(repairIssuesRef)

    console.log(`Nombre de documents à supprimer : ${snapshot.size}`)

    // Supprimer chaque document
    const deletePromises = snapshot.docs.map(async (document) => {
      console.log(`Suppression du document ${document.id}...`)
      await deleteDoc(doc(db, 'repairIssues', document.id))
    })

    await Promise.all(deletePromises)
    console.log('Collection repairIssues supprimée avec succès')

  } catch (error) {
    console.error('Erreur lors de la suppression de la collection:', error)
  }
}

// Exécuter le script
deleteRepairIssuesCollection()
