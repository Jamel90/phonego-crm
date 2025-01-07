import { auth } from '@/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'

const handleAuthError = (error) => {
  if (error.code === 'auth/network-request-failed') {
    throw new Error('Problème de connexion internet. Veuillez vérifier votre connexion et réessayer.')
  } else if (error.code === 'auth/user-not-found') {
    throw new Error('Email ou mot de passe incorrect.')
  } else if (error.code === 'auth/wrong-password') {
    throw new Error('Email ou mot de passe incorrect.')
  } else if (error.code === 'auth/too-many-requests') {
    throw new Error('Trop de tentatives de connexion. Veuillez réessayer plus tard.')
  } else if (error.code === 'auth/invalid-email') {
    throw new Error('Adresse email invalide.')
  } else {
    throw new Error('Une erreur est survenue. Veuillez réessayer.')
  }
}

export const authService = {
  async login(email, password) {
    try {
      if (!navigator.onLine) {
        throw new Error('Pas de connexion internet. Veuillez vérifier votre connexion et réessayer.')
      }
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error) {
      console.error('Login error:', error)
      handleAuthError(error)
    }
  },

  async register(email, password) {
    try {
      if (!navigator.onLine) {
        throw new Error('Pas de connexion internet. Veuillez vérifier votre connexion et réessayer.')
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error) {
      console.error('Registration error:', error)
      handleAuthError(error)
    }
  },

  async logout() {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Logout error:', error)
      throw new Error('Erreur lors de la déconnexion. Veuillez réessayer.')
    }
  },

  getCurrentUser() {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth,
        (user) => {
          unsubscribe()
          resolve(user)
        },
        (error) => {
          unsubscribe()
          reject(error)
        }
      )
    })
  }
}
