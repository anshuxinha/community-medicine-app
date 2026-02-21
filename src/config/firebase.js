import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDwVdl_eeLA1KkALbI0ZtZYJkMlndIpNUM",
    authDomain: "community-med-app.firebaseapp.com",
    projectId: "community-med-app",
    storageBucket: "community-med-app.firebasestorage.app",
    messagingSenderId: "856703659616",
    appId: "1:856703659616:web:3e6bacfd6541757d9b9d05",
    measurementId: "G-V02X9FR10C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
