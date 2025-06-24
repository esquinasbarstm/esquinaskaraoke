import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyA-12uLmsJocr0l7kPfDZb-ldjw702RfQA",
  authDomain: "esquinaskaraokev1.firebaseapp.com",
  projectId: "esquinaskaraokev1",
  storageBucket: "esquinaskaraokev1.firebasestorage.app",
  messagingSenderId: "194647687582",
  appId: "1:194647687582:web:b40633b8af522f9e71968f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
