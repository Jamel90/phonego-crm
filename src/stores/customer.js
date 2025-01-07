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
  orderBy,
  Timestamp
} from 'firebase/firestore'

export const useCustomerStore = defineStore('customer', () => {
  const customers = ref([])
  const loading = ref(false)
  const error = ref(null)
  const authStore = useAuthStore()

  const getCustomerById = (id) => {
    return customers.value.find(customer => customer.id === id)
  }

  const fetchCustomers = async () => {
    try {
      if (!authStore.storeId) {
        console.error('No store ID available')
        return
      }

      loading.value = true
      const storeRef = doc(db, 'stores', authStore.storeId)
      const customersRef = collection(storeRef, 'customers')
      const q = query(customersRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)

      customers.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }))
    } catch (err) {
      console.error('Error fetching customers:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const addCustomer = async (customerData) => {
    try {
      if (!authStore.storeId) {
        throw new Error('No store ID available')
      }

      loading.value = true
      const storeRef = doc(db, 'stores', authStore.storeId)
      const customersRef = collection(storeRef, 'customers')

      const newCustomer = {
        ...customerData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: authStore.user?.uid,
        storeId: authStore.storeId
      }

      const docRef = await addDoc(customersRef, newCustomer)
      const addedCustomer = {
        id: docRef.id,
        ...newCustomer,
        createdAt: newCustomer.createdAt.toDate(),
        updatedAt: newCustomer.updatedAt.toDate()
      }

      customers.value.unshift(addedCustomer)
      return addedCustomer
    } catch (err) {
      console.error('Error adding customer:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCustomer = async (customerId, updateData) => {
    try {
      if (!authStore.storeId) {
        throw new Error('No store ID available')
      }

      loading.value = true
      const storeRef = doc(db, 'stores', authStore.storeId)
      const customerRef = doc(storeRef, 'customers', customerId)

      const dataToUpdate = {
        ...updateData,
        updatedAt: Timestamp.now()
      }

      await updateDoc(customerRef, dataToUpdate)

      const index = customers.value.findIndex(c => c.id === customerId)
      if (index !== -1) {
        customers.value[index] = {
          ...customers.value[index],
          ...updateData,
          updatedAt: new Date()
        }
      }

      return customers.value[index]
    } catch (err) {
      console.error('Error updating customer:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteCustomer = async (customerId) => {
    try {
      if (!authStore.storeId) {
        throw new Error('No store ID available')
      }

      loading.value = true
      const storeRef = doc(db, 'stores', authStore.storeId)
      await deleteDoc(doc(storeRef, 'customers', customerId))
      customers.value = customers.value.filter(customer => customer.id !== customerId)
    } catch (err) {
      console.error('Error deleting customer:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    customers,
    loading,
    error,
    getCustomerById,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer
  }
})
