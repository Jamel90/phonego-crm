<template>
  <v-app>
    <!-- Navigation latérale -->
    <v-navigation-drawer
      v-model="drawer"
      app
      permanent
    >
      <v-list-item
        prepend-avatar="@/assets/logo.png"
        title="PhoneGoCRM"
        subtitle="Administration"
      />

      <v-divider />

      <v-list density="compact" nav>
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          rounded="lg"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- Barre d'outils supérieure -->
    <v-app-bar 
      app
      elevation="1"
    >
      <v-app-bar-title>{{ currentPageTitle }}</v-app-bar-title>
      
      <v-spacer />

      <!-- Menu utilisateur -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            v-bind="props"
          >
            <v-avatar color="primary" size="32">
              <span class="text-h6 text-white">{{ userInitials }}</span>
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            prepend-icon="mdi-account"
            title="Mon Profil"
            @click="goToProfile"
          />
          <v-list-item
            prepend-icon="mdi-logout"
            title="Déconnexion"
            @click="logout"
          />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Contenu principal -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const drawer = ref(true)

// Items du menu de navigation
const menuItems = [
  {
    title: 'Tableau de bord',
    icon: 'mdi-view-dashboard',
    to: '/admin'
  },
  {
    title: 'Boutiques',
    icon: 'mdi-store',
    to: '/admin/stores'
  },
  {
    title: 'Utilisateurs',
    icon: 'mdi-account-group',
    to: '/admin/users'
  },
  {
    title: 'Imprimantes',
    icon: 'mdi-printer',
    to: '/admin/printers'
  },
  {
    title: 'Abonnements',
    icon: 'mdi-currency-usd',
    to: '/admin/subscriptions'
  },
  {
    title: 'Paramètres',
    icon: 'mdi-cog',
    to: '/admin/settings'
  }
]

// Titre de la page courante
const currentPageTitle = computed(() => {
  const currentRoute = menuItems.find(item => item.to === route.path)
  return currentRoute ? currentRoute.title : 'Administration'
})

// Initiales de l'utilisateur pour l'avatar
const userInitials = computed(() => {
  const user = authStore.user
  if (!user?.displayName) return 'A'
  return user.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
})

// Navigation vers le profil
const goToProfile = () => {
  router.push('/admin/profile')
}

// Déconnexion
const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.v-navigation-drawer {
  background-color: rgb(var(--v-theme-surface));
}

.v-list-item--active {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
</style>
