import admin from 'firebase-admin';
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
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verifyData() {
  const adminUid = 'tu95hxcs81g8nkClJ6xsB1irJZr2';

  try {
    console.log('=== Vérification des données ===\n');

    // 1. Vérifier le document utilisateur
    console.log('1. Document utilisateur:');
    const userDoc = await db.doc(`users/${adminUid}`).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('✅ Document trouvé:');
      console.log(JSON.stringify(userData, null, 2));
    } else {
      console.log('❌ Document non trouvé');
    }

    // 2. Vérifier le document du store
    console.log('\n2. Document store:');
    const storeDoc = await db.doc(`stores/${adminUid}`).get();
    if (storeDoc.exists) {
      const storeData = storeDoc.data();
      console.log('✅ Document trouvé:');
      console.log(JSON.stringify(storeData, null, 2));
    } else {
      console.log('❌ Document non trouvé');
      
      // Créer le store s'il n'existe pas
      console.log('\nCréation du store...');
      await db.doc(`stores/${adminUid}`).set({
        name: 'PhoneGO',
        owner: adminUid,
        email: 'admin@phonego.fr',
        isMainStore: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Store créé avec succès');
    }

    // 3. Vérifier l'utilisateur dans le store
    console.log('\n3. Document utilisateur dans le store:');
    const storeUserDoc = await db.doc(`stores/${adminUid}/users/${adminUid}`).get();
    if (storeUserDoc.exists) {
      const storeUserData = storeUserDoc.data();
      console.log('✅ Document trouvé:');
      console.log(JSON.stringify(storeUserData, null, 2));
    } else {
      console.log('❌ Document non trouvé');
      
      // Créer l'utilisateur dans le store s'il n'existe pas
      console.log('\nCréation de l\'utilisateur dans le store...');
      await db.doc(`stores/${adminUid}/users/${adminUid}`).set({
        email: 'admin@phonego.fr',
        role: 'owner',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Utilisateur créé dans le store avec succès');
    }

    console.log('\n=== Vérification terminée ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

// Exécuter la vérification
verifyData();
