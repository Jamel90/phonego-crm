import { repairService } from './repair.service'
import { clientService } from './client.service'

export const statsService = {
  async getDashboardStats() {
    try {
      const [monthlyRepairStats, totalClients] = await Promise.allSettled([
        repairService.getMonthlyStats(),
        clientService.getTotalClients()
      ])

      return {
        repairs: monthlyRepairStats.status === 'fulfilled' ? monthlyRepairStats.value.count : 0,
        revenue: monthlyRepairStats.status === 'fulfilled' ? monthlyRepairStats.value.revenue : 0,
        clients: totalClients.status === 'fulfilled' ? totalClients.value : 0
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      return {
        repairs: 0,
        revenue: 0,
        clients: 0
      }
    }
  }
}
