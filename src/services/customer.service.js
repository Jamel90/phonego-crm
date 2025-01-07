import { db } from '@/firebase'
import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp
} from 'firebase/firestore'
import { useAuthStore } from '@/stores/auth'

class CustomerService {
  getStoreCollection() {
    const authStore = useAuthStore()
    if (!authStore.storeId) {
      throw new Error('Aucun store ID trouvé')
    }
    return collection(db, `stores/${authStore.storeId}/customers`)
  }

  async getCustomers(options = {}) {
    try {
      const customersRef = this.getStoreCollection()
      let q = query(customersRef)

      // Appliquer les filtres
      if (options.searchTerm) {
        q = query(q, 
          where('name', '>=', options.searchTerm),
          where('name', '<=', options.searchTerm + '\uf8ff')
        )
      }

      // Appliquer le tri
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy, options.orderDirection || 'asc'))
      } else {
        q = query(q, orderBy('createdAt', 'desc'))
      }

      // Appliquer la pagination
      if (options.lastVisible) {
        q = query(q, startAfter(options.lastVisible))
      }
      if (options.limit) {
        q = query(q, limit(options.limit))
      }

      const snapshot = await getDocs(q)
      const customers = []

      for (const doc of snapshot.docs) {
        const data = doc.data()
        const customerData = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : null,
          updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : null
        }

        // Récupérer les réparations du client
        const repairsRef = collection(db, `stores/${useAuthStore().storeId}/repairs`)
        const repairsQuery = query(repairsRef, where('customerId', '==', doc.id))
        const repairsSnapshot = await getDocs(repairsQuery)
        
        const repairs = repairsSnapshot.docs.map(repairDoc => {
          const repairData = repairDoc.data()
          return {
            id: repairDoc.id,
            ...repairData,
            createdAt: repairData.createdAt ? new Date(repairData.createdAt.seconds * 1000) : null
          }
        })

        // Calculer le total des réparations et le CA
        customerData.repairCount = repairs.length
        customerData.totalRevenue = repairs.reduce((sum, repair) => sum + (repair.price || 0), 0)
        customerData.repairs = repairs

        customers.push(customerData)
      }

      return {
        customers,
        lastVisible: snapshot.docs[snapshot.docs.length - 1]
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error)
      throw error
    }
  }

  async getCustomerById(id) {
    try {
      const customersRef = this.getStoreCollection()
      const customerDoc = await getDoc(doc(customersRef, id))
      if (!customerDoc.exists()) {
        throw new Error('Client non trouvé')
      }

      const data = customerDoc.data()
      const customerData = {
        id: customerDoc.id,
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : null,
        updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : null
      }

      // Récupérer les réparations du client
      const repairsRef = collection(db, `stores/${useAuthStore().storeId}/repairs`)
      const repairsQuery = query(repairsRef, 
        where('customerId', '==', id),
        orderBy('createdAt', 'desc')
      )
      const repairsSnapshot = await getDocs(repairsQuery)
      
      customerData.repairs = repairsSnapshot.docs.map(doc => {
        const repairData = doc.data()
        return {
          id: doc.id,
          ...repairData,
          createdAt: repairData.createdAt ? new Date(repairData.createdAt.seconds * 1000) : null
        }
      })

      customerData.repairCount = customerData.repairs.length
      customerData.totalRevenue = customerData.repairs.reduce((sum, repair) => sum + (repair.price || 0), 0)

      return customerData
    } catch (error) {
      console.error('Erreur lors de la récupération du client:', error)
      throw error
    }
  }

  async addCustomer(customer) {
    try {
      const customersRef = this.getStoreCollection()
      const docRef = await addDoc(customersRef, {
        ...customer,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return {
        id: docRef.id,
        ...customer,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du client:', error)
      throw error
    }
  }

  async updateCustomer(id, customer) {
    try {
      const customersRef = this.getStoreCollection()
      const customerRef = doc(customersRef, id)
      const updateData = {
        ...customer,
        updatedAt: serverTimestamp()
      }
      await updateDoc(customerRef, updateData)
      return {
        id,
        ...customer,
        updatedAt: new Date()
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du client:', error)
      throw error
    }
  }

  async deleteCustomer(id) {
    try {
      const customersRef = this.getStoreCollection()
      await deleteDoc(doc(customersRef, id))
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error)
      throw error
    }
  }

  async searchCustomers(searchTerm) {
    try {
      const customersRef = this.getStoreCollection()
      const q = query(
        customersRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        limit(5)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Erreur lors de la recherche des clients:', error)
      throw error
    }
  }

  async getTotalCustomers() {
    try {
      const customersRef = this.getStoreCollection()
      const snapshot = await getDocs(customersRef)
      return snapshot.size
    } catch (error) {
      console.error('Erreur lors du comptage des clients:', error)
      throw error
    }
  }

  async getClientRepairs(customerId) {
    if (!customerId) {
      console.warn('getClientRepairs appelé sans ID client')
      return []
    }

    try {
      const repairsRef = collection(db, `stores/${useAuthStore().storeId}/repairs`)
      const q = query(
        repairsRef,
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      
      // Récupérer les problèmes pour chaque réparation
      const repairs = await Promise.all(snapshot.docs.map(async repairDoc => {
        const repairData = repairDoc.data()

        // Récupérer le fabricant si présent
        let manufacturer = null
        if (repairData.manufacturer?.id) {
          try {
            const manufacturerDoc = await getDoc(doc(db, 'manufacturers', repairData.manufacturer.id))
            if (manufacturerDoc.exists()) {
              manufacturer = {
                id: manufacturerDoc.id,
                ...manufacturerDoc.data()
              }
            }
          } catch (err) {
            console.error('Erreur lors de la récupération du fabricant:', err)
          }
        }

        // Récupérer les problèmes si présents
        let issues = []
        if (Array.isArray(repairData.issues)) {
          // Log pour debug
          console.log('Issues dans repairData:', repairData.issues)
          
          // Traiter les problèmes qui sont déjà des objets complets
          issues = repairData.issues.map(issue => {
            // Si c'est un objet avec un nom, on l'utilise directement
            if (typeof issue === 'object' && issue.name) {
              return {
                id: issue.id || `issue-${issue.name.toLowerCase().replace(/\s+/g, '-')}`,
                name: issue.name,
                basePrice: issue.basePrice || 0,
                estimatedTime: issue.estimatedTime || 0
              }
            }
            // Si c'est une string ou un ID, on essaie de le récupérer depuis la base
            return null
          }).filter(Boolean) // Enlever les nulls

          // S'il n'y a pas de problèmes valides dans les objets directs,
          // essayer de récupérer depuis la collection repairIssues
          if (issues.length === 0) {
            const validIssueIds = repairData.issues
              .filter(issue => issue?.id || (typeof issue === 'string' && issue))
              .map(issue => typeof issue === 'string' ? issue : issue.id)

            if (validIssueIds.length > 0) {
              try {
                const issuesQuery = query(
                  collection(db, 'repairIssues'),
                  where(documentId(), 'in', validIssueIds)
                )
                const issuesSnapshot = await getDocs(issuesQuery)
                issues = issuesSnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }))
              } catch (err) {
                console.error('Erreur lors de la récupération des problèmes:', err)
              }
            }
          }
        }

        // Si aucun problème n'a été trouvé mais qu'il y a un problème principal
        if (issues.length === 0 && repairData.mainIssue) {
          if (typeof repairData.mainIssue === 'object' && repairData.mainIssue.name) {
            issues = [{
              id: repairData.mainIssue.id || `issue-${repairData.mainIssue.name.toLowerCase().replace(/\s+/g, '-')}`,
              name: repairData.mainIssue.name,
              basePrice: repairData.mainIssue.basePrice || repairData.price || 0,
              estimatedTime: repairData.mainIssue.estimatedTime || 0
            }]
          } else if (typeof repairData.mainIssue === 'string') {
            issues = [{
              id: `issue-${repairData.mainIssue.toLowerCase().replace(/\s+/g, '-')}`,
              name: repairData.mainIssue,
              basePrice: repairData.price || 0,
              estimatedTime: 0
            }]
          }
        }

        // Construire l'objet réparation
        const repairObj = {
          id: repairDoc.id,
          ...repairData,
          // Informations sur l'appareil
          manufacturer: manufacturer?.name || repairData.manufacturer?.name || '',
          deviceModel: repairData.deviceModel || '',
          // Problèmes
          issues: issues.map(issue => ({
            id: issue.id,
            name: issue.name,
            basePrice: issue.basePrice,
            estimatedTime: issue.estimatedTime
          })),
          mainIssue: issues.length > 0 ? issues[0].name : 
            (repairData.mainIssue?.name || repairData.mainIssue || 'Problème non spécifié'),
          // Autres champs
          createdAt: repairData.createdAt?.toDate(),
          updatedAt: repairData.updatedAt?.toDate(),
          price: parseFloat(repairData.price) || 0,
          description: repairData.description || '',
          status: repairData.status || 'pending'
        }

        // Log pour debug
        console.log('Réparation construite:', {
          id: repairObj.id,
          manufacturer: repairObj.manufacturer,
          deviceModel: repairObj.deviceModel,
          mainIssue: repairObj.mainIssue,
          issues: repairObj.issues,
          rawIssues: repairData.issues
        })

        return repairObj
      }))

      return repairs
    } catch (error) {
      console.error('Erreur lors de la récupération des réparations:', error)
      return []
    }
  }
}

export const customerService = new CustomerService()
