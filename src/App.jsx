import React, { useEffect, useState } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import './index.css';
import Navigation from './components/Navigation';
import MapPopup from './components/MapPopup';
import Map from './components/Map';
import Login from './components/Login';
import DisplaySopt from './components/DisplaySpot';

import { loadLocations } from './utils/loadLocations';
import { db } from './utils/firebase';

const mapBoxToken = import.meta.env.VITE_MAPBOX_TOKEN;

const App = () => {
  const [locations, setLocations] = useState([]);
  const [showPopups, setShowPopups] = useState(true);
  const [mapBearing, setMapBearing] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [tripTitle, setTripTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [user, setUser] = useState(null); // State for logged-in user
  const [tripID, setTripID] = useState(null); // Explicit tripID state

  const [isDisplaySpotOpen, setIsDisplaySpotOpen] = useState(false);


  const location = useLocation();

  const sanitizeId = (id) => id.replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  const loadTripData = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams(location.search);
      const tripIDParam = queryParams.get('ID');
      if (!tripIDParam) throw new Error('Trip ID is missing in URL.');
      setTripID(tripIDParam);

      const tripNameApp = `MAP-${tripIDParam}-APP`;

      // Fetch Trip Title
      const tripTitleDocRef = doc(db, tripNameApp, 'config');
      const tripTitleSnapshot = await getDoc(tripTitleDocRef);
      if (tripTitleSnapshot.exists()) {
        const { tripTitle } = tripTitleSnapshot.data();
        setTripTitle(tripTitle);
      } else {
        throw new Error('No map title found at the specified path');
      }

      // Load Locations
      const locationsData = await loadLocations(tripIDParam);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading trip data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTripData();
  }, [location.search]);

  const toggleMapPopups = () => {
    setShowPopups(!showPopups);
  };

  const rotateMap = () => {
    const newBearing = mapBearing - 45;
    setMapBearing(newBearing);
  };

  const handlePopupClick = async (markerId) => {
    try {
      const markerRef = doc(db, `MAP-${tripID}-DATA`, markerId);
      const markerSnapshot = await getDoc(markerRef);

      if (markerSnapshot.exists()) {
        setCurrentLocation({ id: markerId, ...markerSnapshot.data() });
        // setIsModalOpen(true);
        setIsDisplaySpotOpen(true);
      } else {
        console.warn(`No data found for marker ${markerId}`);
      }
    } catch (error) {
      console.error('Error retrieving marker data: ', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSpotClose = () => { setIsDisplaySpotOpen(false) }

  const handleRequestNext = () => {
    if (currentLocation) {
      const currentLocNumber = currentLocation.seq;
      const nextLocation =
        locations.find((loc) => loc.seq === currentLocNumber + 1) || locations[0];
      setCurrentLocation(nextLocation);
      setIsModalOpen(true);
    }
  };

  const handleRequestPrev = () => {
    if (currentLocation) {
      const currentLocNumber = currentLocation.seq;
      const prevLocation =
        locations.find((loc) => loc.seq === currentLocNumber - 1) ||
        locations[locations.length - 1];
      setCurrentLocation(prevLocation);
      setIsModalOpen(true);
    }
  };

  const handleLogin = (user) => {
    setUser(user);
    console.log('User logged in:', user);
  };

  // Wait for tripID and tripTitle to load before showing Login or app content
  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  // Display Login Component if user is not logged in
  if (!user) {
    
    return (
      <Login
        onLogin={handleLogin}
        onClose={() => console.log('Login closed')}
        tripID={tripID}
        tripTitle={tripTitle}
      />
    );
  }

  return (
    <div>
      {locations.length === 0 && !isLoading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>A trip has not been created yet</h2>
          <p>Select Navigation / Add Title to begin.</p>
        </div>
      ) : null}

      <Navigation
        tripTitle={tripTitle}
        toggleMapPopups={toggleMapPopups}
        rotateMap={rotateMap}
        tripID={tripID}
        mapboxAccessToken={mapBoxToken}
        onLogin={handleLogin}
      />

      <Map
        mapBoxToken={mapBoxToken}
        locations={locations}
        showPopups={showPopups}
        mapBearing={mapBearing}
        sanitizeId={sanitizeId}
        handlePopupClick={handlePopupClick}
        rotateMap={rotateMap}
      />

      {/* <MapPopup
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        db={db}
        currentMarker={currentLocation}
        tripID={tripID}
        onRequestNext={handleRequestNext}
        onRequestPrev={handleRequestPrev}
        user={user}
      /> */}


      {isDisplaySpotOpen && (
            <DisplaySopt
            onRequestClose={handleSpotClose}
            />
      )}


    </div>
  );
};

export default App;
