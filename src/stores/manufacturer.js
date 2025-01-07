import { defineStore } from 'pinia'
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from './auth'

// Problèmes par défaut pour chaque fabricant
const defaultIssues = [
  { name: 'Écran cassé', estimatedPrice: 89, estimatedWorkTime: 60 },
  { name: 'Batterie défectueuse', estimatedPrice: 49, estimatedWorkTime: 30 },
  { name: 'Problème de charge', estimatedPrice: 39, estimatedWorkTime: 30 },
  { name: 'Boutons défectueux', estimatedPrice: 29, estimatedWorkTime: 45 },
  { name: 'Problème de son', estimatedPrice: 45, estimatedWorkTime: 30 },
  { name: 'Caméra défectueuse', estimatedPrice: 59, estimatedWorkTime: 45 },
  { name: 'Problème de réseau', estimatedPrice: 35, estimatedWorkTime: 30 },
  { name: 'Problème de wifi', estimatedPrice: 35, estimatedWorkTime: 30 },
  { name: 'Oxydation', estimatedPrice: 79, estimatedWorkTime: 90 },
  { name: 'Problème logiciel', estimatedPrice: 49, estimatedWorkTime: 45 }
]

export const useManufacturerStore = defineStore('manufacturer', {
  state: () => ({
    manufacturers: [],
    loading: false,
    error: null
  }),

  getters: {
    getManufacturerById: (state) => (id) => state.manufacturers.find(manufacturer => manufacturer.id === id)
  },

  actions: {
    async fetchManufacturers() {
      const authStore = useAuthStore()
      if (!authStore.storeId) {
        console.error('No store ID available')
        return
      }

      this.loading = true
      try {
        const manufacturersRef = collection(db, `stores/${authStore.storeId}/manufacturers`)
        const querySnapshot = await getDocs(manufacturersRef)
        this.manufacturers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          issues: doc.data().issues || [] // S'assurer que issues existe toujours
        }))
      } catch (error) {
        console.error('Error fetching manufacturers:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async createManufacturer(manufacturerData) {
      const authStore = useAuthStore()
      if (!authStore.storeId) {
        console.error('No store ID available')
        return null
      }

      this.loading = true
      try {
        const manufacturersRef = collection(db, `stores/${authStore.storeId}/manufacturers`)
        // Ajouter les problèmes par défaut lors de la création
        const docRef = await addDoc(manufacturersRef, {
          ...manufacturerData,
          issues: defaultIssues, // Ajouter les problèmes par défaut
          createdBy: authStore.user?.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        const newManufacturer = {
          id: docRef.id,
          ...manufacturerData,
          issues: defaultIssues, // Ajouter les problèmes par défaut
          createdBy: authStore.user?.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        this.manufacturers.push(newManufacturer)
        return newManufacturer
      } catch (error) {
        console.error('Error creating manufacturer:', error)
        this.error = error.message
        return null
      } finally {
        this.loading = false
      }
    },

    async updateManufacturer(manufacturerData) {
      const authStore = useAuthStore()
      if (!authStore.storeId) {
        console.error('No store ID available')
        return false
      }

      this.loading = true
      try {
        const manufacturerRef = doc(db, `stores/${authStore.storeId}/manufacturers/${manufacturerData.id}`)
        const updateData = {
          ...manufacturerData,
          updatedBy: authStore.user?.uid,
          updatedAt: new Date()
        }
        await updateDoc(manufacturerRef, updateData)
        
        const index = this.manufacturers.findIndex(m => m.id === manufacturerData.id)
        if (index !== -1) {
          this.manufacturers[index] = {
            ...this.manufacturers[index],
            ...updateData
          }
        }
        return true
      } catch (error) {
        console.error('Error updating manufacturer:', error)
        this.error = error.message
        return false
      } finally {
        this.loading = false
      }
    },

    async deleteManufacturer(manufacturerId) {
      const authStore = useAuthStore()
      if (!authStore.storeId) {
        console.error('No store ID available')
        return false
      }

      this.loading = true
      try {
        const manufacturerRef = doc(db, `stores/${authStore.storeId}/manufacturers/${manufacturerId}`)
        await deleteDoc(manufacturerRef)
        this.manufacturers = this.manufacturers.filter(m => m.id !== manufacturerId)
        return true
      } catch (error) {
        console.error('Error deleting manufacturer:', error)
        this.error = error.message
        return false
      } finally {
        this.loading = false
      }
    }
  }
})
