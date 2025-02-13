import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyCF3ydrhMuURLzs09E_wk0TZyjx4-vJWQw',
    authDomain: 'm-y-m-660ec.firebaseapp.com',
    projectId: 'm-y-m-660ec',
    storageBucket: 'm-y-m-660ec.appspot.com',
    messagingSenderId: '509277052904',
    appId: '1:509277052904:web:1122937f1d33c2a2540e5d',
};

// Ensure Firebase app is initialized only once
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
} else {
    app = getApps()[0]; // Use the existing app
    console.log('Using existing Firebase app');
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


// Sign in anonymously
signInAnonymously(auth)
    .then(() => {
        console.log('User signed in anonymously');
    })
    .catch((error) => {
        console.error('Error signing in:', error);
    });

export { db, storage, auth };
