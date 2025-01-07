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

async function setupSuperAdmin() {
  const adminEmail = 'admin@phonego.fr';
  const adminUid = 'tu95hxcs81g8nkClJ6xsB1irJZr2';

  try {
    console.log('Configuration du super admin...');

    // Créer le document utilisateur pour l'admin
    await db.doc(`users/${adminUid}`).set({
      email: adminEmail,
      role: 'super_admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Créer le store principal
    await db.doc(`stores/${adminUid}`).set({
      name: 'PhoneGO',
      owner: adminUid,
      email: adminEmail,
      isMainStore: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Créer l'utilisateur dans le store
    await db.doc(`stores/${adminUid}/users/${adminUid}`).set({
      email: adminEmail,
      role: 'owner',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('✅ Super admin configuré avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la configuration du super admin:', error);
    process.exit(1);
  }
}

// Exécuter la configuration
setupSuperAdmin();
