<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-btn
        icon="mdi-printer"
        size="small"
        variant="text"
        color="primary"
        v-bind="props"
        :loading="printing"
        :disabled="!canPrint"
      />
    </template>

    <v-list>
      <v-list-item
        prepend-icon="mdi-receipt"
        title="Ticket client"
        @click="printCustomerTicket"
      />
      <v-list-item
        prepend-icon="mdi-wrench"
        title="Ticket atelier"
        @click="printShopTicket"
      />
      <v-list-item
        prepend-icon="mdi-printer-pos"
        title="Les deux tickets"
        @click="printBothTickets"
      />
    </v-list>
  </v-menu>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSnackbar } from '@/composables/useSnackbar'
import { printerService } from '@/services/printer/printer.service'
import { printerPermissions } from '@/services/printer/printer.permissions'

const props = defineProps({
  repair: {
    type: Object,
    required: true
  }
})

const { showSnackbar } = useSnackbar()
const printing = ref(false)

// Vérifier si l'utilisateur peut imprimer
const canPrint = computed(() => printerPermissions.canPrint())

// Formater les données pour l'impression
const formatRepairData = () => {
  return {
    id: props.repair.repairNumber,
    customerName: props.repair.customer?.name || 'N/A',
    customerPhone: props.repair.customer?.phone || 'N/A',
    manufacturer: props.repair.manufacturer?.name || 'N/A',
    model: props.repair.deviceModel || 'N/A',
    imei: props.repair.imei || 'N/A',
    unlockCode: props.repair.unlockCode || 'N/A',
    repairs: props.repair.issues.map(issue => ({
      name: issue.name,
      price: issue.price || 0,
      estimatedTime: issue.estimatedTime || '30min',
      notes: issue.notes || ''
    })),
    totalPrice: props.repair.price || 0,
    estimatedTime: props.repair.estimatedTime || '1h',
    technicalNotes: props.repair.notes || '',
    status: props.repair.status,
    createdAt: props.repair.createdAt
  }
}

// Imprimer le ticket client
const printCustomerTicket = async () => {
  printing.value = true
  try {
    await printerService.printCustomerTicket(formatRepairData())
    showSnackbar({
      text: 'Ticket client imprimé avec succès',
      color: 'success'
    })
  } catch (error) {
    console.error('Erreur lors de l\'impression du ticket client:', error)
    showSnackbar({
      text: 'Erreur lors de l\'impression du ticket client',
      color: 'error'
    })
  } finally {
    printing.value = false
  }
}

// Imprimer le ticket atelier
const printShopTicket = async () => {
  printing.value = true
  try {
    await printerService.printShopTicket(formatRepairData())
    showSnackbar({
      text: 'Ticket atelier imprimé avec succès',
      color: 'success'
    })
  } catch (error) {
    console.error('Erreur lors de l\'impression du ticket atelier:', error)
    showSnackbar({
      text: 'Erreur lors de l\'impression du ticket atelier',
      color: 'error'
    })
  } finally {
    printing.value = false
  }
}

// Imprimer les deux tickets
const printBothTickets = async () => {
  printing.value = true
  try {
    await printerService.printBothTickets(formatRepairData())
    showSnackbar({
      text: 'Tickets imprimés avec succès',
      color: 'success'
    })
  } catch (error) {
    console.error('Erreur lors de l\'impression des tickets:', error)
    showSnackbar({
      text: 'Erreur lors de l\'impression des tickets',
      color: 'error'
    })
  } finally {
    printing.value = false
  }
}
</script>
