import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './addStops.css';
import mapboxSdk from '@mapbox/mapbox-sdk/services/geocoding';
import { db } from '../utils/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const AddStops = ({ onClose, tripID, mapboxAccessToken }) => {
  const [stopsText, setStopsText] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize Mapbox client using the passed access token
  const geocodingClient = mapboxSdk({ accessToken: mapboxAccessToken });

  const geocodeStops = async () => {
    setLoading(true);
    const stops = stopsText.split('\n').map(stop => stop.trim()).filter(Boolean);
    const geocodedStops = [];

    for (let stop of stops) {
      try {
        const response = await geocodingClient.forwardGeocode({
          query: stop,
          limit: 1,
        }).send();

        if (response && response.body && response.body.features && response.body.features.length > 0) {
          const feature = response.body.features[0];
          const fullPlaceName = feature.place_name;
          const shortName = fullPlaceName.split(',')[0].trim();  // Extracts only the first part before any commas

          geocodedStops.push({
            name: fullPlaceName,  // Use full name for display
            shortName,
            lat: feature.center[1],
            lng: feature.center[0]
          });
        } else {
          geocodedStops.push({
            name: 'Location not found',
            shortName: 'Location not found',
            lat: null,
            lng: null
          });
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        geocodedStops.push({
          name: 'Error occurred',
          shortName: 'Error occurred',
          lat: null,
          lng: null
        });
      }
    }

    // Update stopsText with official names
    setStopsText(geocodedStops.map(stop => stop.name).join('\n'));
    setLoading(false);
    return geocodedStops;
  };

  const handleSave = async () => {
    const geocodedStops = await geocodeStops();

    if (!tripID) {
      console.error('Error: tripID not found in currentMapConfig');
      return;
    }

    const collectionName = `MAP-${tripID}-DATA`;
    const promises = geocodedStops.map((stop, index) => {
      const stopID = `Spot-${String(index + 1).padStart(2, '0')}`;  // Format as Spot-01, Spot-02, etc.
      const spotRef = doc(collection(db, collectionName), stopID);

      console.log(`Saving ${stopID}: name=${stop.name}, shortName=${stop.shortName}, lat=${stop.lat}, lng=${stop.lng}, seq=${index + 1}`);

      return setDoc(spotRef, {
        name: stop.name,
        shortName: stop.shortName,
        lat: stop.lat,
        lng: stop.lng,
        seq: index + 1
      }).then(() => {
        console.log(`location Successfully saved ${stopID}`);
      }).catch((error) => {
        console.error(`Error saving ${stopID}:`, error);
      });
    });

    // Wait for all save operations to complete
    try {
      await Promise.all(promises);
      console.log('All spots saved successfully');
      setStopsText('');  // Clear the input after saving
      onClose();  // Close the modal
    } catch (error) {
      console.error('Error saving spots:', error);
    }
  };

  return (
    <div className="modal--overlay">
      <div className="modal--content">
        <div className="modal--header">
          <h2>Set Trip Stops</h2>
          <button className="modal--close-button" onClick={onClose}>X</button>
        </div>
        <div className="modal--body">
          <textarea
            value={stopsText}
            onChange={(e) => setStopsText(e.target.value)}
            placeholder="Enter each stop on a new line"
            rows="10"
            className="modal--textarea"
          />
        </div>
        <div className="modal--footer">
          <button className="modal--save-button" onClick={geocodeStops} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button className="modal--save-button" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

AddStops.propTypes = {
  onClose: PropTypes.func.isRequired,
  tripID: PropTypes.string.isRequired,
  mapboxAccessToken: PropTypes.string.isRequired,
};

export default AddStops;
