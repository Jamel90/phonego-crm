<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <h1 class="text-h4 font-weight-bold mb-1">Paramètres</h1>
            <p class="text-subtitle-1 text-medium-emphasis">Gérez tous vos paramètres</p>
          </div>
        </div>

        <v-card>
          <v-tabs
            v-model="activeTab"
            grow
            slider-color="primary"
          >
            <v-tab value="general">
              <v-icon start>mdi-cog</v-icon>
              Général
            </v-tab>
            <v-tab value="store">
              <v-icon start>mdi-store</v-icon>
              Boutique
            </v-tab>
            <v-tab value="user">
              <v-icon start>mdi-account</v-icon>
              Utilisateur
            </v-tab>
            <v-tab value="printers">
              <v-icon start>mdi-printer</v-icon>
              Imprimantes
            </v-tab>
            <v-tab value="manufacturers">
              <v-icon start>mdi-cellphone</v-icon>
              Fabricants
            </v-tab>
            <v-tab value="repair-issues">
              <v-icon start>mdi-wrench</v-icon>
              Types de réparation
            </v-tab>
          </v-tabs>

          <v-card-text>
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const activeTab = ref('general')

// Synchroniser l'onglet actif avec la route
watch(activeTab, (newTab) => {
  const routeMap = {
    general: 'settings.general',
    store: 'settings.store',
    user: 'settings.user',
    printers: 'settings.printers',
    manufacturers: 'settings.manufacturers',
    'repair-issues': 'settings.repair-issues'
  }
  
  const routeName = routeMap[newTab]
  if (routeName) {
    router.push({ name: routeName }).catch(() => {})
  }
})

// Initialiser l'onglet actif en fonction de la route
watch(
  () => route.name,
  (newRouteName) => {
    if (!newRouteName) return
    
    const routeMap = {
      'settings.general': 'general',
      'settings.store': 'store',
      'settings.user': 'user',
      'settings.printers': 'printers',
      'settings.manufacturers': 'manufacturers',
      'settings.repair-issues': 'repair-issues'
    }
    
    const tab = routeMap[newRouteName]
    if (tab) {
      activeTab.value = tab
    }
  },
  { immediate: true }
)
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

.v-card-text {
  padding-top: 20px;
}
</style>
