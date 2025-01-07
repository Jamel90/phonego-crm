<template>
  <v-navigation-drawer
    v-model="drawer"
    :rail="rail"
    permanent
    @click="rail = false"
  >
    <v-list-item
      :prepend-avatar="user?.photoURL"
      :title="storeName || 'Ma boutique'"
      :subtitle="user?.email"
    >
      <template v-slot:append>
        <v-btn
          variant="text"
          icon="mdi-chevron-left"
          @click.stop="rail = !rail"
        />
      </template>
    </v-list-item>

    <v-divider />

    <v-list density="compact" nav>
      <v-list-item
        to="/"
        :prepend-icon="icons.mdiViewDashboard"
        title="Tableau de bord"
        :active="route.path === '/'"
      />
      
      <v-list-item
        to="/repairs"
        :prepend-icon="icons.mdiWrench"
        title="Réparations"
        :active="route.path.startsWith('/repairs')"
      />
      
      <v-list-item
        prepend-icon="mdi-account-group"
        title="Clients"
        to="/clients"
        :active="route.path.startsWith('/clients')"
        rounded="lg"
      />
      
      <v-list-item
        to="/inventory"
        :prepend-icon="icons.mdiPackageVariant"
        title="Inventaire"
        :active="route.path.startsWith('/inventory')"
      />

      <v-divider class="my-2" />

      <v-list-item
        v-if="isStoreAdmin"
        to="/settings/store"
        :prepend-icon="icons.mdiStoreCog"
        title="Paramètres de la boutique"
        :active="route.path === '/settings/store'"
      />
      
      <v-list-item
        to="/settings"
        :prepend-icon="icons.mdiCog"
        title="Paramètres"
        :active="route.path === '/settings'"
      />
      
      <v-list-item
        v-if="isSuperAdmin"
        to="/admin/stores"
        :prepend-icon="icons.mdiStoreSettings"
        title="Gestion des boutiques"
        :active="route.path.startsWith('/admin/stores')"
      />

      <v-list-item
        v-if="isSuperAdmin"
        to="/admin/users"
        :prepend-icon="icons.mdiAccountCog"
        title="Gestion des utilisateurs"
        :active="route.path.startsWith('/admin/users')"
      />

      <v-list-item
        v-if="isSuperAdmin"
        to="/admin/subscriptions"
        :prepend-icon="icons.mdiCreditCard"
        title="Abonnements"
        :active="route.path.startsWith('/admin/subscriptions')"
      />

      <v-divider v-if="isSuperAdmin" class="my-2" />

      <v-list-item
        @click="logout"
        :prepend-icon="icons.mdiLogout"
        title="Déconnexion"
      />
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  mdiViewDashboard,
  mdiWrench,
  mdiAccountMultiple,
  mdiPackageVariant,
  mdiCog,
  mdiStoreCog,
  mdiStoreSettings,
  mdiAccountCog,
  mdiCreditCard,
  mdiLogout
} from '@mdi/js'

const route = useRoute()
const authStore = useAuthStore()
const drawer = ref(true)
const rail = ref(false)

const user = computed(() => authStore.user)
const storeName = computed(() => authStore.storeName)
const isStoreAdmin = computed(() => authStore.isStoreAdmin)
const isSuperAdmin = computed(() => authStore.isSuperAdmin)

const icons = {
  mdiViewDashboard,
  mdiWrench,
  mdiAccountMultiple,
  mdiPackageVariant,
  mdiCog,
  mdiStoreCog,
  mdiStoreSettings,
  mdiAccountCog,
  mdiCreditCard,
  mdiLogout
}

const logout = () => {
  authStore.logout()
}
</script>
