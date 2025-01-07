import { db } from '@/firebase'
import { doc, updateDoc } from 'firebase/firestore'

export const updateUserRole = async (email, role) => {
  try {
    const userRef = doc(db, 'users', email)
    await updateDoc(userRef, {
      role: role,
      updatedAt: new Date()
    })
    return { success: true }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error)
    return { success: false, error: error.message }
  }
}
