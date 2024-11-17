import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './navigation.css';
import { db } from '../utils/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const AddUser = ({ onClose, tripID }) => {
  console.log("Add User. tripID " + tripID);
  const [emailAddresses, setEmailAddresses] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Define the color array with text and hex values
  const userColors = [
    { textColor: 'Dark Blue', hexColor: '#0000CC' },
    { textColor: 'Dark Green', hexColor: '#008000' },
    { textColor: 'Black', hexColor: '#000000' },
    { textColor: 'Dark Red', hexColor: '#B22222' },
    { textColor: 'Purple', hexColor: '#800080' },
    { textColor: 'Dark Orange', hexColor: '#FF8C00' },
    { textColor: 'Dark Teal', hexColor: '#008080' },
    { textColor: 'Brown', hexColor: '#8B4513' },
    { textColor: 'Maroon', hexColor: '#800000' },
    { textColor: 'Dark Gray', hexColor: '#333333' },
  ];

  function validateEmail(email) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email.toLowerCase());
  }

  const checkValidEmail = () => {
    const emails = emailAddresses.split('\n');
    const validatedEmails = emails.map((email) => {
      email = email.trim().toLowerCase(); // Convert to lowercase
      return validateEmail(email) ? email : `>>INVALID: ${email}`;
    });
    setEmailAddresses(validatedEmails.join('\n'));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    const emails = emailAddresses.split('\n').map(email => email.trim().toLowerCase()); // Convert to lowercase
    const validEmails = emails.filter(email => validateEmail(email));
    const invalidEmails = emails.filter(email => !validateEmail(email));
    const collectionName = `MAP-${tripID}-USERS`;
    const dateToday = new Date().toISOString().split('T')[0]; 

    try {
      const addPromises = validEmails.map(async (email, index) => {
        const docRef = doc(collection(db, collectionName), email);
        const color = userColors[index % userColors.length]; // Assign color from the array
        await setDoc(docRef, {
          email,
          created: dateToday,
          color: color.textColor,
          hexColor: color.hexColor,
        });
      });

      await Promise.all(addPromises);
      setMessage(`${validEmails.length} email addresses added to "${collectionName}"`);
      
      if (invalidEmails.length > 0) {
        setMessage(prevMessage => `${prevMessage}. Invalid emails were not added.`);
      }
    } catch (error) {
      console.error("Error adding emails:", error);
      setMessage("Error: Unable to save emails. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal--overlay">
      <div className="modal--content">
        <div className="modal--header">
          <h2 className='modal--title'>Set User List</h2>
          <button className="modal--close-button" onClick={onClose}>X</button>
        </div>
        <div className="modal--body">
          <textarea
            value={emailAddresses}
            onChange={(e) => setEmailAddresses(e.target.value)}
            placeholder="Enter each email on a separate line"
            rows="10"
            className="modal--textarea"
          />
          {message && <p className="modal--message">{message}</p>}
        </div>
        <div className="modal--footer">
          <button className="modal--button" onClick={checkValidEmail} disabled={loading}>Validate emails</button>
          <button className="modal--button" onClick={handleSave} disabled={loading}>Save User List</button>
        </div>
      </div>
    </div>
  );
};

AddUser.propTypes = {
  onClose: PropTypes.func.isRequired,
  tripID: PropTypes.string.isRequired,
};

export default AddUser;
