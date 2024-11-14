// App.jsx
import React, { useEffect, useState } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { useLocation } from 'react-router-dom';
import './index.css';
import Navigation from './components/Navigation';
import MapPopup from './components/MapPopup';
import Map from './components/Map';
import { loadLocations } from './utils/loadLocations';
import { db } from './utils/firebase';

const mapBoxToken = import.meta.env.VITE_MAPBOX_TOKEN;

const App = () => {
  const [locations, setLocations] = useState([]);
  const [showPopups, setShowPopups] = useState(true);
  const [mapBearing, setMapBearing] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [tripTitle, setTripTitle] = useState("Title at Initialization");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [user, setUser] = useState(null); // New state for logged-in user
 
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tripID = queryParams.get("ID");
  const tripNameApp = `MAP-${tripID}-APP`;

  const sanitizeId = (id) => {
    return id.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  };

  const loadTitle = async () => {
    setIsLoading(true);
    try {
      const tripTitleDocRef = doc(db, tripNameApp, 'config');
      const tripTitleSnapshot = await getDoc(tripTitleDocRef);
      if (tripTitleSnapshot.exists()) {
        const { tripTitle } = tripTitleSnapshot.data();
        setTripTitle(tripTitle);
      } else {
        throw new Error('No map title found at the specified path');
      }
    } catch (error) {
      console.error('Error fetching map title from Firebase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMapPopups = () => {
    setShowPopups(!showPopups);
  };

  const rotateMap = () => {
    const newBearing = mapBearing - 45;
    setMapBearing(newBearing);
  };

  const loadLocationsData = async () => {
    setIsLoading(true);
    const locationsData = await loadLocations(tripID);
    setLocations(locationsData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadLocationsData();
    loadTitle();
  }, [tripID]);

  const handlePopupClick = async (markerId) => {
    try {
      const markerRef = doc(db, 'MAP-' + tripID + '-DATA', markerId);
      const markerSnapshot = await getDoc(markerRef);

      if (markerSnapshot.exists()) {
        setCurrentLocation({ id: markerId, ...markerSnapshot.data() });
        setIsModalOpen(true);
      } else {
        console.warn(`No data found for marker ${markerId}`);
      }
    } catch (error) {
      console.error('Error retrieving marker data: ', error);
    }
  };

  const hasComments = (location) => {
    return location && location.content && location.content.trim() !== '';
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleRequestNext = () => {
    if (currentLocation) {
      const currentLocNumber = currentLocation.seq;
      const nextLocation = locations.find((location) => location.seq === currentLocNumber + 1) || locations[0];
      setCurrentLocation(nextLocation);
      setIsModalOpen(true);
    }
  };

  const handleRequestPrev = () => {
    if (currentLocation) {
      const currentLocNumber = currentLocation.seq;
      const prevLocation = locations.find((location) => location.seq === currentLocNumber - 1) || locations[locations.length - 1];
      setCurrentLocation(prevLocation);
      setIsModalOpen(true);
    }
  };

  const handleLogin = (user) => {
    setUser(user);
    console.log("User logged in:", user);
  };

  return (
    <div>
      {locations.length === 0 && !isLoading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>No valid database name exists</h2>
          <p>Use Navigation/Admin/Create Collection to establish a connection.</p>
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

      <MapPopup
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        db={db}
        currentMarker={currentLocation}
        tripID={tripID}
        onRequestNext={handleRequestNext}
        onRequestPrev={handleRequestPrev}
        user={user}
      />
    </div>
  );
};

export default App;

