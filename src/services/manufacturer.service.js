import { db } from '@/firebase'
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, updateDoc } from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

class ManufacturerService {
  getStoreCollection() {
    const authStore = useAuthStore()
    if (!authStore.storeId) {
      throw new Error('Aucun store ID trouvé')
    }
    return collection(db, `stores/${authStore.storeId}/manufacturers`)
  }

  async getAllManufacturers() {
    try {
      const manufacturersRef = this.getStoreCollection()
      const q = query(manufacturersRef, orderBy('name'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error('Erreur lors de la récupération des fabricants:', error)
      throw error
    }
  }

  async addManufacturer(manufacturer) {
    try {
      const manufacturersRef = this.getStoreCollection()
      const docRef = await addDoc(manufacturersRef, {
        ...manufacturer,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      return { id: docRef.id, ...manufacturer }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du fabricant:', error)
      throw error
    }
  }

  async updateManufacturer(id, manufacturer) {
    try {
      const manufacturersRef = this.getStoreCollection()
      const docRef = doc(manufacturersRef, id)
      const updateData = {
        ...manufacturer,
        updatedAt: new Date()
      }
      await updateDoc(docRef, updateData)
      return { id, ...manufacturer }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du fabricant:', error)
      throw error
    }
  }

  async deleteManufacturer(id) {
    try {
      const manufacturersRef = this.getStoreCollection()
      await deleteDoc(doc(manufacturersRef, id))
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression du fabricant:', error)
      throw error
    }
  }
}

export const manufacturerService = new ManufacturerService()
