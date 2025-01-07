const escpos = require('escpos');
escpos.USB = require('escpos-usb');
const admin = require('firebase-admin');
const db = admin.firestore();

class PrinterManagerService {
  constructor() {
    // Map pour stocker les connexions aux imprimantes par magasin
    this.printerConnections = new Map();
  }

  // Récupère la configuration de l'imprimante pour un magasin
  async getPrinterConfig(storeId) {
    try {
      const storeDoc = await db.collection('stores').doc(storeId).get();
      if (!storeDoc.exists) {
        throw new Error('Magasin non trouvé');
      }
      return storeDoc.data().printerConfig || null;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la configuration de l'imprimante pour ${storeId}:`, error);
      throw error;
    }
  }

  // Met à jour la configuration de l'imprimante pour un magasin
  async updatePrinterConfig(storeId, config) {
    try {
      await db.collection('stores').doc(storeId).update({
        printerConfig: config,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la configuration de l'imprimante pour ${storeId}:`, error);
      throw error;
    }
  }

  // Vérifie si une imprimante est disponible pour un magasin
  async isPrinterAvailable(storeId) {
    try {
      const config = await this.getPrinterConfig(storeId);
      if (!config) return false;

      // Vérifie si l'imprimante est connectée
      const devices = escpos.USB.findPrinter();
      return devices.some(device => 
        device.vendorId === config.vendorId && 
        device.productId === config.productId
      );
    } catch (error) {
      console.error(`Erreur lors de la vérification de l'imprimante pour ${storeId}:`, error);
      return false;
    }
  }

  // Obtient une connexion à l'imprimante pour un magasin
  async getPrinterConnection(storeId) {
    try {
      if (!await this.isPrinterAvailable(storeId)) {
        throw new Error('Imprimante non disponible');
      }

      const config = await this.getPrinterConfig(storeId);
      const device = new escpos.USB(config.vendorId, config.productId);
      const printer = new escpos.Printer(device);

      return { device, printer };
    } catch (error) {
      console.error(`Erreur lors de la connexion à l'imprimante pour ${storeId}:`, error);
      throw error;
    }
  }

  // Enregistre un historique d'impression
  async logPrintJob(storeId, data) {
    try {
      await db.collection('stores').doc(storeId)
        .collection('printHistory')
        .add({
          ...data,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
      console.error(`Erreur lors de l'enregistrement de l'historique d'impression pour ${storeId}:`, error);
    }
  }
}

module.exports = new PrinterManagerService();
