import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { 
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp 
} from 'firebase/firestore'
import { useAuthStore } from './auth'

export const useTaskStore = defineStore('task', {
  state: () => ({
    tasks: [],
    loading: false,
    error: null
  }),

  actions: {
    async getTasks() {
      const authStore = useAuthStore()
      if (!authStore.storeId) {
        console.error('Aucun store ID trouvé')
        this.error = 'Aucun store ID trouvé'
        return []
      }

      try {
        this.loading = true
        this.error = null

        const tasksRef = collection(db, `stores/${authStore.storeId}/tasks`)
        const q = query(tasksRef, orderBy('createdAt', 'desc'))

        const snapshot = await getDocs(q)
        const tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }))

        this.tasks = tasks
        return tasks
      } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error)
        this.error = error.message
        return []
      } finally {
        this.loading = false
      }
    },

    async addTask(taskData) {
      const authStore = useAuthStore()
      if (!authStore.storeId) {
        this.error = 'Aucun store ID trouvé'
        return null
      }

      try {
        this.loading = true
        this.error = null

        const task = {
          ...taskData,
          storeId: authStore.storeId,
          createdBy: authStore.user?.uid,
          createdAt: Timestamp.fromDate(new Date()),
          updatedAt: Timestamp.fromDate(new Date())
        }

        const tasksRef = collection(db, `stores/${authStore.storeId}/tasks`)
        const docRef = await addDoc(tasksRef, task)

        const newTask = {
          id: docRef.id,
          ...task,
          createdAt: task.createdAt.toDate()
        }

        this.tasks.unshift(newTask)
        return newTask
      } catch (error) {
        console.error('Erreur lors de l\'ajout de la tâche:', error)
        this.error = error.message
        return null
      } finally {
        this.loading = false
      }
    },

    async updateTask(taskId, updates) {
      const authStore = useAuthStore()
      if (!authStore.storeId) {
        this.error = 'Aucun store ID trouvé'
        return false
      }

      try {
        this.loading = true
        this.error = null

        const taskRef = doc(db, `stores/${authStore.storeId}/tasks/${taskId}`)
        await updateDoc(taskRef, {
          ...updates,
          updatedAt: Timestamp.fromDate(new Date())
        })

        const index = this.tasks.findIndex(t => t.id === taskId)
        if (index !== -1) {
          this.tasks[index] = {
            ...this.tasks[index],
            ...updates,
            updatedAt: new Date()
          }
        }

        return true
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la tâche:', error)
        this.error = error.message
        return false
      } finally {
        this.loading = false
      }
    },

    async deleteTask(taskId) {
      const authStore = useAuthStore()
      if (!authStore.storeId) {
        this.error = 'Aucun store ID trouvé'
        return false
      }

      try {
        this.loading = true
        this.error = null

        const taskRef = doc(db, `stores/${authStore.storeId}/tasks/${taskId}`)
        await deleteDoc(taskRef)

        this.tasks = this.tasks.filter(t => t.id !== taskId)
        return true
      } catch (error) {
        console.error('Erreur lors de la suppression de la tâche:', error)
        this.error = error.message
        return false
      } finally {
        this.loading = false
      }
    }
  }
})
