/**
 * Formate un prix en euros avec le format français
 * @param {number} price - Le prix à formater
 * @returns {string} Le prix formaté (ex: 42,00 €)
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price || 0)
}

/**
 * Calcule le montant restant à payer
 * @param {number} total - Le prix total
 * @param {number} deposit - L'acompte versé
 * @returns {number} Le montant restant à payer
 */
export const calculateRemainingAmount = (total, deposit) => {
  return Math.max(0, (total || 0) - (deposit || 0))
}
