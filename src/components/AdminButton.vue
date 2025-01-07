<template>
  <v-btn
    v-if="authStore.isAdmin"
    :to="{ name: 'AdminPanel' }"
    icon
    class="mr-2"
    color="primary"
  >
    <v-icon>mdi-shield-crown</v-icon>
    <v-tooltip
      activator="parent"
      location="bottom"
    >
      Administration
    </v-tooltip>
  </v-btn>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>
