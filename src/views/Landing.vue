<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <section class="hero">
      <v-container>
        <v-row align="center" justify="center" class="hero-content">
          <v-col cols="12" md="6" lg="5" class="hero-text">
            <h1 class="text-h2 font-weight-bold mb-6">
              La solution complète pour votre boutique de réparation
            </h1>
            <p class="text-h6 text-medium-emphasis mb-8">
              Gérez vos réparations, vos clients et votre activité en toute simplicité avec PhoneGO CRM.
              La solution tout-en-un conçue pour les professionnels de la réparation.
            </p>
            <div class="d-flex flex-wrap gap-4 justify-center">
              <v-btn
                color="primary"
                size="x-large"
                class="text-none px-8"
                :to="{ name: 'register' }"
                elevation="2"
              >
                Essayer gratuitement
              </v-btn>
              <v-btn
                variant="outlined"
                size="x-large"
                class="text-none px-8"
                :to="{ name: 'login' }"
              >
                Se connecter
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="6" lg="5" class="hero-image-container">
            <v-img
              src="/src/assets/hero-image.svg"
              alt="PhoneGO CRM Dashboard"
              class="hero-image"
            />
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Features Section -->
    <section class="features py-16">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="8" class="text-center">
            <h2 class="text-h3 font-weight-bold mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p class="text-h6 text-medium-emphasis mb-12">
              Des outils puissants pour gérer votre activité efficacement
            </p>
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-col cols="12" sm="6" lg="4">
            <v-card class="feature-card" elevation="0">
              <v-card-text class="text-center pa-8">
                <v-icon icon="mdi-cellphone-check" size="48" color="primary" class="mb-4"></v-icon>
                <h3 class="text-h5 font-weight-bold mb-4">Gestion des réparations</h3>
                <p class="text-body-1 text-medium-emphasis">
                  Suivez vos réparations en temps réel, gérez les statuts et informez automatiquement vos clients.
                </p>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" lg="4">
            <v-card class="feature-card" elevation="0">
              <v-card-text class="text-center pa-8">
                <v-icon icon="mdi-account-group" size="48" color="primary" class="mb-4"></v-icon>
                <h3 class="text-h5 font-weight-bold mb-4">Gestion des clients</h3>
                <p class="text-body-1 text-medium-emphasis">
                  Centralisez les informations clients, leur historique et fidélisez-les avec des communications personnalisées.
                </p>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" lg="4">
            <v-card class="feature-card" elevation="0">
              <v-card-text class="text-center pa-8">
                <v-icon icon="mdi-chart-box" size="48" color="primary" class="mb-4"></v-icon>
                <h3 class="text-h5 font-weight-bold mb-4">Statistiques détaillées</h3>
                <p class="text-body-1 text-medium-emphasis">
                  Analysez votre activité avec des tableaux de bord intuitifs et prenez les bonnes décisions.
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Pricing Section -->
    <section class="pricing py-16">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="8" class="text-center">
            <h2 class="text-h3 font-weight-bold mb-4">
              Des forfaits adaptés à vos besoins
            </h2>
            <p class="text-h6 text-medium-emphasis mb-12">
              Choisissez le plan qui correspond le mieux à votre activité
            </p>
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-col
            v-for="(plan, key) in SUBSCRIPTION_PLANS"
            :key="key"
            cols="12"
            sm="6"
            md="4"
            lg="3"
            class="d-flex"
          >
            <v-card class="pricing-card flex-grow-1" elevation="2">
              <v-card-text class="pa-8">
                <div class="text-center mb-6">
                  <h3 class="text-h4 font-weight-bold mb-2">{{ plan.name }}</h3>
                  <p class="text-subtitle-1 text-medium-emphasis mb-4">{{ plan.description }}</p>
                  <div class="pricing-amount">
                    <span class="text-h3 font-weight-bold">{{ plan.price }}€</span>
                    <span class="text-subtitle-1 text-medium-emphasis">/mois</span>
                  </div>
                </div>

                <v-divider class="mb-6"></v-divider>

                <div class="limits-section mb-6">
                  <div class="d-flex align-center mb-4">
                    <v-icon icon="mdi-account-multiple" color="primary" class="mr-2"></v-icon>
                    <span class="text-body-1">{{ plan.maxUsers }} utilisateurs</span>
                  </div>
                  <div class="d-flex align-center mb-4">
                    <v-icon icon="mdi-account-group" color="primary" class="mr-2"></v-icon>
                    <span class="text-body-1">{{ plan.maxClients }} clients</span>
                  </div>
                  <div class="d-flex align-center">
                    <v-icon icon="mdi-wrench" color="primary" class="mr-2"></v-icon>
                    <span class="text-body-1">{{ plan.maxRepairs }} réparations</span>
                  </div>
                </div>

                <v-divider class="mb-6"></v-divider>

                <div class="features-list mb-8">
                  <div
                    v-for="(feature, index) in plan.features"
                    :key="index"
                    class="d-flex align-center mb-4"
                  >
                    <v-icon icon="mdi-check-circle" color="success" class="mr-4"></v-icon>
                    <span class="text-body-1">{{ feature }}</span>
                  </div>
                </div>

                <v-btn
                  color="primary"
                  variant="flat"
                  block
                  size="x-large"
                  :to="{ name: 'register' }"
                  class="mt-4"
                >
                  Choisir {{ plan.name }}
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- CTA Section -->
    <section class="cta py-16">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="8" class="text-center">
            <v-card color="primary" class="text-center pa-12">
              <h2 class="text-h3 font-weight-bold text-white mb-4">
                Prêt à transformer votre boutique ?
              </h2>
              <p class="text-h6 text-white text-opacity-70 mb-8">
                Rejoignez les professionnels qui font confiance à PhoneGO CRM
              </p>
              <v-btn
                size="x-large"
                color="white"
                class="text-primary px-8"
                :to="{ name: 'register' }"
              >
                Commencer maintenant
              </v-btn>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>
  </div>
</template>

<script setup>
import { SUBSCRIPTION_PLANS } from '@/constants/plans'
</script>

<style scoped>
.landing-container {
  background-color: var(--bg-primary);
  min-height: 100vh;
  color: var(--text-primary);
}

.landing-content {
  background-color: var(--bg-primary);
}

.hero-section {
  background-color: var(--bg-surface);
  padding: 64px 0;
}

.feature-card {
  background-color: var(--bg-surface) !important;
  border: 1px solid var(--border-light);
}

.feature-title {
  color: var(--text-primary);
}

.feature-description {
  color: var(--text-secondary);
}
</style>
