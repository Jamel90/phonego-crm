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

async function checkCollections() {
  console.log('Vérification des collections restantes...\n');
  
  // 1. Vérifier repair_issues
  const repairIssues = await db.collection('repair_issues').get();
  console.log('Collection "repair_issues":', repairIssues.size, 'documents');
  if (repairIssues.size > 0) {
    console.log('Exemple de repair_issue:');
    console.log(repairIssues.docs[0].data());
    console.log();
  }
  
  // 2. Vérifier tasks
  const tasks = await db.collection('tasks').get();
  console.log('Collection globale "tasks":', tasks.size, 'documents');
  
  // Vérifier les sous-collections tasks
  const stores = await db.collection('stores').get();
  for (const store of stores.docs) {
    const storeTasks = await db.collection(`stores/${store.id}/tasks`).get();
    console.log(`Store ${store.id} tasks:`, storeTasks.size, 'documents');
    if (storeTasks.size > 0) {
      console.log('Exemple de task:');
      console.log(storeTasks.docs[0].data());
      console.log();
    }
  }
  
  // 3. Vérifier users
  const users = await db.collection('users').get();
  console.log('\nCollection "users":', users.size, 'documents');
  if (users.size > 0) {
    console.log('Exemple d\'utilisateur:');
    console.log(users.docs[0].data());
    console.log();
  }
  
  // Vérifier les sous-collections users dans les stores
  for (const store of stores.docs) {
    const storeUsers = await db.collection(`stores/${store.id}/users`).get();
    console.log(`Store ${store.id} users:`, storeUsers.size, 'documents');
    if (storeUsers.size > 0) {
      console.log('Exemple d\'utilisateur du store:');
      console.log(storeUsers.docs[0].data());
      console.log();
    }
  }
}

checkCollections().catch(console.error);
