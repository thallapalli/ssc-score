import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRb7EQC5AtP75IFqDDHWU4A2SVtKTJd8E",
  authDomain: "ssc-score.firebaseapp.com",
  projectId: "ssc-score",
  storageBucket: "ssc-score.firebasestorage.app",
  messagingSenderId: "983071904664",
  appId: "1:983071904664:web:52965d25c8cd827263d1ed",
  measurementId: "G-X2VCRG9902"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// మనకి డేటాబేస్ ముఖ్యం కాబట్టి Firestore ని ఎగుమతి (export) చేస్తున్నాం
export const db = getFirestore(app);
