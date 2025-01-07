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

async function checkClients() {
  console.log('Vérification des collections clients...');
  
  // Vérifier la collection globale
  const globalClients = await db.collection('clients').get();
  console.log(`Collection globale 'clients': ${globalClients.size} documents`);
  
  if (globalClients.size > 0) {
    console.log('\nExemple de document:');
    console.log(globalClients.docs[0].data());
  }
  
  // Vérifier la sous-collection du super admin
  const superAdminClients = await db
    .collection('stores/tu95hxcs81g8nkClJ6xsB1irJZr2/clients')
    .get();
  console.log(`\nSous-collection 'stores/superadmin/clients': ${superAdminClients.size} documents`);
  
  if (superAdminClients.size > 0) {
    console.log('\nExemple de document:');
    console.log(superAdminClients.docs[0].data());
  }
}

checkClients().catch(console.error);
