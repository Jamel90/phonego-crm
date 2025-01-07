import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';

// Lire le fichier de configuration
const serviceAccount = JSON.parse(
  await readFile(new URL('../service-Account.json', import.meta.url))
);

// Initialiser Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkAllClientsCollections() {
  console.log('Vérification de toutes les collections de clients...\n');
  
  // 1. Vérifier la collection globale 'clients'
  const globalClients = await db.collection('clients').get();
  console.log('Collection globale "clients":', globalClients.size, 'documents');
  
  // 2. Vérifier la collection 'customers'
  const customers = await db.collection('customers').get();
  console.log('Collection "customers":', customers.size, 'documents');
  
  // 3. Vérifier tous les stores et leurs sous-collections clients
  const stores = await db.collection('stores').get();
  console.log('\nStores trouvés:', stores.size);
  
  for (const store of stores.docs) {
    const storeClients = await db.collection(`stores/${store.id}/customers`).get();
    console.log(`\nStore ${store.id}:`);
    console.log('- Nom:', store.data().name || 'Non défini');
    console.log('- Nombre de clients:', storeClients.size);
    
    if (storeClients.size > 0) {
      console.log('\nExemple de client:');
      console.log(storeClients.docs[0].data());
    }
  }
}

checkAllClientsCollections().catch(console.error);
