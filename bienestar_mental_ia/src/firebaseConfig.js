// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBaiWumdMbp5rF06C_DVD47oWgJBRi_tBU",
  authDomain: "bienestarmentalia.firebaseapp.com",
  projectId: "bienestarmentalia",
  storageBucket: "bienestarmentalia.firebasestorage.app",
  messagingSenderId: "204210141588",
  appId: "1:204210141588:web:88901d6b3233f66934b781",
  measurementId: "G-5K8VTE3RDE"
};

// Export the Firebase configuration
export default firebaseConfig;

// If you need to use the initialized app and analytics in other files
// you can export them as well
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);