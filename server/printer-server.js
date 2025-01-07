const express = require('express');
const cors = require('cors');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

function formatPrice(price) {
  return `${price.toFixed(2)}€`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR');
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('fr-FR');
}

// Liste les imprimantes USB disponibles
function listUSBDevices() {
  try {
    const devices = escpos.USB.findPrinter();
    console.log('Imprimantes USB disponibles:', devices);
    return devices;
  } catch (error) {
    console.error('Erreur lors de la recherche d\'imprimantes:', error);
    return [];
  }
}

function printCustomerTicket(printer, data) {
  try {
    printer
      .font('a')
      .align('ct')
      .style('b')
      .size(1, 1)
      .text('PhoneGo CRM')
      .text('------------------')
      .align('lt')
      .style('normal')
      .size(0, 0)
      .text(`Date: ${formatDate(new Date())}`)
      .text(`Heure: ${formatTime(new Date())}`)
      .text(`N° Réparation: ${data.id}`)
      .text('------------------')
      .text('CLIENT')
      .text(`Nom: ${data.customerName}`)
      .text(`Tel: ${data.customerPhone}`)
      .text('------------------')
      .text('APPAREIL')
      .text(`Marque: ${data.manufacturer}`)
      .text(`Modèle: ${data.model}`)
      .text(`IMEI: ${data.imei}`)
      .text('------------------')
      .text('RÉPARATIONS');
    
    data.repairs.forEach(repair => {
      printer.text(`- ${repair.name}     ${formatPrice(repair.price)}`);
    });

    printer
      .text('------------------')
      .style('b')
      .text(`TOTAL: ${formatPrice(data.totalPrice)}`)
      .style('normal')
      .text('------------------')
      .text(`Temps estimé: ${data.estimatedTime}`)
      .text('------------------')
      .text('Garantie 3 mois')
      .text('Merci de votre confiance!')
      .cut();
  } catch (error) {
    console.error('Erreur lors de l\'impression du ticket client:', error);
    throw error;
  }
}

function printShopTicket(printer, data) {
  try {
    printer
      .font('a')
      .align('ct')
      .style('b')
      .size(1, 1)
      .text('[TICKET ATELIER]')
      .text('------------------')
      .align('lt')
      .style('normal')
      .size(0, 0)
      .text(`N° Réparation: ${data.id}`)
      .text(`Date: ${formatDate(new Date())}`)
      .text('------------------')
      .text('APPAREIL')
      .text(`Marque: ${data.manufacturer}`)
      .text(`Modèle: ${data.model}`)
      .text(`IMEI: ${data.imei}`)
      .text(`Code: ${data.unlockCode || 'N/A'}`)
      .text('------------------')
      .text('INTERVENTIONS');

    data.repairs.forEach(repair => {
      printer
        .text(`□ ${repair.name}`)
        .text(`  Temps: ${repair.estimatedTime}`)
        .text(`  Notes: ${repair.notes || '...'}`);
    });

    printer
      .text('------------------')
      .text('CHECKLIST')
      .text('□ Allumage')
      .text('□ Écran')
      .text('□ Tactile')
      .text('□ Appareil photo')
      .text('□ Son')
      .text('□ Charge')
      .text('------------------')
      .text('Notes techniques:')
      .text(data.technicalNotes || '...')
      .cut();
  } catch (error) {
    console.error('Erreur lors de l\'impression du ticket atelier:', error);
    throw error;
  }
}

// Route pour vérifier les imprimantes disponibles
app.get('/printers', (req, res) => {
  const devices = listUSBDevices();
  res.json({ devices });
});

app.post('/print', async (req, res) => {
  const { content, type } = req.body;
  
  try {
    console.log('Recherche des imprimantes USB...');
    const devices = listUSBDevices();
    
    if (devices.length === 0) {
      throw new Error('Aucune imprimante USB trouvée');
    }

    console.log('Tentative de connexion à l\'imprimante...');
    const device = new escpos.USB();
    const printer = new escpos.Printer(device);

    console.log('Données reçues:', { type, content });

    device.open(function(error) {
      if (error) {
        console.error('Erreur lors de l\'ouverture de l\'imprimante:', error);
        return res.status(500).json({ error: 'Erreur lors de l\'ouverture de l\'imprimante' });
      }

      try {
        if (type === 'customer') {
          printCustomerTicket(printer, content);
        } else {
          printShopTicket(printer, content);
        }
        
        printer.close();
        res.json({ success: true });
      } catch (printError) {
        console.error('Erreur lors de l\'impression:', printError);
        res.status(500).json({ error: printError.message });
      }
    });
  } catch (error) {
    console.error('Erreur serveur:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur d'impression démarré sur le port ${PORT}`);
  console.log('Recherche des imprimantes disponibles...');
  listUSBDevices();
});
