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

class InventoryService {
  getStoreCollection() {
    const authStore = useAuthStore()
    if (!authStore.storeId) {
      throw new Error('Aucun store ID trouvé')
    }
    return collection(db, `stores/${authStore.storeId}/inventory`)
  }

  async getInventoryItems(options = {}) {
    try {
      const inventoryRef = this.getStoreCollection()
      let q = query(inventoryRef)

      // Appliquer les filtres
      if (options.type) {
        q = query(q, where('type', '==', options.type))
      }
      if (options.manufacturerId) {
        q = query(q, where('manufacturerId', '==', options.manufacturerId))
      }

      // Appliquer le tri
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy, options.orderDirection || 'asc'))
      } else {
        q = query(q, orderBy('name', 'asc'))
      }

      // Appliquer la pagination
      if (options.lastVisible) {
        q = query(q, startAfter(options.lastVisible))
      }
      if (options.limit) {
        q = query(q, limit(options.limit))
      }

      const snapshot = await getDocs(q)
      const items = []

      for (const doc of snapshot.docs) {
        const itemData = doc.data()
        let manufacturerData = null

        // Récupérer les données du fabricant
        if (itemData.manufacturerId) {
          try {
            const manufacturerRef = doc(db, `stores/${useAuthStore().storeId}/manufacturers`, itemData.manufacturerId)
            const manufacturerDoc = await getDoc(manufacturerRef)
            if (manufacturerDoc.exists()) {
              manufacturerData = {
                id: manufacturerDoc.id,
                ...manufacturerDoc.data()
              }
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération du fabricant ${itemData.manufacturerId}:`, error)
          }
        }

        items.push({
          id: doc.id,
          ...itemData,
          manufacturer: manufacturerData,
          createdAt: itemData.createdAt?.toDate(),
          updatedAt: itemData.updatedAt?.toDate()
        })
      }

      return {
        items,
        lastVisible: snapshot.docs[snapshot.docs.length - 1]
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des articles:', error)
      throw error
    }
  }

  async getItemById(id) {
    try {
      const inventoryRef = this.getStoreCollection()
      const itemDoc = await getDoc(doc(inventoryRef, id))
      if (!itemDoc.exists()) {
        throw new Error('Article non trouvé')
      }

      const itemData = itemDoc.data()
      let manufacturerData = null

      // Récupérer les données du fabricant
      if (itemData.manufacturerId) {
        try {
          const manufacturerRef = doc(db, `stores/${useAuthStore().storeId}/manufacturers`, itemData.manufacturerId)
          const manufacturerDoc = await getDoc(manufacturerRef)
          if (manufacturerDoc.exists()) {
            manufacturerData = {
              id: manufacturerDoc.id,
              ...manufacturerDoc.data()
            }
          }
        } catch (error) {
          console.error(`Erreur lors de la récupération du fabricant ${itemData.manufacturerId}:`, error)
        }
      }

      return {
        id: itemDoc.id,
        ...itemData,
        manufacturer: manufacturerData,
        createdAt: itemData.createdAt?.toDate(),
        updatedAt: itemData.updatedAt?.toDate()
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'article:', error)
      throw error
    }
  }

  async addItem(item) {
    try {
      const inventoryRef = this.getStoreCollection()
      const processedData = {
        ...item,
        manufacturerId: item.manufacturerId || null,
        supplierId: item.supplierId || null,
        price: Number(item.price) || 0,
        stock: Number(item.stock) || 0,
        minStock: Number(item.minStock) || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Nettoyer les relations si elles sont null
      if (!processedData.manufacturerId) delete processedData.manufacturerId
      if (!processedData.supplierId) delete processedData.supplierId

      const docRef = await addDoc(inventoryRef, processedData)
      return {
        id: docRef.id,
        ...processedData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'article:', error)
      throw error
    }
  }

  async updateItem(id, item) {
    try {
      const inventoryRef = this.getStoreCollection()
      const itemRef = doc(inventoryRef, id)

      const processedData = {
        ...item,
        manufacturerId: item.manufacturerId || null,
        supplierId: item.supplierId || null,
        price: Number(item.price) || 0,
        stock: Number(item.stock) || 0,
        minStock: Number(item.minStock) || 0,
        updatedAt: serverTimestamp()
      }

      // Nettoyer les relations si elles sont null
      if (!processedData.manufacturerId) delete processedData.manufacturerId
      if (!processedData.supplierId) delete processedData.supplierId

      // Supprimer les objets manufacturer et supplier avant la sauvegarde
      delete processedData.manufacturer
      delete processedData.supplier

      await updateDoc(itemRef, processedData)
      return {
        id,
        ...processedData,
        updatedAt: new Date()
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'article:', error)
      throw error
    }
  }

  async deleteItem(id) {
    try {
      const inventoryRef = this.getStoreCollection()
      await deleteDoc(doc(inventoryRef, id))
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'article:', error)
      throw error
    }
  }

  async updateStock(itemId, quantity, type = 'remove') {
    try {
      const inventoryRef = this.getStoreCollection()
      const itemDoc = await getDoc(doc(inventoryRef, itemId))
      
      if (!itemDoc.exists()) {
        throw new Error('Article non trouvé')
      }

      const currentStock = itemDoc.data().stock || 0
      let newStock = currentStock

      if (type === 'remove') {
        newStock = Math.max(0, currentStock - quantity)
      } else if (type === 'add') {
        newStock = currentStock + quantity
      } else if (type === 'set') {
        newStock = quantity
      }

      await updateDoc(doc(inventoryRef, itemId), {
        stock: newStock,
        updatedAt: serverTimestamp()
      })

      return newStock
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error)
      throw error
    }
  }
}

export const inventoryService = new InventoryService()
