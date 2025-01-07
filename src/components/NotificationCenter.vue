<template>
  <div>
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      location="bottom end"
      min-width="300"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          icon
          v-bind="props"
          class="notification-btn"
          :class="{ 'has-unread': unreadCount > 0 }"
        >
          <v-badge
            :content="unreadCount"
            :value="unreadCount"
            color="error"
            overlap
          >
            <v-icon>mdi-bell</v-icon>
          </v-badge>
        </v-btn>
      </template>

      <v-card class="notification-menu">
        <v-card-title class="d-flex justify-space-between align-center pa-4">
          <span class="text-h6">Notifications</span>
          <v-btn
            v-if="unreadCount > 0"
            variant="text"
            density="comfortable"
            @click="markAllAsRead"
          >
            Tout marquer comme lu
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-list class="notification-list">
          <template v-if="notifications.length > 0">
            <v-list-item
              v-for="notification in notifications"
              :key="notification.id"
              :class="{ 'unread': !notification.read }"
              @click="handleNotificationClick(notification)"
            >
              <template v-slot:prepend>
                <v-icon :color="getStatusColor(notification.status)">
                  {{ getStatusIcon(notification.status) }}
                </v-icon>
              </template>

              <v-list-item-title>{{ notification.message }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ formatDate(notification.createdAt) }}
              </v-list-item-subtitle>
            </v-list-item>
          </template>
          <v-list-item v-else>
            <v-list-item-title class="text-center text-medium-emphasis">
              Aucune notification
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { notificationService } from '@/services/notification.service'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const router = useRouter()
const authStore = useAuthStore()
const menu = ref(false)
const notifications = ref([])
let unsubscribe = null

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

const getStatusColor = (status) => {
  switch (status) {
    case 'new': return 'info'
    case 'in_progress': return 'warning'
    case 'completed': return 'success'
    case 'cancelled': return 'error'
    default: return 'grey'
  }
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'new': return 'mdi-bell-ring'
    case 'in_progress': return 'mdi-progress-wrench'
    case 'completed': return 'mdi-check-circle'
    case 'cancelled': return 'mdi-close-circle'
    default: return 'mdi-bell'
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate()
  return formatDistanceToNow(date, { addSuffix: true, locale: fr })
}

const handleNotificationClick = async (notification) => {
  if (!notification.read) {
    await notificationService.markNotificationAsRead(notification.id)
  }
  
  if (notification.repairId) {
    menu.value = false
    router.push(`/repairs/${notification.repairId}`)
  }
}

const markAllAsRead = async () => {
  const unreadNotifications = notifications.value.filter(n => !n.read)
  for (const notification of unreadNotifications) {
    await notificationService.markNotificationAsRead(notification.id)
  }
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', authStore.user.uid),
      orderBy('createdAt', 'desc')
    )
    
    unsubscribe = onSnapshot(q, (snapshot) => {
      notifications.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    })
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style scoped>
.notification-btn {
  position: relative;
}

.notification-btn.has-unread::after {
  content: '';
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background-color: var(--v-error-base);
  border-radius: 50%;
}

.notification-menu {
  max-height: 400px;
  overflow-y: auto;
}

.notification-list .v-list-item.unread {
  background-color: var(--v-surface-variant-base);
}

.notification-list .v-list-item:hover {
  background-color: var(--v-surface-variant-hover);
}
</style>
