// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7V-exK06KPB8Jz3X3fkgXioGLANMkdVg",
  authDomain: "phonegocrm.firebaseapp.com",
  projectId: "phonegocrm",
  storageBucket: "phonegocrm.firebasestorage.app",
  messagingSenderId: "294227784718",
  appId: "1:294227784718:web:1a9242d10477bc7160785f",
  measurementId: "G-LPXVRMNV5R"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)
const functions = getFunctions(app)

// Export the services
export { auth, db, storage, functions }
