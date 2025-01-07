import axios from 'axios'

class PrinterService {
  constructor() {
    // URL par défaut du serveur d'impression
    this.apiUrl = import.meta.env.VITE_PRINTER_API_URL || 'http://localhost:3000'
  }

  async printCustomerTicket(repairData) {
    try {
      await axios.post(`${this.apiUrl}/print`, {
        type: 'customer',
        content: repairData
      })
      return true
    } catch (error) {
      console.error('Erreur lors de l\'impression du ticket client:', error)
      throw error
    }
  }

  async printShopTicket(repairData) {
    try {
      await axios.post(`${this.apiUrl}/print`, {
        type: 'shop',
        content: repairData
      })
      return true
    } catch (error) {
      console.error('Erreur lors de l\'impression du ticket atelier:', error)
      throw error
    }
  }

  async printBothTickets(repairData) {
    try {
      await this.printCustomerTicket(repairData)
      await this.printShopTicket(repairData)
      return true
    } catch (error) {
      console.error('Erreur lors de l\'impression des tickets:', error)
      throw error
    }
  }
}

export const printerService = new PrinterService()
