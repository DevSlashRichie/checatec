import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALAkb4ueaRlqKo4lPzLextBmpoYaR8Xv0",
  authDomain: "checatec-3383a.firebaseapp.com",
  projectId: "checatec-3383a",
  storageBucket: "checatec-3383a.firebasestorage.app",
  messagingSenderId: "108732590249",
  appId: "1:108732590249:web:fd2dc22775f90e010461b8",
  measurementId: "G-162VWT03R5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);