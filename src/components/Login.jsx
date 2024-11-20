import React from 'react';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
} from 'firebase/auth';
import { collection, getDocs, query, where, setDoc, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import './navigation.css';

const Login = ({ onLogin, onClose, tripID, tripTitle }) => {
  const auth = getAuth();

  const checkValidUser = async (email) => {
    try {
      email = email.toLowerCase(); // Ensure email is lowercase
      if (!tripID) {
        console.warn("No tripID provided. Skipping user validation.");
        return { valid: true };
      }

      // Check if the MAP-tripID-DATA collection exists
      const locationCollectionRef = collection(db, `MAP-${tripID}-DATA`);
      const locationSnapshot = await getDocs(locationCollectionRef);

      if (locationSnapshot.empty) {
        console.warn("No locations defined for this trip. Skipping user validation.");
        return { valid: true };
      }

      // Check if the user exists in the MAP-tripID-USERS collection
      const validUserListCollection = `MAP-${tripID}-USERS`;
      const userCollectionRef = collection(db, validUserListCollection);
      const q = query(userCollectionRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // User exists in the collection
        return { valid: true };
      } else {
        // Check if the MAP-tripID-USERS collection is empty
        const userCollectionSnapshot = await getDocs(userCollectionRef);
        if (userCollectionSnapshot.empty) {
          // Add user to the collection if it's empty
          const docRef = doc(userCollectionRef);
          const dateToday = new Date().toISOString().slice(0, 10); // Today's date in YYYY-MM-DD format
          await setDoc(docRef, {
            email,
            created: dateToday,
            color: 'Dark Blue',
            hexColor: '0000CC',
          });
          console.log("User added to MAP-tripID-USERS collection:", email);
          return { valid: true };
        } else {
          // Collection is not empty; do not allow check-in
          return { valid: false, reason: "User not authorized and collection is not empty." };
        }
      }
    } catch (error) {
      console.error("Error checking user validity:", error);
      return { valid: false, reason: "An error occurred during validation." };
    }
  };

  const handleAuth = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      // Validate the user only if tripID and locations exist
      const userCheck = await checkValidUser(email);

      if (userCheck.valid) {
        const userData = { ...result.user };
        onLogin(userData);
        onClose();
      } else {
        alert(
          userCheck.reason || `Email ${email} is not authorized to access this trip.`
        );
        await signOut(auth);
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      alert("Authentication failed. Please try again.");
    }
  };

  const handleGoogleLogin = () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    handleAuth(provider);
  };

  const handleAppleLogin = () => {
    const provider = new OAuthProvider('apple.com');
    handleAuth(provider);
  };

  return (
    <div className="modal--overlay">
      <div className="modal--content">
        <div className="modal--header">
          <div className="modal--title">Easy Group Memories</div>
          <button className="modal--close-button" onClick={onClose}>
            X
          </button>
        </div>

        <div className="modal--body">
          {tripTitle ? (
            <div className="modal--login-text">
              Login with Google or Apple to gain access to Group Memories for:{" "}
              <span className="modal--bold">{tripTitle}</span>
            </div>
          ) : (
            <div className="modal--login-text">
              No Group Travel Memories Trip Defined yet. Select "Add Title" from
              the menu after logging in.
            </div>
          )}
        </div>

        <div className="modal--footer">
          <button className="modal--white-button" onClick={handleGoogleLogin}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
              alt="Google Icon"
              style={{ width: '30px', marginRight: '8px' }}
            />
            Continue with Google
          </button>
          <button className="modal--white-button" onClick={handleAppleLogin}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
              alt="Apple Icon"
              style={{ width: '20px', marginRight: '8px' }}
            />
            Continue with Apple
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;



