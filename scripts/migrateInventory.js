import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { readFile } from 'fs/promises'

// Lire le fichier de configuration
const serviceAccount = JSON.parse(
  await readFile(new URL('../service-Account.json', import.meta.url))
)

// Initialiser Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore()

const SUPER_ADMIN_STORE_ID = 'tu95hxcs81g8nkClJ6xsB1irJZr2' // ID du store du super admin

async function migrateInventory() {
  try {
    console.log('Démarrage de la migration de l\'inventaire...')
    
    // 1. Récupérer tous les items de la collection globale
    console.log('Récupération des items existants...')
    const itemsSnapshot = await db.collection('inventory').get()
    const items = itemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    console.log(`Trouvé ${items.length} items à migrer`)

    // Statistiques de migration
    const stats = {
      total: items.length,
      success: 0,
      failed: 0,
      skipped: 0
    }

    // 2. Vérifier si les items existent déjà dans la sous-collection
    console.log(`\nVérification de la sous-collection du super admin (${SUPER_ADMIN_STORE_ID})`)
    const existingItemsSnapshot = await db
      .collection(`stores/${SUPER_ADMIN_STORE_ID}/inventory`)
      .get()

    if (!existingItemsSnapshot.empty) {
      console.log(`⚠️ ${existingItemsSnapshot.size} items déjà présents dans la sous-collection`)
      console.log('Migration annulée pour éviter les doublons')
      return
    }

    // 3. Migrer les items par lots de 500 (limite de Firestore)
    const batchSize = 500
    let batch = db.batch()
    let operationCount = 0

    for (const item of items) {
      try {
        // Vérifier les données requises
        if (!item.name) {
          console.warn(`⚠️ Item ${item.id} ignoré: nom manquant`)
          stats.skipped++
          continue
        }

        // Normaliser les données de l'item
        const normalizedItem = {
          name: item.name,
          description: item.description || '',
          quantity: item.quantity || 0,
          minQuantity: item.minQuantity || 5,
          price: item.price || 0,
          cost: item.cost || 0,
          category: item.category || 'autre',
          manufacturer: {
            name: item.manufacturer?.name || item.manufacturerName || '',
            id: item.manufacturer?.id || item.manufacturerId || null
          },
          sku: item.sku || '',
          location: item.location || '',
          storeId: SUPER_ADMIN_STORE_ID,
          createdAt: item.createdAt || FieldValue.serverTimestamp(),
          updatedAt: item.updatedAt || FieldValue.serverTimestamp(),
          migratedAt: FieldValue.serverTimestamp()
        }

        const newItemRef = db
          .collection(`stores/${SUPER_ADMIN_STORE_ID}/inventory`)
          .doc(item.id)

        batch.set(newItemRef, normalizedItem)

        operationCount++
        stats.success++

        // Commiter le batch quand il atteint la limite
        if (operationCount === batchSize) {
          await batch.commit()
          console.log(`✅ Lot de ${operationCount} items migré avec succès`)
          batch = db.batch()
          operationCount = 0
        }
      } catch (error) {
        console.error(`❌ Échec de migration pour l'item ${item.id}:`, error.message)
        stats.failed++
      }
    }

    // Commiter le dernier batch s'il reste des opérations
    if (operationCount > 0) {
      await batch.commit()
      console.log(`✅ Dernier lot de ${operationCount} items migré avec succès`)
    }

    // Afficher les statistiques finales
    console.log('\n📊 Statistiques de Migration:')
    console.log(`Total des items: ${stats.total}`)
    console.log(`Réussis: ${stats.success}`)
    console.log(`Échoués: ${stats.failed}`)
    console.log(`Ignorés: ${stats.skipped}`)

    console.log('\nMigration terminée avec succès!')
  } catch (error) {
    console.error('Erreur pendant la migration:', error)
    throw error
  }
}

// Exécuter la migration
try {
  await migrateInventory()
  console.log('Script de migration terminé')
  process.exit(0)
} catch (error) {
  console.error('Échec du script de migration:', error)
  process.exit(1)
}
