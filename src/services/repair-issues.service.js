import { db } from '../firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

class RepairIssuesService {
  constructor() {
    const authStore = useAuthStore()
    this.storeId = authStore.storeId
  }

  async getIssuesByManufacturer(manufacturerId) {
    if (!manufacturerId) {
      console.error('ID du fabricant requis')
      return []
    }

    try {
      const manufacturerRef = doc(db, `stores/${this.storeId}/manufacturers/${manufacturerId}`)
      const manufacturerDoc = await getDoc(manufacturerRef)
      
      if (!manufacturerDoc.exists()) {
        console.error('Fabricant non trouvé:', manufacturerId)
        return []
      }

      const manufacturerData = manufacturerDoc.data()
      return manufacturerData.issues || []
    } catch (error) {
      console.error('Erreur lors du chargement des problèmes:', error)
      return []
    }
  }

  async createIssue(issueData) {
    if (!issueData.manufacturerId) {
      throw new Error('ID du fabricant requis')
    }

    try {
      const manufacturerRef = doc(db, `stores/${this.storeId}/manufacturers/${issueData.manufacturerId}`)
      const manufacturerDoc = await getDoc(manufacturerRef)
      
      if (!manufacturerDoc.exists()) {
        throw new Error('Fabricant non trouvé')
      }

      // Nettoyer et valider les données
      const cleanIssueData = {
        name: issueData.name || '',
        estimatedTime: Number(issueData.estimatedTime) || 0,
        basePrice: Number(issueData.basePrice) || 0,
        manufacturerId: issueData.manufacturerId,
        id: `${issueData.manufacturerId}_${issueData.name.toLowerCase().replace(/\s+/g, '_')}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const currentIssues = manufacturerDoc.data().issues || []
      
      await updateDoc(manufacturerRef, {
        issues: [...currentIssues, cleanIssueData],
        updatedAt: serverTimestamp()
      })

      return cleanIssueData
    } catch (error) {
      console.error('Erreur lors de la création du problème:', error)
      throw error
    }
  }

  async updateIssue(issueId, issueData) {
    if (!issueData.manufacturerId) {
      throw new Error('ID du fabricant requis')
    }

    try {
      const manufacturerRef = doc(db, `stores/${this.storeId}/manufacturers/${issueData.manufacturerId}`)
      const manufacturerDoc = await getDoc(manufacturerRef)

      if (!manufacturerDoc.exists()) {
        throw new Error('Fabricant non trouvé')
      }

      const currentIssues = manufacturerDoc.data().issues || []
      const issueIndex = currentIssues.findIndex(issue => issue.id === issueId)

      if (issueIndex === -1) {
        throw new Error('Problème non trouvé')
      }

      // Nettoyer et valider les données
      const cleanIssueData = {
        ...currentIssues[issueIndex],
        name: issueData.name || currentIssues[issueIndex].name,
        estimatedTime: Number(issueData.estimatedTime) || currentIssues[issueIndex].estimatedTime,
        basePrice: Number(issueData.basePrice) || currentIssues[issueIndex].basePrice,
        manufacturerId: issueData.manufacturerId,
        updatedAt: new Date().toISOString()
      }

      currentIssues[issueIndex] = cleanIssueData

      await updateDoc(manufacturerRef, {
        issues: currentIssues,
        updatedAt: serverTimestamp()
      })

      return cleanIssueData
    } catch (error) {
      console.error('Erreur lors de la mise à jour du problème:', error)
      throw error
    }
  }

  async deleteIssue(issueId, manufacturerId) {
    try {
      const manufacturerRef = doc(db, `stores/${this.storeId}/manufacturers/${manufacturerId}`)
      const manufacturerDoc = await getDoc(manufacturerRef)

      if (!manufacturerDoc.exists()) {
        throw new Error('Fabricant non trouvé')
      }

      const currentIssues = manufacturerDoc.data().issues || []
      const updatedIssues = currentIssues.filter(issue => issue.id !== issueId)

      await updateDoc(manufacturerRef, {
        issues: updatedIssues,
        updatedAt: serverTimestamp()
      })

      return true
    } catch (error) {
      console.error('Erreur lors de la suppression du problème:', error)
      throw error
    }
  }
}

export const repairIssuesService = new RepairIssuesService()
