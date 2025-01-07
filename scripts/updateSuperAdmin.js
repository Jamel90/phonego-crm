import { initializeApp } from 'firebase/app'
import { getFirestore, doc, updateDoc } from 'firebase/firestore'

const firebaseConfig = {
  // Votre configuration Firebase
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Fonction pour mettre à jour le rôle super admin
async function updateSuperAdminRole() {
  const superAdminEmail = 'admin@phonego.fr'
  const userDocRef = doc(db, 'users', 'VOTRE_USER_ID') // Remplacez par l'ID de l'utilisateur

  try {
    await updateDoc(userDocRef, {
      role: 'SUPER_ADMIN'
    })
    console.log('Rôle super admin mis à jour avec succès')
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error)
  }
}

updateSuperAdminRole()
