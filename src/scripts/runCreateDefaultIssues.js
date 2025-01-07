import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { createDefaultIssues } from './createDefaultIssues.js'

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

// Exécuter le script
createDefaultIssues()
