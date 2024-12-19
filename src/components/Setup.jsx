import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

import { db } from '../utils/firebase';

import './navigation.css';

const Setup = ({ onClose, mapboxAccessToken }) => {
  const [fullAccessEmails, setFullAccessEmails] = useState('');
  const [readOnlyEmails, setReadOnlyEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayMessageForUsers, setDisplayMessageforUsers] = useState('')
  const [displayMessageForTitleAndSpots, setDisplayMessageforTitleAndSpots] = useState('')

  const [newTripTitle, setNewTripTitle] = useState('');
  const [stopsText, setStopsText] = useState('');
  const [newTripID, setNewTripID] = useState(null);

  const parametersDocRef = doc(db, 'TRIP-GLOBAL', 'parameters');

  // Get the next available Trip ID
  useEffect(() => {
    const fetchNewTripID = async () => {
      try {
        const parametersDoc = await getDoc(parametersDocRef);
        const latestTripID = parametersDoc.exists()
          ? parseInt(parametersDoc.data().latestTripID, 10)
          : 0;
        setNewTripID(latestTripID + 1);
      } catch (error) {
        console.error('Error fetching newTripID:', error);
        setNewTripID('N/A');
      }
    };
    fetchNewTripID();
  }, []);

  // Functions for Adding Users
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
  let colorIndex = 0;

  const getNextColor = () => {
    const color = userColors[colorIndex];
    colorIndex = (colorIndex + 1) % userColors.length;
    return color;
  };

  // functions for adding new Spots
  const handleValidateGPS = async () => {
    setLoading(true);
    const stops = stopsText.split('\n').map((stop) => stop.trim()).filter(Boolean);
    const geocodedStops = [];

    console.log('Google Maps API Key:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  
    for (let stop of stops) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            stop
          )}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
        );
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
  
        if (data.results.length > 0) {
          const result = data.results[0];
          geocodedStops.push({
            name: result.formatted_address,
            shortName: result.address_components[0].long_name,
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          });
        } else {
          geocodedStops.push({
            name: 'Location not found',
            shortName: 'Location not found',
            lat: null,
            lng: null,
          });
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        geocodedStops.push({
          name: 'Error occurred',
          shortName: 'Error occurred',
          lat: null,
          lng: null,
        });
      }
    }
  
    setStopsText(geocodedStops.map((stop) => stop.name).join('\n'));
    setLoading(false);
    return geocodedStops;
  };
  

  const checkValidEmail = () => {
    const validate = (emails) =>
      emails
        .split('\n')
        .map((email) => {
          email = email.trim().toLowerCase();
          return validateEmail(email) ? email : `>>INVALID: ${email}`;
        })
        .join('\n');

    setFullAccessEmails(validate(fullAccessEmails));
    setReadOnlyEmails(validate(readOnlyEmails));
  };

  const validateEmail = (email) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email.toLowerCase());
  };

  const handleSaveTitleAndSpots = async () => {
    console.log ("saving")
    try {
      const collectionName = `TRIP-${newTripID}-APP`;
      const configDocRef = doc(db, collectionName, 'config');

      await setDoc(configDocRef, { tripTitle: newTripTitle });
      await updateDoc(parametersDocRef, { latestTripID: newTripID.toString() });

      setDisplayMessageforTitleAndSpots(`Title ${newTripTitle} saved to Trip ID: ${newTripID}`);

    } catch (error) {
      console.error('Error saving title:', error);
      setDisplayMessageforTitleAndSpots(`Error: ${error.message}`);
    }

    const geocodedStops = await handleValidateGPS();

    if (!newTripID) {
      console.error('Error: NewTripID not found');
      return;
    }

    const collectionName = `TRIP-${newTripID}-DATA`;
    const promises = geocodedStops.map((stop, index) => {
      const stopID = `Spot-${String(index + 1).padStart(2, '0')}`;
      const spotRef = doc(collection(db, collectionName), stopID);

      return setDoc(spotRef, {
        name: stop.name,
        shortName: stop.shortName,
        lat: stop.lat,
        lng: stop.lng,
        seq: index + 1,
      }).catch((error) => {
        console.error(`Error saving ${stopID}:`, error);
      });
    });

    try {
      await Promise.all(promises);
      setStopsText('');
    } catch (error) {
      console.error('Error saving spots:', error);
    }
  };

  const handleSaveUsers = async () => {
    setLoading(true);
    setDisplayMessageforUsers('');
    const collectionName = `TRIP-${newTripID}-USERS`;
    const dateToday = new Date().toISOString().split('T')[0];

    const processEmails = async (emails, readOnly) => {
      const validEmails = emails
        .split('\n')
        .map((email) => email.trim().toLowerCase())
        .filter((email) => validateEmail(email));

      const addPromises = validEmails.map(async (email) => {
        const docRef = doc(collection(db, collectionName), email);
        const data = {
          email,
          created: dateToday,
          readOnly,
        };

        if (!readOnly) {
          const color = getNextColor();
          data.color = color.textColor;
          data.hexColor = color.hexColor;
        }

        await setDoc(docRef, data);
      });

      return Promise.all(addPromises);
    };

    try {
      await processEmails(fullAccessEmails, false);
      await processEmails(readOnlyEmails, true);
      setDisplayMessageforUsers(`User lists saved successfully. Invalid emails were not added.`);
    } catch (error) {
      console.error('Error adding emails:', error);
      setDisplayMessageforUsers('Error: Unable to save emails. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal--overlay">
      <div className="modal--content">
        <div className="modal--header">
          <h2 className="modal--title">
            Configure Map for New ID: {newTripID || 'Loading...'}
          </h2>
          <button className="modal--close-button" onClick={onClose}>
            X
          </button>
        </div>
        <div className="config--body">
          <div className="config--container">
            <label className="config--label">Title</label>
            <input
              type="text"
              value={newTripTitle}
              onChange={(e) => setNewTripTitle(e.target.value)}
              placeholder="Title appearing at the top of the map"
              className="config--input"
            />
            <label className="config--label">Spots to Add on Map</label>
            <textarea
              value={stopsText}
              onChange={(e) => setStopsText(e.target.value)}
              placeholder="Enter each spot on a new line, include state abbreviation"
              rows="6"
              className="config--textarea"
            />
          {displayMessageForTitleAndSpots && <p className="config--message">{displayMessageForTitleAndSpots}</p>}
            <div className="config--button-container">
              <button
                className="modal--button"
                disabled={loading}
                onClick={handleValidateGPS}
              >
                Validate Spots
              </button>
              <button
                className="modal--button"
                disabled={loading}
                onClick={handleSaveTitleAndSpots}
              >
                Save Title & Spots
              </button>
            </div>
          </div>
          <div className="config--container">
            <label className="config--label">Travel Group Members</label>
            <textarea
              value={fullAccessEmails}
              onChange={(e) => setFullAccessEmails(e.target.value)}
              placeholder="Enter each email on a separate line"
              rows="5"
              className="config--textarea"
            />
            <label className="config--label">Read Only Group</label>
            <textarea
              value={readOnlyEmails}
              onChange={(e) => setReadOnlyEmails(e.target.value)}
              placeholder="Enter each email on a separate line"
              rows="3"
              className="config--textarea"
            />
            {displayMessageForUsers && <p className="config--message">{displayMessageForUsers}</p>}
            <div className="config--button-container">
              <button
                className="modal--button"
                onClick={checkValidEmail}
                disabled={loading}
              >
                Validate Emails
              </button>
              <button
                className="modal--button"
                disabled={loading}
                onClick={handleSaveUsers}
              >
                Save User List
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Setup.propTypes = {
  onClose: PropTypes.func.isRequired,
  mapboxAccessToken: PropTypes.string.isRequired,
};

export default Setup;

