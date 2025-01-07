<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="text-center pa-6">
          <v-card-title class="text-h4 mb-4">
            Page non trouvée
          </v-card-title>
          <v-card-text>
            <p class="text-body-1 mb-4">
              Désolé, la page que vous recherchez n'existe pas.
            </p>
            <v-btn
              color="primary"
              size="large"
              :to="{ name: 'dashboard' }"
              class="mt-8"
            >
              Retourner au tableau de bord
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
// Pas besoin de logique supplémentaire
</script>
