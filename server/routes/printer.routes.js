const express = require('express');
const router = express.Router();
const printerManager = require('../services/printer-manager.service');
const { authenticateStore } = require('../middleware/auth');

// Middleware pour authentifier le magasin
router.use(authenticateStore);

// Récupérer la configuration de l'imprimante
router.get('/config', async (req, res) => {
  try {
    const config = await printerManager.getPrinterConfig(req.storeId);
    res.json({ config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour la configuration de l'imprimante
router.post('/config', async (req, res) => {
  try {
    await printerManager.updatePrinterConfig(req.storeId, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vérifier la disponibilité de l'imprimante
router.get('/status', async (req, res) => {
  try {
    const available = await printerManager.isPrinterAvailable(req.storeId);
    res.json({ available });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Imprimer un ticket
router.post('/print', async (req, res) => {
  const { type, content } = req.body;
  
  try {
    const { device, printer } = await printerManager.getPrinterConnection(req.storeId);
    
    device.open(async (error) => {
      if (error) {
        return res.status(500).json({ error: 'Erreur lors de l\'ouverture de l\'imprimante' });
      }

      try {
        if (type === 'customer') {
          await printer.printCustomerTicket(content);
        } else {
          await printer.printShopTicket(content);
        }

        // Enregistre l'historique d'impression
        await printerManager.logPrintJob(req.storeId, {
          type,
          content,
          status: 'success'
        });

        printer.close();
        res.json({ success: true });
      } catch (printError) {
        await printerManager.logPrintJob(req.storeId, {
          type,
          content,
          status: 'error',
          error: printError.message
        });
        res.status(500).json({ error: printError.message });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer l'historique des impressions
router.get('/history', async (req, res) => {
  try {
    const history = await printerManager.getPrintHistory(req.storeId);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
