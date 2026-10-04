import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  onSnapshot 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCdbqrN9hRhSKiBTUVjTcuGcgsBXMedjNY",
  authDomain: "psicologiaveganaarg.firebaseapp.com",
  projectId: "psicologiaveganaarg",
  storageBucket: "psicologiaveganaarg.firebasestorage.app",
  messagingSenderId: "42654132231",
  appId: "1:42654132231:web:132953d04f7da6bf64e2a2",
  measurementId: "G-DHKJW1Y4Y7"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  onSnapshot
};
