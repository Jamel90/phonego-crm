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

async function verifyAndCreateStore() {
  const adminUid = 'tu95hxcs81g8nkClJ6xsB1irJZr2';

  try {
    console.log('=== Vérification et création du store ===\n');

    // 1. Vérifier le document du store
    console.log('1. Vérification du store:');
    const storeRef = db.doc(`stores/${adminUid}`);
    const storeDoc = await storeRef.get();

    if (!storeDoc.exists) {
      console.log('Store non trouvé, création...');
      
      // Créer le store
      await storeRef.set({
        name: 'PhoneGO',
        owner: adminUid,
        email: 'admin@phonego.fr',
        isMainStore: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Créer l'utilisateur dans le store
      await db.doc(`stores/${adminUid}/users/${adminUid}`).set({
        email: 'admin@phonego.fr',
        role: 'owner',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('✅ Store et utilisateur créés avec succès');
    } else {
      console.log('✅ Store existant:', storeDoc.data());
      
      // Vérifier l'utilisateur dans le store
      const storeUserDoc = await db.doc(`stores/${adminUid}/users/${adminUid}`).get();
      if (!storeUserDoc.exists) {
        console.log('Utilisateur non trouvé dans le store, création...');
        await db.doc(`stores/${adminUid}/users/${adminUid}`).set({
          email: 'admin@phonego.fr',
          role: 'owner',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Utilisateur créé dans le store');
      } else {
        console.log('✅ Utilisateur existant dans le store:', storeUserDoc.data());
      }
    }

    // 2. Vérifier les permissions
    console.log('\n2. Test de lecture:');
    const testRead = await storeRef.get();
    console.log('✅ Lecture réussie:', testRead.exists);

    console.log('\n=== Vérification terminée ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter la vérification
verifyAndCreateStore();
