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

async function checkAdmin() {
  const adminUid = 'tu95hxcs81g8nkClJ6xsB1irJZr2';

  try {
    console.log('Vérification du compte admin...');

    // Vérifier le document utilisateur
    const userDoc = await db.doc(`users/${adminUid}`).get();
    console.log('\nDocument utilisateur:');
    console.log(userDoc.exists ? userDoc.data() : 'Non trouvé');

    // Vérifier le document du store
    const storeDoc = await db.doc(`stores/${adminUid}`).get();
    console.log('\nDocument store:');
    console.log(storeDoc.exists ? storeDoc.data() : 'Non trouvé');

    // Vérifier l'utilisateur dans le store
    const storeUserDoc = await db.doc(`stores/${adminUid}/users/${adminUid}`).get();
    console.log('\nDocument utilisateur dans le store:');
    console.log(storeUserDoc.exists ? storeUserDoc.data() : 'Non trouvé');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

// Exécuter la vérification
checkAdmin();
