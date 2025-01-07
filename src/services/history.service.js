import { db, storage } from '@/firebase'
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

class HistoryService {
  constructor() {
    this.historyCollection = collection(db, 'history')
    this.documentsCollection = collection(db, 'documents')
  }

  // Enregistre une modification dans l'historique
  async logChange(params) {
    const { type, itemId, itemType, changes, userId, userName } = params
    
    const historyEntry = {
      type, // 'create', 'update', 'delete', 'status_change', etc.
      itemId,
      itemType, // 'repair', 'client', etc.
      changes,
      userId,
      userName,
      timestamp: Timestamp.now()
    }

    return await addDoc(this.historyCollection, historyEntry)
  }

  // Récupère l'historique d'un élément
  async getHistory(itemId, itemType) {
    const q = query(
      this.historyCollection,
      where('itemId', '==', itemId),
      where('itemType', '==', itemType),
      orderBy('timestamp', 'desc')
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  // Upload un document ou une photo
  async uploadFile(file, path) {
    const storageRef = ref(storage, `${path}/${file.name}`)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)

    return {
      name: file.name,
      path: snapshot.ref.fullPath,
      url: downloadURL,
      type: file.type,
      size: file.size,
      uploadedAt: Timestamp.now()
    }
  }

  // Enregistre les métadonnées du document dans Firestore
  async saveDocument(params) {
    const { fileInfo, itemId, itemType, userId, userName } = params

    const docEntry = {
      ...fileInfo,
      itemId,
      itemType,
      userId,
      userName,
      createdAt: Timestamp.now()
    }

    return await addDoc(this.documentsCollection, docEntry)
  }

  // Récupère les documents liés à un élément
  async getDocuments(itemId, itemType) {
    const q = query(
      this.documentsCollection,
      where('itemId', '==', itemId),
      where('itemType', '==', itemType),
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }
}

export const historyService = new HistoryService()
