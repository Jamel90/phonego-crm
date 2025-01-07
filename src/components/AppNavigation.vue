<template>
  <v-navigation-drawer
    v-model="drawer"
    :rail="rail"
    permanent
    @click="rail = false"
  >
    <v-list-item
      prepend-avatar="https://randomuser.me/api/portraits/men/85.jpg"
      :title="userName"
      :subtitle="userRole"
    >
      <template v-slot:append>
        <v-btn
          variant="text"
          icon="mdi-chevron-left"
          @click.stop="rail = !rail"
        ></v-btn>
      </template>
    </v-list-item>

    <v-divider></v-divider>

    <v-list density="compact" nav>
      <v-list-item
        v-for="(item, i) in menuItems"
        :key="i"
        :value="item"
        :to="item.to"
        :prepend-icon="item.icon"
        :title="item.title"
        :disabled="item.disabled"
      >
      </v-list-item>
    </v-list>

    <!-- Bouton de déconnexion en bas -->
    <template v-slot:append>
      <v-divider></v-divider>
      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-cog"
          title="Paramètres"
          to="/settings"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-logout"
          title="Déconnexion"
          @click="handleLogout"
        ></v-list-item>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOrganizationStore } from '@/stores/organization'
import { ROLES } from '@/constants/plans'

const router = useRouter()
const authStore = useAuthStore()
const organizationStore = useOrganizationStore()

const drawer = ref(true)
const rail = ref(false)

// Informations utilisateur
const userName = computed(() => authStore.currentUser?.displayName || 'Utilisateur')
const userRole = computed(() => {
  const role = authStore.currentUser?.role
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return 'Super Admin'
    case ROLES.OWNER:
      return 'Propriétaire'
    case ROLES.ADMIN:
      return 'Administrateur'
    case ROLES.MANAGER:
      return 'Manager'
    case ROLES.TECHNICIAN:
      return 'Technicien'
    case ROLES.RECEPTION:
      return 'Réception'
    default:
      return 'Utilisateur'
  }
})

// Items du menu
const menuItems = computed(() => {
  const items = [
    {
      title: 'Tableau de bord',
      icon: 'mdi-view-dashboard',
      to: '/'
    },
    {
      title: 'Réparations',
      icon: 'mdi-wrench',
      to: '/repairs'
    },
    {
      title: 'Clients',
      icon: 'mdi-account-group',
      to: '/clients'
    },
    {
      title: 'Inventaire',
      icon: 'mdi-package-variant-closed',
      to: '/inventory'
    }
  ]

  // Ajouter les éléments d'administration si l'utilisateur est propriétaire ou admin
  const isAdmin = [ROLES.OWNER, ROLES.ADMIN].includes(authStore.currentUser?.role)
  if (isAdmin) {
    items.push(
      {
        title: 'Abonnement',
        icon: 'mdi-star',
        to: '/subscription'
      },
      {
        title: 'Facturation',
        icon: 'mdi-currency-eur',
        to: '/billing'
      },
      {
        title: 'Équipe',
        icon: 'mdi-account-multiple',
        to: '/team'
      }
    )
  }

  // Ajouter l'administration super admin si nécessaire
  if (authStore.currentUser?.role === ROLES.SUPER_ADMIN) {
    items.push({
      title: 'Administration',
      icon: 'mdi-shield-account',
      to: '/admin'
    })
  }

  return items
})

// Déconnexion
const handleLogout = async () => {
  try {
    await authStore.signOut()
    router.push('/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
  }
}
</script>

<style scoped>
.v-navigation-drawer {
  transition: 0.2s ease-in-out;
}
</style>
