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
const auth = admin.auth();

async function testAuth() {
  const adminEmail = 'admin@phonego.fr';
  const adminUid = 'tu95hxcs81g8nkClJ6xsB1irJZr2';

  try {
    console.log('=== Test d\'authentification ===\n');

    // 1. Vérifier l'utilisateur dans Auth
    console.log('1. Vérification de l\'utilisateur dans Auth:');
    const userRecord = await auth.getUser(adminUid);
    console.log('✅ Utilisateur trouvé:', {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled
    });

    // 2. Vérifier les custom claims
    console.log('\n2. Custom claims:');
    console.log(userRecord.customClaims || 'Aucun custom claim');

    // 3. Vérifier le document utilisateur dans Firestore
    console.log('\n3. Document utilisateur dans Firestore:');
    const userDoc = await db.doc(`users/${adminUid}`).get();
    if (userDoc.exists) {
      console.log('✅ Document trouvé:', userDoc.data());
    } else {
      console.log('❌ Document non trouvé');
    }

    // 4. Vérifier le document du store
    console.log('\n4. Document store dans Firestore:');
    const storeDoc = await db.doc(`stores/${adminUid}`).get();
    if (storeDoc.exists) {
      console.log('✅ Document trouvé:', storeDoc.data());
    } else {
      console.log('❌ Document non trouvé');
    }

    // 5. Ajouter des custom claims pour le super admin
    console.log('\n5. Ajout des custom claims:');
    await auth.setCustomUserClaims(adminUid, {
      role: 'super_admin',
      storeId: adminUid
    });
    console.log('✅ Custom claims ajoutés');

    console.log('\n=== Test terminé ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter le test
testAuth();
