import { db } from '@/firebase'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'

class FirestoreService {
  constructor() {
    this.db = db
    this.collections = {
      repairs: 'repairs',
      clients: 'clients',
      inventory: 'inventory'
    }
  }

  async create(collectionName, data) {
    try {
      const collectionRef = collection(this.db, this.collections[collectionName])
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    } catch (error) {
      console.error('Firestore Create Error:', error)
      return this.handleError(error)
    }
  }

  async update(collectionName, id, data) {
    try {
      const docRef = doc(this.db, this.collections[collectionName], id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
      return true
    } catch (error) {
      console.error('Firestore Update Error:', error)
      return this.handleError(error)
    }
  }

  async delete(collectionName, id) {
    try {
      const docRef = doc(this.db, this.collections[collectionName], id)
      await deleteDoc(docRef)
      return true
    } catch (error) {
      console.error('Firestore Delete Error:', error)
      return this.handleError(error)
    }
  }

  async get(collectionName, id) {
    try {
      const docRef = doc(this.db, this.collections[collectionName], id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      
      return null
    } catch (error) {
      console.error('Firestore Get Error:', error)
      return this.handleError(error)
    }
  }

  async getAll(collectionName, options = {}) {
    try {
      let q = collection(this.db, this.collections[collectionName])
      
      if (options.where) {
        q = query(q, where(options.where.field, options.where.operator, options.where.value))
      }
      
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'asc'))
      }
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Firestore GetAll Error:', error)
      return this.handleError(error)
    }
  }

  async createRepair(data) {
    return this.create('repairs', {
      ...data,
      status: data.status || 'pending',
      priority: data.priority || 'normal'
    })
  }

  async createClient(data) {
    return this.create('clients', data)
  }

  async createInventoryItem(data) {
    return this.create('inventory', {
      ...data,
      quantity: data.quantity || 0,
      minQuantity: data.minQuantity || 5
    })
  }

  async getClientRepairs(clientId) {
    return this.getAll('repairs', {
      where: {
        field: 'clientId',
        operator: '==',
        value: clientId
      },
      orderBy: {
        field: 'createdAt',
        direction: 'desc'
      }
    })
  }

  async getLowStockItems() {
    return this.getAll('inventory', {
      where: {
        field: 'quantity',
        operator: '<=',
        value: 'minQuantity'
      }
    })
  }

  handleError(error) {
    console.error('Firestore Error:', error)
    
    if (error.code === 'permission-denied') {
      throw new Error('Vous n\'avez pas les permissions nécessaires pour effectuer cette action')
    }
    
    if (error.code === 'not-found') {
      throw new Error('Document non trouvé')
    }
    
    if (error.code === 'already-exists') {
      throw new Error('Ce document existe déjà')
    }
    
    throw new Error('Une erreur est survenue lors de l\'opération sur la base de données')
  }
}

export const firestoreService = new FirestoreService()
