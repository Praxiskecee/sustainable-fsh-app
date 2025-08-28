// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDOW2t8PK9pD3jDnm3sMvkRPZCKTLf_WYA",
    authDomain: "wardobeapp.firebaseapp.com",
    projectId: "wardobeapp",
    storageBucket: "wardobeapp.firebasestorage.app",
    messagingSenderId: "643458460104",
    appId: "1:643458460104:web:b29198fee1d3c31d1178fd",
    measurementId: "G-DHMLZS4KS4"
  };

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app); // Firestore can be initialized here or in another module if preferred

export { app, storage, db };
