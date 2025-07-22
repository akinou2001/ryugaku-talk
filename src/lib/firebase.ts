// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore'; 
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyArKpR8IbuvNDngHVt-kzamqh0gOBKZTxQ",
  authDomain: "ryugaku-talk.firebaseapp.com",
  projectId: "ryugaku-talk",
  storageBucket: "ryugaku-talk.firebasestorage.app",
  messagingSenderId: "249031416100",
  appId: "1:249031416100:web:58632e4cacb6a157cfbbb1",
  measurementId: "G-268PHC5G74"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const db = getFirestore(app);