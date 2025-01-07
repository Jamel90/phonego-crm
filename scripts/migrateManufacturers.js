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

async function migrateManufacturers() {
  try {
    console.log('Starting manufacturers migration...')
    
    // 1. Récupérer tous les stores
    console.log('Fetching stores...')
    const storesSnapshot = await db.collection('stores').get()
    const stores = storesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    console.log(`Found ${stores.length} stores`)

    // 2. Récupérer tous les fabricants
    console.log('Fetching manufacturers...')
    const manufacturersSnapshot = await db.collection('manufacturers').get()
    const manufacturers = manufacturersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    console.log(`Found ${manufacturers.length} manufacturers to migrate`)

    // Statistiques de migration
    const stats = {
      total: stores.length * manufacturers.length,
      success: 0,
      failed: 0,
      stores: {}
    }

    // 3. Pour chaque store, créer les fabricants dans sa sous-collection
    for (const store of stores) {
      console.log(`\nProcessing store: ${store.name} (${store.id})`)
      stats.stores[store.id] = { success: 0, failed: 0 }
      
      try {
        // Vérifier si les fabricants existent déjà
        const existingManufacturers = await db.collection(`stores/${store.id}/manufacturers`).get()
        if (!existingManufacturers.empty) {
          console.log(`⚠️ Store ${store.name} already has ${existingManufacturers.size} manufacturers. Skipping...`)
          continue
        }

        const batch = db.batch()
        for (const manufacturer of manufacturers) {
          try {
            // Valider les données du fabricant
            if (!manufacturer.name) {
              throw new Error('Manufacturer name is required')
            }

            const newManufacturerRef = db.collection(`stores/${store.id}/manufacturers`).doc(manufacturer.id)
            batch.set(newManufacturerRef, {
              ...manufacturer,
              migratedAt: FieldValue.serverTimestamp(),
              storeId: store.id
            })
            stats.stores[store.id].success++
            stats.success++
          } catch (error) {
            console.error(`Failed to process manufacturer ${manufacturer.id} for store ${store.name}:`, error.message)
            stats.stores[store.id].failed++
            stats.failed++
          }
        }
        
        await batch.commit()
        console.log(`✅ Successfully migrated manufacturers to store ${store.name}`)
      } catch (error) {
        console.error(`❌ Failed to migrate manufacturers for store ${store.name}:`, error.message)
        stats.stores[store.id].failed += manufacturers.length
        stats.failed += manufacturers.length
      }
    }

    // Afficher les statistiques finales
    console.log('\n📊 Migration Statistics:')
    console.log(`Total operations: ${stats.total}`)
    console.log(`Successful: ${stats.success}`)
    console.log(`Failed: ${stats.failed}`)
    console.log('\nStore details:')
    for (const [storeId, storeStats] of Object.entries(stats.stores)) {
      const store = stores.find(s => s.id === storeId)
      console.log(`${store.name}: ${storeStats.success} successful, ${storeStats.failed} failed`)
    }

    console.log('\nMigration completed successfully!')
  } catch (error) {
    console.error('Error during migration:', error)
    throw error
  }
}

// Exécuter la migration
try {
  await migrateManufacturers()
  console.log('Migration script finished')
  process.exit(0)
} catch (error) {
  console.error('Migration script failed:', error)
  process.exit(1)
}
