const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Mettre à jour les custom claims d'un utilisateur
exports.syncUserClaims = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const afterData = change.after.data();
    const beforeData = change.before.data();

    // Si le document a été supprimé ou les données n'existent pas
    if (!afterData) {
      return null;
    }

    // Si le rôle n'a pas changé, ne rien faire
    if (beforeData && beforeData.role === afterData.role && 
        beforeData.storeId === afterData.storeId) {
      return null;
    }

    // Préparer les custom claims
    const claims = {
      role: afterData.role || 'USER',
      storeId: afterData.storeId || null
    };

    try {
      // Mettre à jour les custom claims
      await admin.auth().setCustomUserClaims(userId, claims);
      console.log(`Custom claims mis à jour pour l'utilisateur ${userId}:`, claims);

      // Mettre à jour le document utilisateur avec un timestamp
      await admin.firestore()
        .collection('users')
        .doc(userId)
        .update({
          claimsUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      return null;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour des claims pour ${userId}:`, error);
      throw error;
    }
  });

// Créer un utilisateur dans Firestore après son inscription
exports.createUserDocument = functions.auth
  .user()
  .onCreate(async (user) => {
    try {
      const userDoc = {
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        role: 'USER',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await admin.firestore()
        .collection('users')
        .doc(user.uid)
        .set(userDoc);

      // Définir les claims par défaut
      await admin.auth().setCustomUserClaims(user.uid, {
        role: 'USER',
        storeId: null
      });

      return null;
    } catch (error) {
      console.error('Erreur lors de la création du document utilisateur:', error);
      throw error;
    }
  });

// Supprimer le document utilisateur lorsque le compte est supprimé
exports.deleteUserDocument = functions.auth
  .user()
  .onDelete(async (user) => {
    try {
      await admin.firestore()
        .collection('users')
        .doc(user.uid)
        .delete();

      return null;
    } catch (error) {
      console.error('Erreur lors de la suppression du document utilisateur:', error);
      throw error;
    }
  });
