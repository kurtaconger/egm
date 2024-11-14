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
// const tripNameData = '2024-01-CARIBBEAN-DATA'
// const tripNameApp = '2024-01-CARIBBEAN-APP'
const tripNameData = '2024-02-BVI-DATA'
const tripNameApp = '2024-02-BVI-APP'
// const tripNameData = '2024-07-LI-SAIL-DATA'
// const tripNameApp = '2024-07-LI-SAIL-APP'


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

export { db, storage, tripNameData, tripNameApp };
