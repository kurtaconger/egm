import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import './navigation.css';
import { db } from '../utils/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

function Configure({ isConfigureModalOpen, onClose }) {
  const [tripTitle, setTripTitle] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [latestTripID, setLatestTripID] = useState('');

  useEffect(() => {
    const fetchLatestTripID = async () => {
      try {
        const parametersDocRef = doc(db, 'MAP-GLOBAL', 'parameters');
        const parametersDoc = await getDoc(parametersDocRef);

        if (parametersDoc.exists()) {
          const data = parametersDoc.data();
          setLatestTripID(data.latestTripID || '');
        } else {
          console.log('No latestTripID found in parameters');
        }
      } catch (error) {
        console.error('Error fetching latestTripID:', error);
      }
    };

    if (isConfigureModalOpen) {
      fetchLatestTripID();
    }
  }, [isConfigureModalOpen]);

  const handleSave = async () => {
    if (!tripTitle.trim()) {
      setSaveMessage('Please enter a title before saving.');
      return;
    }

    const newTripID = parseInt(latestTripID, 10) + 1;
    const collectionName = `MAP-${newTripID}-APP`;
    const configDocRef = doc(db, collectionName, 'config');
    const parametersDocRef = doc(db, 'MAP-GLOBAL', 'parameters');

    try {
      // Check if there's already a title saved in the new trip ID
      const configDoc = await getDoc(configDocRef);
      if (configDoc.exists() && configDoc.data().tripTitle) {
        setSaveMessage('Warning: Another user has already assigned a title to this trip ID.');
        return;
      }

      // Save the new title and update latestTripID in MAP-GLOBAL
      await setDoc(configDocRef, { tripTitle: tripTitle });
      await updateDoc(parametersDocRef, { latestTripID: newTripID.toString() });

      setSaveMessage(`Title saved to Trip ID: ${newTripID}`);
      setLatestTripID(newTripID.toString());
    } catch (error) {
      setSaveMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div>
    {isConfigureModalOpen && (
      <div className="modal--overlay">
        <div className="modal--content">
          <div className="modal--header">
            <h2 className='modal--title'>Configure Map</h2>
            <button className="modal--close-button" onClick={onClose}>X</button>
          </div>
          <div className="modal--body">
            <label className='modal--label'>Latest Trip ID</label>
            <input 
              type="text"
              value={latestTripID}
              readOnly
              placeholder="Latest Trip ID will appear here"
            />
            <label className='modal--label'>Title</label>
            <input
              type="text"
              value={tripTitle}
              onChange={(e) => setTripTitle(e.target.value)}
              placeholder="<appears at the top of the screen>"
            />
            <div className="modal--save-message">{saveMessage}</div>
            <button className="modal--button" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

Configure.propTypes = {
  isConfigureModalOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Configure;
