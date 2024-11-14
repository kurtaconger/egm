// src/components/Account.jsx
import React from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, OAuthProvider, signOut } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../utils/firebase';

const Account = ({ onLogin, onClose, tripID }) => {
  const auth = getAuth();
  const validUserListCollection = `MAP-${tripID}-USERS`;

  const checkValidUser = async (email) => {
    const userCollectionRef = collection(db, validUserListCollection);
    const q = query(userCollectionRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const { textColor, hexColor } = doc.data();
      return { valid: true, textColor, hexColor };
    }
    return { valid: false };
  };

  const handleAuth = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      const userCheck = await checkValidUser(email);

      if (userCheck.valid) {
        const userData = { ...result.user, ...userCheck };
        onLogin(userData);
        onClose();
      } else {
        alert(`Email ${email} is not valid`);
        await signOut(auth);
      }
    } catch (error) {
      console.error("Authentication failed:", error);
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
    <div className="pict-modal--overlay">
      <div className="pict-modal--content">
        <div className="pict-modal--header">
          <div className="pict-modal--title">Easy Group Memories</div>
          <button className="pict-modal--close-button" onClick={onClose}>X</button>
        </div>
        <div className="pict-modal--body">
          <button className="pict-modal--button" onClick={handleGoogleLogin}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png" alt="Google Icon" style={{ width: '20px', marginRight: '8px' }} />
            Continue with Google
          </button>
          <button className="pict-modal--button" onClick={handleAppleLogin}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple Icon" style={{ width: '20px', marginRight: '8px' }} />
            Continue with Apple
          </button>
        </div>
      </div>
    </div>
  );
};

export default Account;






