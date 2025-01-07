import { db } from '@/firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { getMessaging, getToken } from 'firebase/messaging'

export const notificationService = {
  async registerDevice(userId, token) {
    try {
      const devicesRef = collection(db, 'devices')
      const q = query(devicesRef, where('userId', '==', userId), where('token', '==', token))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        await addDoc(devicesRef, {
          userId,
          token,
          createdAt: new Date()
        })
      }
    } catch (error) {
      console.error('Error registering device:', error)
      throw error
    }
  },

  async requestNotificationPermission(userId) {
    try {
      const messaging = getMessaging()
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        const token = await getToken(messaging)
        if (token) {
          await this.registerDevice(userId, token)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      throw error
    }
  },

  async sendRepairStatusNotification(repairId, userId, status, message) {
    try {
      const notificationsRef = collection(db, 'notifications')
      await addDoc(notificationsRef, {
        userId,
        repairId,
        status,
        message,
        read: false,
        createdAt: new Date()
      })
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  },

  async markNotificationAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId)
      await updateDoc(notificationRef, {
        read: true
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }
}
