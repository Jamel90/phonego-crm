const admin = require('firebase-admin');

// Middleware pour authentifier le magasin
const authenticateStore = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.storeId = decodedToken.storeId;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(401).json({ error: 'Non autorisé' });
  }
};

module.exports = {
  authenticateStore
};
