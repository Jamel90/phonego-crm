<template>
  <div class="billing-cancel">
    <v-container class="text-center">
      <v-icon
        icon="mdi-alert-circle"
        color="warning"
        size="x-large"
        class="mb-4"
      ></v-icon>
      <h1 class="text-h4 mb-4">Paiement annulé</h1>
      <p class="text-body-1 mb-6">
        Le processus de paiement a été annulé. Votre abonnement n'a pas été modifié.
        Si vous avez des questions, n'hésitez pas à contacter notre support.
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
// Pas besoin de logique supplémentaire pour la page d'annulation
</script>

<style scoped>
.billing-cancel {
  padding: 64px 0;
}
</style>
