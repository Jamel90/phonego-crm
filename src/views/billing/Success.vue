<template>
  <div class="billing-success">
    <v-container class="text-center">
      <v-icon
        icon="mdi-check-circle"
        color="success"
        size="x-large"
        class="mb-4"
      ></v-icon>
      <h1 class="text-h4 mb-4">Paiement réussi !</h1>
      <p class="text-body-1 mb-6">
        Votre abonnement a été mis à jour avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de votre nouveau plan.
      </p>
      <v-btn
        color="primary"
        to="/subscription"
      >
        Retour aux abonnements
      </v-btn>
    </v-container>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useOrganizationStore } from '@/stores/organization'

const organizationStore = useOrganizationStore()

onMounted(async () => {
  // Rafraîchir les informations de l'organisation
  await organizationStore.fetchOrganization()
})
</script>

<style scoped>
.billing-success {
  padding: 64px 0;
}
</style>
