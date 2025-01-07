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

async function migrateClients() {
  try {
    console.log('Démarrage de la migration des clients...')
    
    // 1. Récupérer tous les clients de la collection globale
    console.log('Récupération des clients existants...')
    const clientsSnapshot = await db.collection('customers').get()
    const clients = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    console.log(`Trouvé ${clients.length} clients à migrer`)

    // Statistiques de migration
    const stats = {
      total: clients.length,
      success: 0,
      failed: 0,
      skipped: 0
    }

    // 2. Vérifier si les clients existent déjà dans la sous-collection
    console.log(`\nVérification de la sous-collection du super admin (${SUPER_ADMIN_STORE_ID})`)
    const existingClientsSnapshot = await db
      .collection(`stores/${SUPER_ADMIN_STORE_ID}/customers`)
      .get()

    if (!existingClientsSnapshot.empty) {
      console.log(`⚠️ ${existingClientsSnapshot.size} clients déjà présents dans la sous-collection`)
      console.log('Migration annulée pour éviter les doublons')
      return
    }

    // 3. Migrer les clients par lots de 500 (limite de Firestore)
    const batchSize = 500
    let batch = db.batch()
    let operationCount = 0

    for (const client of clients) {
      try {
        // Vérifier les données requises
        if (!client.name && !client.email && !client.phone) {
          console.warn(`⚠️ Client ${client.id} ignoré: aucune donnée d'identification`)
          stats.skipped++
          continue
        }

        // Normaliser les données du client
        const normalizedClient = {
          name: client.name || 'Client inconnu',
          email: client.email || '',
          phone: client.phone || '',
          source: client.source || 'autre',
          address: {
            street: client.address?.street || '',
            city: client.address?.city || '',
            postalCode: client.address?.postalCode || ''
          },
          notes: client.notes || '',
          storeId: SUPER_ADMIN_STORE_ID,
          createdAt: client.createdAt || FieldValue.serverTimestamp(),
          updatedAt: client.updatedAt || FieldValue.serverTimestamp(),
          migratedAt: FieldValue.serverTimestamp()
        }

        const newClientRef = db
          .collection(`stores/${SUPER_ADMIN_STORE_ID}/customers`)
          .doc(client.id)

        batch.set(newClientRef, normalizedClient)

        operationCount++
        stats.success++

        // Commiter le batch quand il atteint la limite
        if (operationCount === batchSize) {
          await batch.commit()
          console.log(`✅ Lot de ${operationCount} clients migré avec succès`)
          batch = db.batch()
          operationCount = 0
        }
      } catch (error) {
        console.error(`❌ Échec de migration pour le client ${client.id}:`, error.message)
        stats.failed++
      }
    }

    // Commiter le dernier batch s'il reste des opérations
    if (operationCount > 0) {
      await batch.commit()
      console.log(`✅ Dernier lot de ${operationCount} clients migré avec succès`)
    }

    // Afficher les statistiques finales
    console.log('\n📊 Statistiques de Migration:')
    console.log(`Total des clients: ${stats.total}`)
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
  await migrateClients()
  console.log('Script de migration terminé')
  process.exit(0)
} catch (error) {
  console.error('Échec du script de migration:', error)
  process.exit(1)
}
