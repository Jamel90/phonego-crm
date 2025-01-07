<template>
  <v-app>
    <!-- Navigation latérale -->
    <v-navigation-drawer
      v-model="drawer"
      permanent
    >
      <v-list-item
        prepend-avatar="@/assets/logo.png"
        title="PhoneGoCRM"
        subtitle="Administration SaaS"
      />

      <v-divider />

      <v-list class="px-2">
        <v-list-item
          to="/admin"
          prepend-icon="mdi-view-dashboard"
          title="Tableau de bord"
          rounded="lg"
        />
        <v-list-item
          to="/admin/analytics"
          prepend-icon="mdi-chart-box"
          title="Analytiques"
          rounded="lg"
        />
        <v-list-item
          to="/admin/stores"
          prepend-icon="mdi-store"
          title="Boutiques"
          rounded="lg"
        />
        <v-list-item
          to="/admin/users"
          prepend-icon="mdi-account-group"
          title="Utilisateurs"
          rounded="lg"
        />
        <v-list-item
          to="/admin/users-plans"
          prepend-icon="mdi-account-cash"
          title="Plans Utilisateurs"
          rounded="lg"
        />
        <v-list-item
          to="/admin/plans"
          prepend-icon="mdi-package-variant"
          title="Plans"
          rounded="lg"
        />
        <v-list-item
          to="/admin/promotions"
          prepend-icon="mdi-ticket-percent"
          title="Promotions"
          rounded="lg"
        />
        <v-list-item
          to="/admin/invoices"
          prepend-icon="mdi-file-document"
          title="Factures"
          rounded="lg"
        />
        <v-list-item
          to="/admin/notifications"
          prepend-icon="mdi-bell"
          title="Notifications"
          rounded="lg"
        />
        <v-list-item
          to="/admin/printers"
          prepend-icon="mdi-printer"
          title="Imprimantes"
          rounded="lg"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- Barre d'outils supérieure -->
    <v-app-bar>
      <v-app-bar-title>Administration SaaS</v-app-bar-title>
      <v-spacer />
      <v-btn
        icon
        @click="logout"
      >
        <v-icon>mdi-logout</v-icon>
      </v-btn>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const drawer = ref(true)

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
