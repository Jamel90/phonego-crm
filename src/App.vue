<template>
  <v-app>
    <template v-if="authStore.isAuthenticated">
      <v-navigation-drawer
        v-model="drawer"
        :permanent="$vuetify.display.mdAndUp"
        :temporary="$vuetify.display.smAndDown"
        class="modern-drawer"
        elevation="0"
      >
        <div class="drawer-header pa-4">
          <v-img src="/logo.png" alt="PhoneGO Logo" height="35" contain class="mb-6" />
          <div class="text-subtitle-1 font-weight-bold">{{ authStore.storeName }}</div>
        </div>

        <v-list class="px-2">
          <v-list-item
            v-for="item in filteredMenuItems"
            :key="item.title"
            :to="{ name: item.name }"
            :active="route.name === item.name"
            :prepend-icon="item.icon"
            rounded="lg"
            class="mb-1 nav-item"
          >
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>

        <div class="pa-4 mt-auto">
          <v-divider class="mb-4"></v-divider>
          <div class="user-profile d-flex align-center mb-4">
            <v-avatar color="primary" size="40" class="user-avatar">
              <v-icon v-if="!authStore.user?.email" icon="mdi-account" color="white" />
              <span v-else class="text-h6 font-weight-medium white--text">
                {{ authStore.user.email.charAt(0).toUpperCase() }}
              </span>
            </v-avatar>
            <div class="ml-3">
              <div class="text-subtitle-2 font-weight-medium text-truncate">{{ authStore.user?.email }}</div>
              <div class="text-caption text-medium-emphasis">{{ getUserRole }}</div>
            </div>
          </div>
          <v-btn
            @click="handleLogout"
            block
            variant="tonal"
            color="error"
            class="logout-btn"
          >
            <v-icon start icon="mdi-logout"></v-icon>
            <span>Déconnexion</span>
          </v-btn>
        </div>
      </v-navigation-drawer>

      <v-app-bar 
        elevation="0"
        class="px-2"
      >
        <v-app-bar-nav-icon
          v-if="$vuetify.display.smAndDown"
          @click="drawer = !drawer"
        />

        <v-spacer />

        <v-btn icon>
          <v-icon>mdi-magnify</v-icon>
        </v-btn>

        <v-btn icon class="ml-2">
          <v-icon>mdi-bell</v-icon>
        </v-btn>
      </v-app-bar>

      <v-main>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-main>
    </template>
    <template v-else>
      <v-main>
        <router-view />
      </v-main>
    </template>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const drawer = ref(null)

const menuItems = [
  {
    title: 'Tableau de bord',
    name: 'dashboard',
    icon: 'mdi-view-dashboard'
  },
  {
    title: 'Réparations',
    name: 'repairs',
    icon: 'mdi-wrench'
  },
  {
    title: 'Clients',
    name: 'clients',
    icon: 'mdi-account-group'
  },
  {
    title: 'Inventaire',
    name: 'inventory',
    icon: 'mdi-package-variant-closed'
  },
  {
    title: 'Tarification',
    name: 'pricing',
    icon: 'mdi-cash-multiple'
  },
  {
    title: 'Paramètres',
    name: 'settings',
    icon: 'mdi-cog',
    requiresAdmin: true
  },
  {
    title: 'Administration',
    name: 'admin',
    icon: 'mdi-shield-account',
    requiresSuperAdmin: true,
    children: [
      {
        title: 'Tableau de bord',
        name: 'admin.dashboard',
        icon: 'mdi-view-dashboard'
      },
      {
        title: 'Plans Utilisateurs',
        name: 'admin.users-plans',
        icon: 'mdi-account-cash'
      },
      {
        title: 'Analytiques',
        name: 'admin.analytics',
        icon: 'mdi-chart-bar'
      }
    ]
  }
]

const getRoutePath = (item) => {
  return item.name ? { name: item.name } : { path: item.path }
}

const filteredMenuItems = computed(() => {
  return menuItems.filter(item => {
    if (item.requiresSuperAdmin) {
      return authStore.isSuperAdmin
    }
    if (item.requiresAdmin) {
      return authStore.isStoreAdmin
    }
    return true
  })
})

const getUserRole = computed(() => {
  if (authStore.isSuperAdmin) return 'Super Admin'
  if (authStore.isStoreAdmin) return 'Admin'
  return 'Staff'
})

async function handleLogout() {
  try {
    await authStore.logout()
    router.push({ name: 'login' })
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await authStore.initializeAuthState()
  }
})
</script>

<style>
:root {
  --primary-color: #4ade80;
  --primary-light: #86efac;
  --primary-dark: #22c55e;
}

.modern-drawer {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.drawer-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.nav-item {
  transition: all 0.3s ease;
}

.nav-item:hover {
  background-color: rgba(74, 222, 128, 0.1);
}

.nav-item.v-list-item--active {
  background-color: var(--primary-color);
  color: white;
}

.user-avatar {
  border: 2px solid var(--primary-color);
}

.logout-btn {
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background-color: rgb(244, 67, 54, 0.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
