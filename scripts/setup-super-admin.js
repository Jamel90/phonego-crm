import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC4qxWrQ-TLh1ZrqzEiCxHXm8YrgZEjkxY",
  authDomain: "phonego-8c531.firebaseapp.com",
  projectId: "phonego-8c531",
  storageBucket: "phonego-8c531.appspot.com",
  messagingSenderId: "742796371589",
  appId: "1:742796371589:web:5a5e339f4f0b2b1d6b4f0b",
  measurementId: "G-KR0VBYK22Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupSuperAdmin() {
  const adminEmail = 'admin@phonego.fr';
  const adminUid = 'tu95hxcs81g8nkClJ6xsB1irJZr2';

  try {
    console.log('Configuration du super admin...');

    // Créer le document utilisateur pour l'admin
    await setDoc(doc(db, 'users', adminUid), {
      email: adminEmail,
      role: 'super_admin',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }, { merge: true });

    // Créer le store principal
    await setDoc(doc(db, 'stores', adminUid), {
      name: 'PhoneGO',
      owner: adminUid,
      email: adminEmail,
      isMainStore: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }, { merge: true });

    // Créer l'utilisateur dans le store
    await setDoc(doc(db, 'stores', adminUid, 'users', adminUid), {
      email: adminEmail,
      role: 'owner',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }, { merge: true });

    console.log('✅ Super admin configuré avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration du super admin:', error);
  }
}

// Exécuter la configuration
setupSuperAdmin();
