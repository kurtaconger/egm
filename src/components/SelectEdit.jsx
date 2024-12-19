import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import './navigation.css';

const SelectEdit = ({ onClose, user, onTripChange }) => {
  const [loading, setLoading] = useState(false);
  const [tripTitles, setTripTitles] = useState([]); // Store fetched trip titles
  const [selectedTripTitle, setSelectedTripTitle] = useState(''); // Selected title
  const [selectedTrip, setSelectedTrip] = useState(null); // Selected trip object

  useEffect(() => {
    const fetchUserTripTitles = async () => {
      try {
        setLoading(true);

        // Fetch the latest trip ID
        const parametersDocRef = doc(db, 'TRIP-GLOBAL', 'parameters');
        const parametersDocSnap = await getDoc(parametersDocRef);

        if (!parametersDocSnap.exists()) {
          console.warn('No trip parameters found.');
          return;
        }

        const latestTripID = parametersDocSnap.data().latestTripID;
        const titles = [];

        // Loop through all trips up to the latestTripID
        for (let i = 1; i <= latestTripID; i++) {
          // Check if the user exists in the TRIP-i-USERS collection
          const usersCollectionRef = collection(db, `TRIP-${i}-USERS`);
          const userQuery = query(usersCollectionRef, where('email', '==', user.email));
          const userQuerySnapshot = await getDocs(userQuery);

          if (!userQuerySnapshot.empty) {
            const userDoc = userQuerySnapshot.docs[0];
            const readOnly = userDoc.data().readOnly || false; // Default to false if not specified

            // Fetch the trip title if the user is authorized
            const tripConfigRef = doc(db, `TRIP-${i}-APP`, 'config');
            const tripConfigSnap = await getDoc(tripConfigRef);

            if (tripConfigSnap.exists() && tripConfigSnap.data().tripTitle) {
              const title = tripConfigSnap.data().tripTitle;
              titles.push({
                id: i,
                title: readOnly ? `${title} [Read-Only]` : title,
              });
            }
          }
        }

        setTripTitles(titles);
      } catch (error) {
        console.error('Error fetching user trip titles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTripTitles();
  }, [user.email]);

  const handleSelectTrip = () => {
    if (selectedTrip) {
        console.log('Selected Trip ID:', selectedTrip.id);
        onTripChange(selectedTrip.id);
        onClose();
    } else {
        console.warn('No trip selected.');
    }
}; 


  const handleEditTrip = () => {
    console.log('Edit Trip:', selectedTripTitle);
  };

  return (
    <div className="modal--overlay">
      <div className="modal--content">
        <div className="modal--header">
          <h2 className="modal--title">Select a Trip</h2>
          <button className="modal--close-button" onClick={onClose}>
            X
          </button>
        </div>
        <div className="select--body">
          <div className="select--container">
            <label className="select--label">Trip Title</label>
            <select
              className="select--input"
              value={selectedTripTitle}
              onChange={(e) => {
                const trip = tripTitles.find((t) => t.title === e.target.value);
                setSelectedTrip(trip || null);
                setSelectedTripTitle(e.target.value);
              }}
              disabled={loading || tripTitles.length === 0}
            >
              <option value="" disabled>
                {loading ? 'Loading trips...' : 'Select a Trip'}
              </option>
              {tripTitles.map((trip) => (
                <option key={trip.id} value={trip.title}>
                  {trip.title}
                </option>
              ))}
            </select>
            <div className="select--button-container">
              <button
                className="modal--button"
                disabled={loading || !selectedTrip}
                onClick={handleSelectTrip}
              >
                Select Trip
              </button>
              <button
                className="modal--button"
                disabled={loading || !selectedTripTitle}
                onClick={handleEditTrip}
              >
                Edit Trip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectEdit;


