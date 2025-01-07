<template>
  <div class="admin-layout">
    <v-container fluid>
      <v-row>
        <v-col cols="12" class="py-0">
          <v-card flat class="mb-4">
            <v-toolbar
              color="primary"
              flat
              density="compact"
            >
              <v-toolbar-title class="text-white">
                {{ route.meta.title || 'Administration' }}
              </v-toolbar-title>

              <v-spacer />

              <v-btn
                :to="{ name: 'dashboard' }"
                variant="text"
                color="white"
                prepend-icon="mdi-arrow-left"
              >
                Retour au dashboard
              </v-btn>
            </v-toolbar>
          </v-card>
        </v-col>
      </v-row>

      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-container>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
