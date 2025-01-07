import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
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
  Timestamp,
  writeBatch
} from 'firebase/firestore'

export const useInventoryStore = defineStore('inventory', () => {
  const items = ref([])
  const suppliers = ref([])
  const manufacturers = ref([])
  const loading = ref(false)
  const error = ref(null)
  const authStore = useAuthStore()

  const getItemById = (id) => {
    return items.value.find(item => item.id === id)
  }

  const fetchInventory = async () => {
    try {
      if (!authStore.storeId) {
        console.error('No store ID available')
        return
      }

      loading.value = true
      console.log('Fetching inventory for store:', authStore.storeId)
      
      // Charger les fournisseurs
      console.log('Fetching suppliers...')
      const suppliersRef = collection(db, 'stores', authStore.storeId, 'suppliers')
      const suppliersSnapshot = await getDocs(suppliersRef)
      console.log('Suppliers found:', suppliersSnapshot.docs.length)
      
      suppliers.value = suppliersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log('Suppliers loaded:', suppliers.value)

      // Charger les fabricants
      console.log('Fetching manufacturers...')
      const manufacturersRef = collection(db, 'stores', authStore.storeId, 'manufacturers')
      const manufacturersSnapshot = await getDocs(manufacturersRef)
      manufacturers.value = manufacturersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log('Manufacturers found:', manufacturers.value.length)

      // Charger l'inventaire
      console.log('Fetching inventory items...')
      const inventoryRef = collection(db, 'stores', authStore.storeId, 'inventory')
      const querySnapshot = await getDocs(inventoryRef)
      const fetchedItems = []

      for (const docSnapshot of querySnapshot.docs) {
        const item = { id: docSnapshot.id, ...docSnapshot.data() }
        
        // Associer le fabricant si manufacturerId existe
        if (item.manufacturerId) {
          const manufacturer = manufacturers.value.find(m => m.id === item.manufacturerId)
          if (manufacturer) {
            item.manufacturer = {
              id: manufacturer.id,
              name: manufacturer.name
            }
          }
        }
        
        // Associer le fournisseur si supplierId existe
        if (item.supplierId) {
          const supplier = suppliers.value.find(s => s.id === item.supplierId)
          if (supplier) {
            item.supplier = {
              id: supplier.id,
              name: supplier.name
            }
          }
        }
        
        fetchedItems.push(item)
      }

      items.value = fetchedItems
      console.log('Inventory loaded:', items.value)
    } catch (err) {
      console.error('Error fetching inventory:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const addItem = async (itemData) => {
    try {
      if (!authStore.storeId) {
        throw new Error('No store ID available')
      }

      loading.value = true
      
      // Nettoyer et valider les données
      const processedData = {
        name: itemData.name?.trim() || '',
        description: itemData.description?.trim() || '',
        price: Number(itemData.price) || 0,
        stock: Number(itemData.stock) || 0,
        minStock: Number(itemData.minStock) || 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: authStore.user?.uid || null
      }

      // Vérifier les données requises
      if (!processedData.name) {
        throw new Error('Le nom est requis')
      }

      // Ajouter les IDs seulement s'ils sont définis et valides
      if (itemData.manufacturerId && manufacturers.value.find(m => m.id === itemData.manufacturerId)) {
        processedData.manufacturerId = itemData.manufacturerId
      }
      if (itemData.supplierId && suppliers.value.find(s => s.id === itemData.supplierId)) {
        processedData.supplierId = itemData.supplierId
      }

      // Créer le document dans Firestore
      const inventoryRef = collection(db, 'stores', authStore.storeId, 'inventory')
      const docRef = await addDoc(inventoryRef, processedData)

      // Créer l'objet avec les relations
      const newItem = {
        id: docRef.id,
        ...processedData
      }

      // Ajouter les relations si elles existent
      if (processedData.manufacturerId) {
        const manufacturer = manufacturers.value.find(m => m.id === processedData.manufacturerId)
        if (manufacturer) {
          newItem.manufacturer = {
            id: manufacturer.id,
            name: manufacturer.name
          }
        }
      }

      if (processedData.supplierId) {
        const supplier = suppliers.value.find(s => s.id === processedData.supplierId)
        if (supplier) {
          newItem.supplier = {
            id: supplier.id,
            name: supplier.name
          }
        }
      }

      // Ajouter à la liste locale
      items.value.push(newItem)
      return newItem

    } catch (err) {
      console.error('Error adding item:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateItem = async (itemId, itemData) => {
    try {
      if (!authStore.storeId) {
        throw new Error('No store ID available')
      }

      loading.value = true

      // Nettoyer et valider les données
      const processedData = {
        name: itemData.name?.trim() || '',
        description: itemData.description?.trim() || '',
        price: Number(itemData.price) || 0,
        stock: Number(itemData.stock) || 0,
        minStock: Number(itemData.minStock) || 0,
        updatedAt: Timestamp.now()
      }

      // Vérifier les données requises
      if (!processedData.name) {
        throw new Error('Le nom est requis')
      }

      // Ajouter les IDs seulement s'ils sont définis et valides
      if (itemData.manufacturerId && manufacturers.value.find(m => m.id === itemData.manufacturerId)) {
        processedData.manufacturerId = itemData.manufacturerId
      }
      if (itemData.supplierId && suppliers.value.find(s => s.id === itemData.supplierId)) {
        processedData.supplierId = itemData.supplierId
      }

      // Mettre à jour dans Firestore
      const itemRef = doc(db, 'stores', authStore.storeId, 'inventory', itemId)
      await updateDoc(itemRef, processedData)

      // Mettre à jour l'objet local
      const index = items.value.findIndex(item => item.id === itemId)
      if (index !== -1) {
        const updatedItem = {
          ...items.value[index],
          ...processedData
        }

        // Mettre à jour les relations
        if (processedData.manufacturerId) {
          const manufacturer = manufacturers.value.find(m => m.id === processedData.manufacturerId)
          if (manufacturer) {
            updatedItem.manufacturer = {
              id: manufacturer.id,
              name: manufacturer.name
            }
          }
        } else {
          delete updatedItem.manufacturer
          delete updatedItem.manufacturerId
        }

        if (processedData.supplierId) {
          const supplier = suppliers.value.find(s => s.id === processedData.supplierId)
          if (supplier) {
            updatedItem.supplier = {
              id: supplier.id,
              name: supplier.name
            }
          }
        } else {
          delete updatedItem.supplier
          delete updatedItem.supplierId
        }

        items.value[index] = updatedItem
        return updatedItem
      }

    } catch (err) {
      console.error('Error updating item:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteItem = async (itemId) => {
    try {
      if (!authStore.storeId) {
        throw new Error('No store ID available')
      }

      loading.value = true
      const itemRef = doc(db, 'stores', authStore.storeId, 'inventory', itemId)
      await deleteDoc(itemRef)

      items.value = items.value.filter(item => item.id !== itemId)
    } catch (err) {
      console.error('Error deleting item:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const addSupplier = async (supplierData) => {
    try {
      if (!authStore.storeId) {
        throw new Error('No store ID available')
      }

      loading.value = true
      const suppliersRef = collection(db, 'stores', authStore.storeId, 'suppliers')
      const docRef = await addDoc(suppliersRef, {
        ...supplierData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: authStore.user?.uid
      })

      const newSupplier = {
        id: docRef.id,
        ...supplierData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      suppliers.value.push(newSupplier)
      return newSupplier
    } catch (err) {
      console.error('Error adding supplier:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateSupplier = async (supplierId, supplierData) => {
    try {
      if (!authStore.storeId) {
        throw new Error('No store ID available')
      }

      loading.value = true
      const supplierRef = doc(db, 'stores', authStore.storeId, 'suppliers', supplierId)
      
      await updateDoc(supplierRef, {
        ...supplierData,
        updatedAt: Timestamp.now()
      })

      const index = suppliers.value.findIndex(supplier => supplier.id === supplierId)
      if (index !== -1) {
        suppliers.value[index] = {
          ...suppliers.value[index],
          ...supplierData,
          updatedAt: Timestamp.now()
        }
      }
    } catch (err) {
      console.error('Error updating supplier:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteSupplier = async (supplierId) => {
    try {
      if (!authStore.storeId) {
        throw new Error('No store ID available')
      }

      loading.value = true
      const supplierRef = doc(db, 'stores', authStore.storeId, 'suppliers', supplierId)
      await deleteDoc(supplierRef)

      suppliers.value = suppliers.value.filter(supplier => supplier.id !== supplierId)
    } catch (err) {
      console.error('Error deleting supplier:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const addManufacturer = async (manufacturerData) => {
    try {
      if (!authStore.storeId) {
        throw new Error('No store ID available')
      }

      loading.value = true
      const manufacturersRef = collection(db, 'stores', authStore.storeId, 'manufacturers')
      const docRef = await addDoc(manufacturersRef, {
        ...manufacturerData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: authStore.user?.uid
      })

      const newManufacturer = {
        id: docRef.id,
        ...manufacturerData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      manufacturers.value.push(newManufacturer)
      return newManufacturer
    } catch (err) {
      console.error('Error adding manufacturer:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateManufacturer = async (manufacturerId, manufacturerData) => {
    try {
      if (!authStore.storeId) {
        throw new Error('No store ID available')
      }

      loading.value = true
      const manufacturerRef = doc(db, 'stores', authStore.storeId, 'manufacturers', manufacturerId)
      
      await updateDoc(manufacturerRef, {
        ...manufacturerData,
        updatedAt: Timestamp.now()
      })

      const index = manufacturers.value.findIndex(manufacturer => manufacturer.id === manufacturerId)
      if (index !== -1) {
        manufacturers.value[index] = {
          ...manufacturers.value[index],
          ...manufacturerData,
          updatedAt: Timestamp.now()
        }
      }
    } catch (err) {
      console.error('Error updating manufacturer:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteManufacturer = async (manufacturerId) => {
    try {
      if (!authStore.storeId) {
        throw new Error('No store ID available')
      }

      loading.value = true
      const manufacturerRef = doc(db, 'stores', authStore.storeId, 'manufacturers', manufacturerId)
      await deleteDoc(manufacturerRef)

      manufacturers.value = manufacturers.value.filter(manufacturer => manufacturer.id !== manufacturerId)
    } catch (err) {
      console.error('Error deleting manufacturer:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateItemQuantity = async (itemId, newQuantity) => {
    try {
      if (!authStore.storeId) {
        throw new Error('No store ID available')
      }

      loading.value = true
      const itemRef = doc(db, 'stores', authStore.storeId, 'inventory', itemId)
      
      await updateDoc(itemRef, {
        stock: newQuantity,
        updatedAt: Timestamp.now()
      })

      // Mettre à jour l'état local
      const index = items.value.findIndex(item => item.id === itemId)
      if (index !== -1) {
        items.value[index] = {
          ...items.value[index],
          stock: newQuantity,
          updatedAt: Timestamp.now()
        }
      }
    } catch (err) {
      console.error('Error updating item quantity:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateItemStock = async (itemId, quantity) => {
    try {
      if (!authStore.storeId) {
        throw new Error('No store ID available')
      }

      const item = items.value.find(i => i.id === itemId)
      if (!item) {
        throw new Error('Item not found')
      }

      const newStock = item.stock + quantity
      if (newStock < 0) {
        throw new Error('Stock insuffisant')
      }

      const itemRef = doc(db, 'stores', authStore.storeId, 'inventory', itemId)
      await updateDoc(itemRef, {
        stock: newStock,
        updatedAt: Timestamp.now()
      })

      // Mettre à jour le stock localement
      const itemIndex = items.value.findIndex(i => i.id === itemId)
      if (itemIndex !== -1) {
        items.value[itemIndex] = {
          ...items.value[itemIndex],
          stock: newStock
        }
      }
      
      return item
    } catch (err) {
      console.error('Error updating item stock:', err)
      error.value = err.message
      throw err
    }
  }

  return {
    items,
    suppliers,
    manufacturers,
    loading,
    error,
    fetchInventory,
    addItem,
    updateItem,
    deleteItem,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addManufacturer,
    updateManufacturer,
    deleteManufacturer,
    updateItemStock,
    getItemById,
    updateItemQuantity
  }
})
