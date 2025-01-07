import { servicesConfig } from '@/config/services.config'
import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions()

// Templates d'emails disponibles
const EMAIL_TEMPLATES = {
  'trial-reminder': {
    subject: 'Votre période d\'essai se termine bientôt',
    template: 'trial-reminder'
  },
  'trial-conversion': {
    subject: 'Bienvenue dans votre abonnement premium',
    template: 'trial-conversion'
  },
  'trial-expired': {
    subject: 'Votre période d\'essai est terminée',
    template: 'trial-expired'
  }
}

/**
 * Service pour l'envoi d'emails via Firebase Functions
 */
export const emailService = {
  /**
   * Envoie un email en utilisant un template prédéfini
   * @param {Object} options Options d'envoi
   * @param {string} options.to Adresse email du destinataire
   * @param {string} options.template Nom du template à utiliser
   * @param {Object} options.data Données à injecter dans le template
   * @returns {Promise} Résultat de l'envoi
   */
  async sendEmail({ to, template, data }) {
    try {
      if (!EMAIL_TEMPLATES[template]) {
        throw new Error(`Template d'email "${template}" non trouvé`)
      }

      const sendEmail = httpsCallable(functions, 'sendEmail')
      
      const result = await sendEmail({
        to,
        template: EMAIL_TEMPLATES[template].template,
        subject: EMAIL_TEMPLATES[template].subject,
        data
      })

      return result.data
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error)
      throw error
    }
  },

  /**
   * Envoie un rappel de fin de période d'essai
   * @param {Object} user Informations de l'utilisateur
   * @param {number} daysLeft Nombre de jours restants
   * @returns {Promise} Résultat de l'envoi
   */
  async sendTrialReminder(user, daysLeft) {
    return this.sendEmail({
      to: user.email,
      template: 'trial-reminder',
      data: {
        name: user.displayName,
        daysLeft,
        loginUrl: `${window.location.origin}/login`
      }
    })
  },

  /**
   * Envoie une confirmation de conversion d'essai vers un abonnement payant
   * @param {Object} user Informations de l'utilisateur
   * @param {Object} plan Informations du plan
   * @returns {Promise} Résultat de l'envoi
   */
  async sendTrialConversion(user, plan) {
    return this.sendEmail({
      to: user.email,
      template: 'trial-conversion',
      data: {
        name: user.displayName,
        planName: plan.name,
        dashboardUrl: `${window.location.origin}/dashboard`
      }
    })
  },

  /**
   * Envoie une notification de fin de période d'essai
   * @param {Object} user Informations de l'utilisateur
   * @returns {Promise} Résultat de l'envoi
   */
  async sendTrialExpired(user) {
    return this.sendEmail({
      to: user.email,
      template: 'trial-expired',
      data: {
        name: user.displayName,
        pricingUrl: `${window.location.origin}/pricing`
      }
    })
  }
}

// Export de la fonction sendEmail pour la rétrocompatibilité
export const sendEmail = emailService.sendEmail.bind(emailService)
