import React, { useEffect, useState } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import './index.css';
import Navigation from './components/Navigation';
import UserDisplayNameAndColor from './components/UserDisplayNameAndColor';
import LocationDetails from './components/LocationDetails'

import Map from './components/Map';
import Login from './components/Login';

import { loadLocations } from './utils/loadLocations';
import { db } from './utils/firebase';

const mapBoxToken = import.meta.env.VITE_MAPBOX_TOKEN;

const App = () => {
  const [locations, setLocations] = useState([]);
  const [showPopups, setShowPopups] = useState(true);
  const [mapBearing, setMapBearing] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [tripTitle, setTripTitle] = useState('');
  const [isMapPopupOpen, setIsMapPopupOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [user, setUser] = useState(null); 
  const [tripID, setTripID] = useState(null);
  const [showUserDisplayNameAndColor, setShowUserDisplayAndColor] = useState(false);

  // to handle parameters passed to App.
  const location = useLocation();
  const navigate = useNavigate();

  const sanitizeId = (id) => id.replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  const handleTripChange = (newTripID) => {
    if (newTripID !== tripID) {
      setTripID(newTripID);
      navigate(`/?ID=${newTripID}`); 
    }
  };

  const loadTripData = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams(location.search);
      const tripIDParam = queryParams.get('ID');
      if (!tripIDParam) throw new Error('Trip ID is missing in URL.');
      setTripID(tripIDParam);

      const tripNameApp = `TRIP-${tripIDParam}-APP`;
      console.log ("tripNameApp: ", tripNameApp)

      // Fetch Trip Title
      const tripTitleDocRef = doc(db, tripNameApp, 'config');
      const tripTitleSnapshot = await getDoc(tripTitleDocRef);
      if (tripTitleSnapshot.exists()) {

        const  { tripTitle } = tripTitleSnapshot.data();
        console.log ("retreived trip Title ", tripTitle)
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

  useEffect(() => {
    if (tripID) {
      loadTripData();
    }
  }, [tripID]); 

  const toggleMapPopups = () => {
    setShowPopups(!showPopups);
  };

  const rotateMap = () => {
    const newBearing = mapBearing - 45;
    setMapBearing(newBearing);
  };

  const handlePopupClick = async (markerId) => {
    try {
      const markerRef = doc(db, `TRIP-${tripID}-DATA`, markerId);
      const markerSnapshot = await getDoc(markerRef);

      if (markerSnapshot.exists()) {
        setCurrentLocation({ id: markerId, ...markerSnapshot.data() });
        setIsMapPopupOpen(true)
      } else {
        console.warn(`No data found for marker ${markerId}`);
      }
    } catch (error) {
      console.error('Error retrieving marker data: ', error);
    }
  };

  // identiy first time users after login. First time users do not have a hexColot
  const handleLogin = async (loggedInUser) => {
    setUser(loggedInUser);
    console.log('User logged in:', loggedInUser);

    try {
      const userDocRef = doc(db, `TRIP-${tripID}-USERS`, loggedInUser.email);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        setUser({ ...loggedInUser, ...userData });

        if (!userData.hexColor) {
          console.log("First-time login detected. Prompting for display name and color.");
          setShowUserDisplayAndColor(true);
        }
      } else {
        console.log("New user detected. Prompting for display name and color.");
        setShowUserDisplayAndColor(true);
      }
    } catch (error) {
      console.error("Error retrieving user data:", error);
    }
  };

  useEffect(() => {
    if (user && !user.hexColor) {
      console.log("No hexColor found, forcing user setup modal.");
      setShowUserDisplayAndColor(true);
    }
  }, [user]);

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
          <p>Select Setup Menu Option to Begin.</p>
        </div>
      ) : null}

      <Navigation
        tripTitle={tripTitle}
        toggleMapPopups={toggleMapPopups}
        rotateMap={rotateMap}
        tripID={tripID}
        user={user}
        onLogin={handleLogin}
        onTripChange={handleTripChange}
      />

      <Map
        mapBoxToken={mapBoxToken}
        locations={locations}
        showPopups={showPopups}
        mapBearing={mapBearing}
        sanitizeId={sanitizeId}
        handlePopupClick={handlePopupClick}
        rotateMap={rotateMap}
        tripID={tripID}
      />

      {isMapPopupOpen && (
        <LocationDetails
          onRequestClose={ () => setIsMapPopupOpen(false)}
          db={db}
          locations={locations}
          currentMarker={currentLocation}
          tripID={tripID}
          user={user}
        />
      )}

      {showUserDisplayNameAndColor && (
        <UserDisplayNameAndColor
          user={user}
          tripID={tripID}
          onClose={() => setShowUserDisplayAndColor(false)}
          updateUser={setUser}
        />
      )}


    </div>
  );
};

export default App;
