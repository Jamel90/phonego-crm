// Formattage des prix
export const formatPrice = (price) => {
  if (price === null || price === undefined) return '0,00 €'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

// Formattage des dates
export const formatDate = (date) => {
  if (!date) return '-'
  
  try {
    let dateObj = date

    // Convertir en objet Date si nécessaire
    if (!(date instanceof Date)) {
      if (typeof date === 'object' && date.seconds) {
        // Timestamp Firestore
        dateObj = new Date(date.seconds * 1000)
      } else if (typeof date === 'string') {
        // Chaîne de caractères
        dateObj = new Date(date)
      } else if (typeof date.toDate === 'function') {
        // Objet Firestore Timestamp
        dateObj = date.toDate()
      }
    }

    // Vérifier si la date est valide
    if (dateObj instanceof Date && !isNaN(dateObj)) {
      return new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj)
    }

    console.error('Date invalide:', date)
    return '-'
  } catch (error) {
    console.error('Erreur de formatage de date:', error, date)
    return '-'
  }
}

import { getStatusTranslation, getStatusColor as getStatusColorFromTranslations } from './statusTranslations'

// Formattage du statut de réparation
export const formatRepairStatus = (status) => {
  return getStatusTranslation(status)
}

// Couleur selon le statut
export const getStatusColor = (status) => {
  return getStatusColorFromTranslations(status)
}

// Formattage de la priorité
export const formatRepairPriority = (priority) => {
  const priorityMap = {
    'basse': 'Basse',
    'normal': 'Normale',
    'haute': 'Haute',
    'urgente': 'Urgente'
  }
  return priorityMap[priority] || priority
}

// Couleur selon la priorité
export const getPriorityColor = (priority) => {
  const colorMap = {
    'basse': 'green',
    'normal': 'blue',
    'haute': 'orange',
    'urgente': 'red'
  }
  return colorMap[priority] || 'grey'
}
