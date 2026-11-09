import { createFileRepository } from './fileRepository.js'
import { createFirestoreRepository, firebaseConfigured } from './firestoreRepository.js'

export async function createRepository() {
  const requested = (process.env.DATA_BACKEND ?? 'auto').toLowerCase()

  if (requested === 'firestore') {
    if (!firebaseConfigured()) {
      throw new Error(
        'DATA_BACKEND=firestore requiere FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.',
      )
    }
    return createFirestoreRepository()
  }

  if (requested === 'file') {
    return createFileRepository()
  }

  if (firebaseConfigured()) {
    try {
      return await createFirestoreRepository()
    } catch (error) {
      console.warn(
        `No se pudo conectar a Firestore; se usará almacenamiento local. ${error.message}`,
      )
    }
  }

  return createFileRepository()
}
