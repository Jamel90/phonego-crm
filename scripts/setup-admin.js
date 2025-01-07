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

async function setupSuperAdmin() {
  const adminEmail = 'admin@phonego.fr';
  const adminUid = 'admin'; // Identifiant unique pour l'admin

  try {
    console.log('Configuration du super admin...');

    // Créer ou mettre à jour le document utilisateur pour l'admin
    await db.doc(`users/${adminUid}`).set({
      email: adminEmail,
      role: 'super_admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Créer le store principal PhoneGO
    await db.doc(`stores/${adminUid}`).set({
      name: 'PhoneGO',
      owner: adminUid,
      email: adminEmail,
      isMainStore: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Créer l'utilisateur dans le store
    await db.doc(`stores/${adminUid}/users/${adminUid}`).set({
      email: adminEmail,
      role: 'owner',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Super admin configuré avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la configuration du super admin:', error);
    process.exit(1);
  }
}

// Exécuter la configuration
setupSuperAdmin();
