<template>
  <v-dialog v-model="dialog" max-width="500px">
    <template v-slot:activator="{ props }">
      <v-btn
        icon
        color="primary"
        v-bind="props"
        :loading="printing"
        :disabled="printing"
      >
        <v-icon>mdi-printer</v-icon>
      </v-btn>
    </template>

    <v-card>
      <v-card-title>
        <span class="text-h5">Impression des tickets</span>
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <p>Voulez-vous imprimer les tickets pour cette réparation ?</p>
              <v-checkbox
                v-model="printCustomer"
                label="Ticket client"
                hide-details
              ></v-checkbox>
              <v-checkbox
                v-model="printShop"
                label="Ticket atelier"
                hide-details
              ></v-checkbox>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="error"
          text
          @click="closeDialog"
          :disabled="printing"
        >
          Annuler
        </v-btn>
        <v-btn
          color="primary"
          @click="print"
          :loading="printing"
          :disabled="!canPrint"
        >
          Imprimer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { printerService } from '@/services/printer.service'

export default {
  name: 'PrintTicketDialog',
  
  props: {
    repairData: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      dialog: false,
      printing: false,
      printCustomer: true,
      printShop: true
    }
  },

  computed: {
    canPrint() {
      return this.printCustomer || this.printShop
    }
  },

  methods: {
    closeDialog() {
      this.dialog = false
    },

    async print() {
      this.printing = true
      try {
        if (this.printCustomer && this.printShop) {
          await printerService.printBothTickets(this.repairData)
        } else if (this.printCustomer) {
          await printerService.printCustomerTicket(this.repairData)
        } else if (this.printShop) {
          await printerService.printShopTicket(this.repairData)
        }
        this.$emit('print-success')
        this.closeDialog()
      } catch (error) {
        console.error('Erreur d\'impression:', error)
        this.$emit('print-error', error)
      } finally {
        this.printing = false
      }
    }
  }
}
</script>
