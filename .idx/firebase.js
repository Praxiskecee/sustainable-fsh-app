
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your web app's Firebase configuration
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

// Get the Firestore instance and export it
export const db = getFirestore(app);
