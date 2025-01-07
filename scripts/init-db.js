import { config } from 'dotenv'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Charger les variables d'environnement
config({ path: resolve(__dirname, '../.env') })

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
}

console.log('Initialisation de Firebase avec la configuration:', {
  ...firebaseConfig,
  apiKey: '***' // Ne pas afficher la clé API dans les logs
})

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function createAdminUser() {
  try {
    console.log('Création de l\'utilisateur admin...')
    
    // Créer un utilisateur admin
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'admin@phonegocrm.com',
      'Admin123!'
    )

    console.log('Utilisateur créé, ajout des informations admin...')

    // Ajouter les informations admin dans Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: 'admin@phonegocrm.com',
      role: 'admin',
      name: 'Admin',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    console.log('Utilisateur admin créé avec succès')
    process.exit(0)
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur admin:', error)
    process.exit(1)
  }
}

createAdminUser()
