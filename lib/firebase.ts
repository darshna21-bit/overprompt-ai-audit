import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC7keXj4HGSPU9XdtMmnFgEVXH5tta4jKs",
  authDomain: "overprompt-audit.firebaseapp.com",
  projectId: "overprompt-audit",
  storageBucket: "overprompt-audit.firebasestorage.app",
  messagingSenderId: "836293389427",
  appId: "1:836293389427:web:728db80cce1b341f69ce06",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);