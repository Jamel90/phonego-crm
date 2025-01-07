/**
 * Convertit un nombre de minutes en format heures:minutes
 * @param {number} minutes - Nombre de minutes à convertir
 * @returns {string} Temps formaté (ex: 1h30)
 */
export const formatMinutesToTime = (minutes) => {
  if (!minutes || minutes < 0) return '0min'
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours === 0) {
    return `${remainingMinutes}min`
  }
  
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h${remainingMinutes}`
}

/**
 * Convertit un format heures:minutes en minutes
 * @param {string} timeString - Chaîne au format "1h30" ou "90min"
 * @returns {number} Nombre de minutes
 */
export const parseTimeToMinutes = (timeString) => {
  if (!timeString) return 0
  
  // Format "90min"
  if (timeString.endsWith('min')) {
    return parseInt(timeString.replace('min', ''), 10) || 0
  }
  
  // Format "1h30"
  const parts = timeString.split('h')
  const hours = parseInt(parts[0], 10) || 0
  const minutes = parseInt(parts[1], 10) || 0
  
  return hours * 60 + minutes
}

/**
 * Calcule le temps total à partir d'une liste de durées
 * @param {Array<number>} times - Liste des durées en minutes
 * @returns {number} Temps total en minutes
 */
export const calculateTotalTime = (times) => {
  if (!Array.isArray(times)) return 0
  return times.reduce((total, time) => total + (time || 0), 0)
}

/**
 * Ajoute une durée à un temps de début
 * @param {Date} startTime - Date de début
 * @param {number} durationInMinutes - Durée à ajouter en minutes
 * @returns {Date} Nouvelle date
 */
export const addDuration = (startTime, durationInMinutes) => {
  if (!startTime || !durationInMinutes) return startTime
  const result = new Date(startTime)
  result.setMinutes(result.getMinutes() + durationInMinutes)
  return result
}
