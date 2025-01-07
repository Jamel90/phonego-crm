import { defineStore } from 'pinia'
import { ref } from 'vue'
import { repairService } from '@/services/repair.service'

export const useRepairStore = defineStore('repair', () => {
  const repairs = ref([])
  const issues = ref([])
  const loading = ref(false)
  const error = ref(null)

  const fetchRepairs = async () => {
    try {
      loading.value = true
      const result = await repairService.getRepairs()
      repairs.value = result.repairs
    } catch (err) {
      console.error('Error fetching repairs:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const getRepairById = async (repairId) => {
    if (!repairId) {
      throw new Error('Repair ID is required')
    }

    try {
      loading.value = true
      
      // D'abord, chercher dans le state local
      const localRepair = repairs.value.find(r => r.id === repairId)
      if (localRepair) {
        return localRepair
      }

      // Si non trouvé localement, chercher via le service
      return await repairService.getRepairById(repairId)
    } catch (err) {
      console.error(`Error getting repair ${repairId}:`, err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const addRepair = async (repairData) => {
    try {
      loading.value = true
      const newRepair = await repairService.addRepair(repairData)
      
      // Charger les relations complètes
      const fullRepair = await repairService.getRepairById(newRepair.id)
      
      // Mettre à jour le state avec la réparation complète
      repairs.value = [fullRepair, ...repairs.value]
      return fullRepair
    } catch (err) {
      console.error('Error adding repair:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateRepair = async (repairId, updateData) => {
    try {
      loading.value = true
      await repairService.updateRepair(repairId, updateData)
      await fetchRepairs()
    } catch (err) {
      console.error('Error updating repair:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteRepair = async (repairId) => {
    try {
      loading.value = true
      await repairService.deleteRepair(repairId)
      repairs.value = repairs.value.filter(r => r.id !== repairId)
    } catch (err) {
      console.error('Error deleting repair:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const getNextRepairNumber = async () => {
    try {
      loading.value = true
      return await repairService.getNextRepairNumber()
    } catch (err) {
      console.error('Error getting next repair number:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchIssues = async (manufacturerId) => {
    if (!manufacturerId) {
      issues.value = []
      return
    }

    try {
      loading.value = true
      const result = await repairService.getIssuesByManufacturer(manufacturerId)
      issues.value = result || []
    } catch (err) {
      console.error('Erreur lors du chargement des problèmes:', err)
      error.value = err.message
      issues.value = []
    } finally {
      loading.value = false
    }
  }

  const updateRepairStatus = async (repairId, status) => {
    try {
      loading.value = true;
      await repairService.updateRepair(repairId, { status });
      // Mettre à jour le state local
      const repairIndex = repairs.value.findIndex(r => r.id === repairId);
      if (repairIndex !== -1) {
        repairs.value[repairIndex].status = status;
      }
      await fetchRepairs(); // Recharger les réparations pour être sûr d'avoir les dernières données
    } catch (err) {
      console.error('Error updating repair status:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateRepairPriority = async (repairId, priority) => {
    try {
      loading.value = true;
      await repairService.updateRepair(repairId, { priority });
      // Mettre à jour le state local
      const repairIndex = repairs.value.findIndex(r => r.id === repairId);
      if (repairIndex !== -1) {
        repairs.value[repairIndex].priority = priority;
      }
      await fetchRepairs(); // Recharger les réparations pour être sûr d'avoir les dernières données
    } catch (err) {
      console.error('Error updating repair priority:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getDashboardData = async (period = 'month') => {
    try {
      loading.value = true
      
      // Récupérer les réparations si elles ne sont pas déjà chargées
      if (repairs.value.length === 0) {
        await fetchRepairs()
      }

      const now = new Date()
      let startDate = new Date()
      
      // Définir la période de filtrage
      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
        default:
          startDate.setMonth(now.getMonth() - 1)
      }

      // Filtrer les réparations pour la période
      const filteredRepairs = repairs.value.filter(repair => {
        const repairDate = repair.createdAt instanceof Date 
          ? repair.createdAt 
          : new Date(repair.createdAt)
        return repairDate >= startDate && repairDate <= now
      })

      // Calculer les statistiques
      const stats = {
        repairs: filteredRepairs.length,
        revenue: filteredRepairs
          .filter(r => r.status === 'termine')
          .reduce((total, r) => total + (Number(r.price) || 0), 0),
        clients: new Set(filteredRepairs.map(r => r.customerId)).size,
        growth: 0
      }

      // Calculer les nouveaux clients
      const newClients = new Set(
        filteredRepairs
          .filter(r => {
            const repairDate = r.createdAt instanceof Date 
              ? r.createdAt 
              : new Date(r.createdAt)
            return repairDate >= startDate
          })
          .map(r => r.customerId)
      ).size

      // Calculer la croissance des revenus
      const previousPeriodStart = new Date(startDate)
      switch (period) {
        case 'week':
          previousPeriodStart.setDate(previousPeriodStart.getDate() - 7)
          break
        case 'month':
          previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1)
          break
        case 'year':
          previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1)
          break
      }

      const previousPeriodRepairs = repairs.value.filter(repair => {
        const repairDate = repair.createdAt instanceof Date 
          ? repair.createdAt 
          : new Date(repair.createdAt)
        return repairDate >= previousPeriodStart && repairDate < startDate
      })

      const previousRevenue = previousPeriodRepairs
        .filter(r => r.status === 'termine')
        .reduce((total, r) => total + (Number(r.price) || 0), 0)

      const revenueGrowth = previousRevenue ? 
        Math.round(((stats.revenue - previousRevenue) / previousRevenue) * 100) : 
        100

      // Calculer la progression des réparations
      const totalRepairs = repairs.value.length
      const completedRepairs = repairs.value.filter(r => r.status === 'termine').length
      const repairProgress = totalRepairs ? Math.round((completedRepairs / totalRepairs) * 100) : 0

      // Calculer les réparations de la période
      const repairsThisPeriod = filteredRepairs.length

      return {
        repairs: filteredRepairs,
        stats,
        newClients,
        revenueGrowth,
        repairProgress,
        repairsThisMonth: repairsThisPeriod
      }
    } catch (err) {
      console.error('Error getting dashboard data:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    repairs,
    issues,
    loading,
    error,
    fetchRepairs,
    getRepairById,
    addRepair,
    updateRepair,
    deleteRepair,
    getNextRepairNumber,
    fetchIssues,
    updateRepairStatus,
    updateRepairPriority,
    getDashboardData
  }
})
