import { format, formatDistance, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

// Formats de date couramment utilisés
export const dateFormats = {
  short: 'dd/MM/yyyy',
  long: 'dd MMMM yyyy',
  withTime: 'dd/MM/yyyy HH:mm',
  time: 'HH:mm'
}

// Formater une date selon un format spécifique
export const formatDate = (date, formatStr = dateFormats.short) => {
  if (!date) return ''
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  return format(parsedDate, formatStr, { locale: fr })
}

// Obtenir une date relative (ex: "il y a 2 heures")
export const getRelativeDate = (date) => {
  if (!date) return ''
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  return formatDistance(parsedDate, new Date(), { 
    addSuffix: true,
    locale: fr 
  })
}

// Configuration des statuts de réparation
export const repairStatuses = {
  nouveau: {
    text: 'Nouveau',
    color: 'primary',
    icon: 'mdi-plus-circle'
  },
  en_cours: {
    text: 'En cours',
    color: 'info',
    icon: 'mdi-wrench'
  },
  diagnostic_termine: {
    text: 'Diagnostic terminé',
    color: 'success',
    icon: 'mdi-check-circle'
  },
  attente_pieces: {
    text: 'En attente de pièces',
    color: 'warning',
    icon: 'mdi-clock-outline'
  },
  pret_pour_reparation: {
    text: 'Prêt pour réparation',
    color: 'info',
    icon: 'mdi-tools'
  },
  termine: {
    text: 'Terminé',
    color: 'success',
    icon: 'mdi-check-circle'
  },
  annule: {
    text: 'Annulé',
    color: 'error',
    icon: 'mdi-close-circle'
  }
}

// Configuration des priorités de réparation
export const repairPriorities = {
  low: {
    text: 'Basse',
    color: 'success',
    icon: 'mdi-chevron-down'
  },
  normal: {
    text: 'Normale',
    color: 'primary',
    icon: 'mdi-minus'
  },
  high: {
    text: 'Haute',
    color: 'warning',
    icon: 'mdi-chevron-up'
  },
  urgent: {
    text: 'Urgente',
    color: 'error',
    icon: 'mdi-alert'
  }
}

// Fonction pour formater le statut
export const formatStatus = (status) => {
  return repairStatuses[status] || {
    text: 'Inconnu',
    color: 'grey',
    icon: 'mdi-help-circle'
  }
}

// Fonction pour formater la priorité
export const formatPriority = (priority) => {
  return repairPriorities[priority] || {
    text: 'Inconnue',
    color: 'grey',
    icon: 'mdi-help-circle'
  }
}

// Obtenir le texte d'un statut
export const getStatusText = (status) => {
  return formatStatus(status).text
}

// Obtenir l'icône d'un statut
export const getStatusIcon = (status) => {
  return formatStatus(status).icon
}

// Obtenir la couleur d'un statut
export const getStatusColor = (status) => {
  return formatStatus(status).color
}

// Obtenir le texte d'une priorité
export const getPriorityText = (priority) => {
  return formatPriority(priority).text
}

// Obtenir l'icône d'une priorité
export const getPriorityIcon = (priority) => {
  return formatPriority(priority).icon
}

// Obtenir la couleur d'une priorité
export const getPriorityColor = (priority) => {
  return formatPriority(priority).color
}

// Formater un prix en euros
export const formatPrice = (price) => {
  if (typeof price !== 'number') return ''
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

// Formater un numéro de téléphone français
export const formatPhoneNumber = (phone) => {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/)
  if (match) {
    return match.slice(1).join(' ')
  }
  return phone
}

// Obtenir la classe CSS pour un statut
export const getStatusClass = (status) => {
  return `status-${status?.toLowerCase()}`
}

// Générer des classes CSS conditionnelles
export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

// Tronquer un texte avec des points de suspension
export const truncateText = (text, length = 50) => {
  if (!text || text.length <= length) return text
  return `${text.slice(0, length)}...`
}

// Valider un email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// Valider un numéro de téléphone français
export const isValidPhone = (phone) => {
  const re = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/
  return re.test(phone)
}

// Configuration des icônes pour les catégories de problèmes
export const issueIcons = {
  display: 'mdi-monitor',
  battery: 'mdi-battery',
  camera: 'mdi-camera',
  speaker: 'mdi-speaker',
  microphone: 'mdi-microphone',
  button: 'mdi-gesture-tap-button',
  software: 'mdi-cog',
  other: 'mdi-wrench'
}

// Obtenir l'icône d'une catégorie de problème
export const getIssueIcon = (category) => {
  return issueIcons[category] || 'mdi-wrench'
}

export const lightTheme = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    primary: '#4ade80',
    secondary: '#e9deff',
    accent: '#ffd84d',
    error: '#ef4444',
    info: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b'
  }
}

export const darkTheme = {
  dark: true,
  colors: {
    background: '#1a1b23',
    surface: '#2a2b35',
    primary: '#4ade80',
    secondary: '#e9deff',
    accent: '#ffd84d',
    error: '#ef4444',
    info: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b'
  }
}
