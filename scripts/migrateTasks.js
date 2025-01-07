import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';

// Lire le fichier de configuration
const serviceAccount = JSON.parse(
  await readFile(new URL('../service-Account.json', import.meta.url))
);

// Initialiser Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const SUPER_ADMIN_STORE_ID = 'tu95hxcs81g8nkClJ6xsB1irJZr2'; // ID du store du super admin

async function migrateTasks() {
  try {
    console.log('Démarrage de la migration des tâches...');
    
    // 1. Récupérer toutes les tâches de la collection globale
    console.log('Récupération des tâches existantes...');
    const tasksSnapshot = await db.collection('tasks').get();
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Trouvé ${tasks.length} tâches à migrer`);

    // Statistiques de migration
    const stats = {
      total: tasks.length,
      success: 0,
      failed: 0,
      skipped: 0
    };

    // 2. Vérifier si les tâches existent déjà dans la sous-collection
    console.log(`\nVérification de la sous-collection du super admin (${SUPER_ADMIN_STORE_ID})`);
    const existingTasksSnapshot = await db
      .collection(`stores/${SUPER_ADMIN_STORE_ID}/tasks`)
      .get();

    if (!existingTasksSnapshot.empty) {
      console.log(`⚠️ ${existingTasksSnapshot.size} tâches déjà présentes dans la sous-collection`);
      console.log('Migration annulée pour éviter les doublons');
      return;
    }

    // 3. Migrer les tâches par lots de 500 (limite de Firestore)
    const batchSize = 500;
    let batch = db.batch();
    let operationCount = 0;

    for (const task of tasks) {
      try {
        // Vérifier les données requises
        if (!task.title) {
          console.warn(`⚠️ Tâche ${task.id} ignorée: titre manquant`);
          stats.skipped++;
          continue;
        }

        // Normaliser les données de la tâche
        const normalizedTask = {
          title: task.title,
          description: task.description || '',
          status: task.status || 'pending',
          priority: task.priority || 'normal',
          assignedTo: task.assignedTo || null,
          dueDate: task.dueDate || null,
          storeId: SUPER_ADMIN_STORE_ID,
          createdAt: task.createdAt || new Date(),
          updatedAt: task.updatedAt || new Date(),
          migratedAt: new Date()
        };

        const newTaskRef = db
          .collection(`stores/${SUPER_ADMIN_STORE_ID}/tasks`)
          .doc(task.id);

        batch.set(newTaskRef, normalizedTask);

        operationCount++;
        stats.success++;

        // Commiter le batch quand il atteint la limite
        if (operationCount === batchSize) {
          await batch.commit();
          console.log(`✅ Lot de ${operationCount} tâches migré avec succès`);
          batch = db.batch();
          operationCount = 0;
        }
      } catch (error) {
        console.error(`❌ Échec de migration pour la tâche ${task.id}:`, error.message);
        stats.failed++;
      }
    }

    // Commiter le dernier batch s'il reste des opérations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`✅ Dernier lot de ${operationCount} tâches migré avec succès`);
    }

    // Afficher les statistiques finales
    console.log('\n📊 Statistiques de Migration:');
    console.log('Total des tâches:', stats.total);
    console.log('Réussis:', stats.success);
    console.log('Échoués:', stats.failed);
    console.log('Ignorés:', stats.skipped);

    if (stats.failed === 0 && stats.skipped === 0) {
      console.log('\nMigration terminée avec succès!');
    } else {
      console.log('\nMigration terminée avec des avertissements.');
    }
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    throw error;
  }
}

// Exécuter la migration
try {
  await migrateTasks();
  console.log('Script de migration terminé');
} catch (error) {
  console.error('Erreur lors de l\'exécution du script:', error);
  process.exit(1);
}
