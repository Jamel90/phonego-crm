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

async function migrateRepairs() {
  try {
    console.log('Démarrage de la migration des réparations...')
    
    // 1. Récupérer toutes les réparations de la collection globale
    console.log('Récupération des réparations existantes...')
    const repairsSnapshot = await db.collection('repairs').get()
    const repairs = repairsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    console.log(`Trouvé ${repairs.length} réparations à migrer`)

    // Statistiques de migration
    const stats = {
      total: repairs.length,
      success: 0,
      failed: 0,
      skipped: 0
    }

    // 2. Vérifier si les réparations existent déjà dans la sous-collection
    console.log(`\nVérification de la sous-collection du super admin (${SUPER_ADMIN_STORE_ID})`)
    const existingRepairsSnapshot = await db
      .collection(`stores/${SUPER_ADMIN_STORE_ID}/repairs`)
      .get()

    if (!existingRepairsSnapshot.empty) {
      console.log(`⚠️ ${existingRepairsSnapshot.size} réparations déjà présentes dans la sous-collection`)
      console.log('Migration annulée pour éviter les doublons')
      return
    }

    // 3. Migrer les réparations par lots de 500 (limite de Firestore)
    const batchSize = 500
    let batch = db.batch()
    let operationCount = 0

    for (const repair of repairs) {
      try {
        // Vérifier les données requises
        if (!repair.customer?.name && !repair.clientName) {
          console.warn(`⚠️ Réparation ${repair.id} ignorée: nom du client manquant`)
          stats.skipped++
          continue
        }

        // Normaliser les données de la réparation
        const normalizedRepair = {
          ...repair,
          customer: {
            name: repair.customer?.name || repair.clientName || 'Client inconnu',
            phone: repair.customer?.phone || repair.clientPhone || '',
            email: repair.customer?.email || repair.clientEmail || ''
          },
          manufacturer: {
            name: repair.manufacturer?.name || repair.manufacturerName || '',
            id: repair.manufacturer?.id || repair.manufacturerId || null
          },
          status: repair.status || 'en_attente',
          model: repair.model || '',
          serialNumber: repair.serialNumber || '',
          description: repair.description || '',
          diagnosis: repair.diagnosis || '',
          solution: repair.solution || '',
          price: repair.price || 0,
          cost: repair.cost || 0,
          storeId: SUPER_ADMIN_STORE_ID,
          createdAt: repair.createdAt || FieldValue.serverTimestamp(),
          updatedAt: repair.updatedAt || FieldValue.serverTimestamp(),
          migratedAt: FieldValue.serverTimestamp()
        }

        const newRepairRef = db
          .collection(`stores/${SUPER_ADMIN_STORE_ID}/repairs`)
          .doc(repair.id)

        batch.set(newRepairRef, normalizedRepair)

        operationCount++
        stats.success++

        // Commiter le batch quand il atteint la limite
        if (operationCount === batchSize) {
          await batch.commit()
          console.log(`✅ Lot de ${operationCount} réparations migré avec succès`)
          batch = db.batch()
          operationCount = 0
        }
      } catch (error) {
        console.error(`❌ Échec de migration pour la réparation ${repair.id}:`, error.message)
        stats.failed++
      }
    }

    // Commiter le dernier batch s'il reste des opérations
    if (operationCount > 0) {
      await batch.commit()
      console.log(`✅ Dernier lot de ${operationCount} réparations migré avec succès`)
    }

    // Afficher les statistiques finales
    console.log('\n📊 Statistiques de Migration:')
    console.log(`Total des réparations: ${stats.total}`)
    console.log(`Réussies: ${stats.success}`)
    console.log(`Échouées: ${stats.failed}`)
    console.log(`Ignorées: ${stats.skipped}`)

    console.log('\nMigration terminée avec succès!')
  } catch (error) {
    console.error('Erreur pendant la migration:', error)
    throw error
  }
}

// Exécuter la migration
try {
  await migrateRepairs()
  console.log('Script de migration terminé')
  process.exit(0)
} catch (error) {
  console.error('Échec du script de migration:', error)
  process.exit(1)
}
