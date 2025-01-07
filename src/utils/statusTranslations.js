// Traductions des statuts
export const repairStatusTranslations = {
  'nouveau': 'Nouveau',
  'en_attente': 'En attente',
  'en_cours': 'En cours',
  'attente_pieces': 'En attente de pièces',
  'termine': 'Terminé',
  'annule': 'Annulé',
  // Anciennes valeurs pour la compatibilité
  'pending': 'En attente',
  'in_progress': 'En cours',
  'completed': 'Terminé',
  'cancelled': 'Annulé'
}

// Couleurs des statuts
export const statusColors = {
  'nouveau': 'blue',
  'en_attente': 'purple',
  'en_cours': 'orange',
  'attente_pieces': 'purple',
  'termine': 'green',
  'annule': 'grey',
  // Anciennes valeurs pour la compatibilité
  'pending': 'purple',
  'in_progress': 'orange',
  'completed': 'green',
  'cancelled': 'grey'
}

// Fonction pour obtenir la traduction d'un statut
export const getStatusTranslation = (status) => {
  return repairStatusTranslations[status] || status
}

// Fonction pour obtenir la couleur d'un statut
export const getStatusColor = (status) => {
  return statusColors[status] || 'grey'
}

// Fonction pour obtenir la valeur technique d'un statut
export const getStatusValue = (translation) => {
  const entries = Object.entries(repairStatusTranslations)
  const found = entries.find(([_, value]) => value === translation)
  return found ? found[0] : translation
}

// Obtenir la liste des statuts pour les menus déroulants
export const getStatusOptions = () => {
  const uniqueStatuses = new Set()
  const options = []
  
  Object.entries(repairStatusTranslations).forEach(([value, title]) => {
    if (!uniqueStatuses.has(title)) {
      uniqueStatuses.add(title)
      options.push({ title, value })
    }
  })
  
  return options
}
