// Convertir un format de temps (1h30min, 30min, etc.) en minutes
export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0
  timeStr = timeStr.toString().toLowerCase().replace(/\s+/g, '')
  
  // Si c'est juste un nombre, on considère que ce sont des minutes
  if (/^\d+$/.test(timeStr)) {
    return parseInt(timeStr)
  }

  const hours = timeStr.match(/(\d+)h/)
  const minutes = timeStr.match(/(\d+)min?/)
  
  let totalMinutes = 0
  if (hours) totalMinutes += parseInt(hours[1]) * 60
  if (minutes) totalMinutes += parseInt(minutes[1])
  
  return totalMinutes
}

// Convertir les minutes en format lisible
export function formatMinutesToTime(minutes) {
  if (!minutes) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`
  }
  return `${mins}min`
}
