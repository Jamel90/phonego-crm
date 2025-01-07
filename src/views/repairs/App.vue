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
        </div>

        <v-list class="px-2">
          <v-list-item
            v-for="item in menuItems"
            :key="item.title"
            :to="item.path"
            :active="route.path === item.path"
            :title="item.title"
            :prepend-icon="item.icon"
            class="mb-1 nav-item"
            rounded="lg"
          >
          </v-list-item>
        </v-list>

        <template v-slot:append>
          <div class="pa-4">
            <v-divider class="mb-4"></v-divider>
            <div class="user-profile d-flex align-center mb-4">
              <v-avatar color="primary" size="40" class="user-avatar">
                <span class="text-h6 font-weight-medium">{{ authStore.user?.email?.charAt(0).toUpperCase() }}</span>
              </v-avatar>
              <div class="ml-3">
                <div class="text-subtitle-2 font-weight-medium text-truncate">{{ authStore.user?.email }}</div>
                <div class="text-caption text-medium-emphasis">{{ authStore.isAdmin ? 'Administrateur' : 'Utilisateur' }}</div>
              </div>
            </div>
            <v-btn
              @click="handleLogout"
              block
              variant="tonal"
              color="error"
              class="logout-btn"
              prepend-icon="mdi-logout"
            >
              Déconnexion
            </v-btn>
          </div>
        </template>
      </v-navigation-drawer>

      <v-app-bar
        v-if="$vuetify.display.smAndDown"
        class="modern-appbar px-2"
        elevation="0"
      >
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        <v-img
          src="/logo.png"
          alt="PhoneGO Logo"
          height="30"
          contain
          class="mx-auto"
          style="max-width: 150px"
        />
        <v-btn
          icon
          class="ml-2"
          size="small"
        >
          <v-avatar color="primary" size="32">
            <span class="text-caption font-weight-medium white--text">
              {{ authStore.user?.email?.charAt(0).toUpperCase() }}
            </span>
          </v-avatar>
        </v-btn>
      </v-app-bar>
      <v-app-bar
        v-else
        class="modern-appbar px-2"
        elevation="0"
      >
        <v-app-bar-title>{{ route.meta.title || 'PhoneGO CRM' }}</v-app-bar-title>
        <v-spacer></v-spacer>
        <NotificationCenter v-if="authStore.isAuthenticated" class="mr-2" />
        <v-btn
          icon
          @click="drawer = !drawer"
        >
          <v-icon>mdi-menu</v-icon>
        </v-btn>
      </v-app-bar>
    </template>

    <v-main :class="{'modern-main': authStore.isAuthenticated, 'landing-main': !authStore.isAuthenticated}">
      <v-container :fluid="authStore.isAuthenticated" :class="{'main-container pa-8': authStore.isAuthenticated, 'pa-0': !authStore.isAuthenticated}">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
      class="modern-snackbar"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar.show = false"
        >
          Fermer
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NotificationCenter from '@/components/NotificationCenter.vue'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const drawer = ref(true)

const menuItems = [
  {
    title: 'Tableau de bord',
    path: '/',
    icon: 'mdi-view-dashboard'
  },
  {
    title: 'Réparations',
    path: '/repairs',
    icon: 'mdi-tools'
  },
  {
    title: 'Clients',
    path: '/clients',
    icon: 'mdi-account-group'
  },
  {
    title: 'Inventaire',
    path: '/inventory',
    icon: 'mdi-package-variant-closed'
  },
  ...(authStore.isAdmin ? [
    {
      title: 'Abonnement',
      path: '/subscription',
      icon: 'mdi-star'
    },
    {
      title: 'Facturation',
      path: '/billing',
      icon: 'mdi-currency-eur'
    }
  ] : []),
  {
    title: 'Paramètres',
    path: '/settings',
    icon: 'mdi-cog'
  }
]

const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    snackbar.value = {
      show: true,
      message: 'Erreur lors de la déconnexion',
      color: 'error'
    }
  }
}
</script>

<style>
:root {
  --primary-color: #4F46E5;
  --surface-color: #F9FAFB;
  --drawer-color: #FFFFFF;
  --text-primary: #111827;
  --text-secondary: #6B7280;
  --border-color: #E5E7EB;
  --hover-color: #F3F4F6;
  --active-color: #EEF2FF;
  --error-color: #EF4444;
}

.v-application {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  background-color: var(--surface-color) !important;
  color: var(--text-primary) !important;
}

.modern-drawer {
  background-color: var(--drawer-color) !important;
  border-right: 1px solid var(--border-color) !important;
}

.drawer-header {
  border-bottom: 1px solid var(--border-color);
}

.nav-item {
  min-height: 44px !important;
  transition: all 0.2s ease-in-out;
}

.nav-item:hover {
  background-color: var(--hover-color) !important;
}

.nav-item.v-list-item--active {
  background-color: var(--active-color) !important;
  color: var(--primary-color) !important;
  font-weight: 600;
}

.nav-item.v-list-item--active .v-icon {
  color: var(--primary-color) !important;
}

.nav-item .v-icon {
  color: var(--text-secondary) !important;
}

.user-profile {
  background-color: var(--surface-color);
  border-radius: 12px;
  padding: 12px;
}

.user-avatar {
  background: linear-gradient(135deg, var(--primary-color), #818CF8) !important;
}

.logout-btn {
  font-weight: 600 !important;
  letter-spacing: 0.3px;
}

.modern-main {
  background-color: var(--surface-color) !important;
}

.main-container {
  max-width: 1600px;
  margin: 0 auto;
}

.modern-appbar {
  background-color: var(--drawer-color) !important;
  border-bottom: 1px solid var(--border-color) !important;
}

.v-card {
  border: 1px solid var(--border-color) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06) !important;
  border-radius: 12px !important;
  transition: all 0.2s ease-in-out;
}

.v-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06) !important;
}

.v-btn {
  text-transform: none !important;
  letter-spacing: 0 !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
}

.v-btn--elevated,
.v-btn--variant-tonal {
  box-shadow: none !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modern-snackbar {
  border-radius: 12px !important;
  margin: 16px !important;
}

.landing-main {
  background-color: #ffffff;
  min-height: 100vh;
}

.landing-main .v-container {
  max-width: none;
  width: 100%;
}

@media (max-width: 600px) {
  .main-container {
    padding: 16px !important;
  }
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}
</style>
