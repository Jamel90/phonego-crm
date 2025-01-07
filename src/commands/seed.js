import { seedService } from '../services/seed.service'

export async function seedTestData() {
  console.log('Ajout des données de test...')
  const success = await seedService.seedTestData()
  
  if (success) {
    console.log('✅ Données de test ajoutées avec succès')
  } else {
    console.error('❌ Erreur lors de l\'ajout des données de test')
  }
  
  process.exit(success ? 0 : 1)
}
