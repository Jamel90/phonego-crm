import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lire le fichier service-account.json
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../service-account.json'), 'utf8')
);

// Initialiser Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function migrateToStores() {
  console.log('Starting migration to stores structure...');

  try {
    // 1. Get all users
    const usersSnapshot = await db.collection('users').get();
    const batch = db.batch();
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Create a new store for each user
      const storeId = userDoc.id; // Using user ID as store ID for simplicity
      const storeRef = db.collection('stores').doc(storeId);
      
      // Create store document
      batch.set(storeRef, {
        name: `${userData.email}'s Store`,
        owner: userDoc.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Update user with storeId and role
      batch.update(userDoc.ref, {
        storeId,
        role: userData.role === 'admin' ? 'owner' : 'staff',
        updatedAt: new Date()
      });
      
      // Create store user document
      const storeUserRef = storeRef.collection('users').doc(userDoc.id);
      batch.set(storeUserRef, {
        email: userData.email,
        role: userData.role === 'admin' ? 'owner' : 'staff',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // 2. Migrate inventory items
    const inventorySnapshot = await db.collection('inventory').get();
    for (const itemDoc of inventorySnapshot.docs) {
      const itemData = itemDoc.data();
      const createdBy = itemData.createdBy || usersSnapshot.docs[0].id;
      const userDoc = usersSnapshot.docs.find(doc => doc.id === createdBy);
      
      if (userDoc) {
        const storeId = userDoc.id;
        const newItemRef = db.collection('stores').doc(storeId).collection('inventory').doc(itemDoc.id);
        batch.set(newItemRef, {
          ...itemData,
          updatedAt: new Date()
        });
      }
    }
    
    // 3. Migrate repairs
    const repairsSnapshot = await db.collection('repairs').get();
    for (const repairDoc of repairsSnapshot.docs) {
      const repairData = repairDoc.data();
      const createdBy = repairData.createdBy || usersSnapshot.docs[0].id;
      const userDoc = usersSnapshot.docs.find(doc => doc.id === createdBy);
      
      if (userDoc) {
        const storeId = userDoc.id;
        const newRepairRef = db.collection('stores').doc(storeId).collection('repairs').doc(repairDoc.id);
        batch.set(newRepairRef, {
          ...repairData,
          updatedAt: new Date()
        });
      }
    }
    
    // 4. Migrate customers
    const customersSnapshot = await db.collection('customers').get();
    for (const customerDoc of customersSnapshot.docs) {
      const customerData = customerDoc.data();
      const createdBy = customerData.createdBy || usersSnapshot.docs[0].id;
      const userDoc = usersSnapshot.docs.find(doc => doc.id === createdBy);
      
      if (userDoc) {
        const storeId = userDoc.id;
        const newCustomerRef = db.collection('stores').doc(storeId).collection('customers').doc(customerDoc.id);
        batch.set(newCustomerRef, {
          ...customerData,
          updatedAt: new Date()
        });
      }
    }
    
    // Commit all changes
    await batch.commit();
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Run migration
migrateToStores().then(() => {
  console.log('Migration script completed');
  process.exit(0);
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
