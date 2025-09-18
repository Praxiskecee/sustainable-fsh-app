import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// Import a modular Auth functions
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDOW2t8PK9pD3jDnm3sMvkRPZCKTLf_WYA",
  authDomain: "wardobeapp.firebaseapp.com",
  projectId: "wardobeapp",
  storageBucket: "wardobeapp.firebasestorage.app",
  messagingSenderId: "643458460104",
  appId: "1:643458460104:web:b29198fee1d3c31d1178fd",
  measurementId: "G-DHMLZS4KS4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get instances and export them
export const db = getFirestore(app);
export const auth = getAuth(app);

// Export the specific functions we will use
export { 
  onAuthStateChanged, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut
};