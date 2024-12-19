import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';

import ManagePictures from './ManagePictures';
import ManageNonGPSPictures from './ManageNonGPSPictures';
import Setup from './Setup';
import SelectEdit from './SelectEdit';

import { db } from '../utils/firebase';

import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LoupeIcon from '@mui/icons-material/Loupe';
import IosShareIcon from '@mui/icons-material/IosShare';

import './navigation.css';

function Navigation({ tripTitle, toggleMapPopups, rotateMap, tripID, user, onTripChange }) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isPictureModalOpen, setIsPictureModalOpen] = useState(false);
  const [isNonGPSModalOpen, setIsNonGPSModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [iIsSelectEditModalOpen, setIsSelectEditModalOpen] = useState(false)

  const [hasLocations, setHasLocations] = useState(false); // Track if locations exist

  // Check if the "TRIP-tripID-DATA" collection exists
  useEffect(() => {
    const checkLocations = async () => {
      if (!tripID) return;
      try {
        const locationCollectionRef = collection(db, `TRIP-${tripID}-DATA`);
        const locationSnapshot = await getDocs(locationCollectionRef);
        setHasLocations(!locationSnapshot.empty); // Set to true if documents exist
      } catch (error) {
        console.error("Error checking locations:", error);
      }
    };

    checkLocations();
  }, [tripID]);

  const toggleNav = () => setIsNavOpen(!isNavOpen);

  const handlePictureButtonClick = () => {
    setIsPictureModalOpen(true);
    setIsNavOpen(false);
  };
  const handleNonGPSPButtonClick = () => {
    setIsNonGPSModalOpen(true);
    setIsNavOpen(false);
  };
  const handleSetupButtonClick = () => {
    setIsSetupModalOpen(true);
    setIsNavOpen(false);
  };
  const handleSelectEditButtonClick = () => {
    setIsSelectEditModalOpen(true);
    setIsNavOpen(false);
  };

  const closeSetupModal = () => setIsSetupModalOpen(false);
  const closeNonGPSModal = () => setIsNonGPSModalOpen(false);
  const cloesSelectEditModal = () => setIsSelectEditModalOpen(false);

  const handleShareButtonClick = () => {
    const subject = encodeURIComponent(tripTitle);
    const body = encodeURIComponent(`Check out this trip: ${window.location.href}`);
    const isIPhone = /iPhone/.test(navigator.userAgent);

    if (isIPhone) {
      // Provide a choice for iPhone users
      const useSMS = window.confirm("Do you want to share via SMS? Click Cancel to use Email.");
      if (useSMS) {
        // Open SMS app
        window.location.href = `sms:?body=Check out this trip: ${window.location.href}`;
      } else {
        // Open Email app
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      }
    } else {
      // Default to email for other devices
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  return (
    <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 400 }}>
      <div className="nav--map-top-row">
        <div className="nav--map-title-container">
          <div className="nav--map-top-menu">
            {isNavOpen ? (
              <CloseIcon
                className="material-icons"
                style={{ fontSize: '32px', cursor: 'pointer' }}
                onClick={toggleNav}
              />
            ) : (
              <MenuIcon
                className="material-icons"
                style={{ fontSize: '32px', cursor: 'pointer' }}
                onClick={toggleNav}
              />
            )}
          </div>
          <div className="nav--map-title">{tripTitle}</div>
        </div>
        <div className="nav--map-top-buttons">
          <AutorenewIcon
            className="material-icons rotate-icon"
            style={{
              fontSize: '32px',
              cursor: 'pointer',
              marginRight: '10px',
              verticalAlign: 'middle',
            }}
            onClick={rotateMap}
          />
          <LoupeIcon
            className="material-icons"
            style={{
              fontSize: '32px',
              cursor: 'pointer',
              marginRight: '10px',
              verticalAlign: 'middle',
            }}
            onClick={toggleMapPopups}
          />
          <IosShareIcon
            className="material-icons"
            style={{
              fontSize: '32px',
              cursor: 'pointer',
              marginRight: '10px',
              verticalAlign: 'middle',
            }}
            onClick={handleShareButtonClick}
          />
        </div>
      </div>

      {isNavOpen && (
        <div className="nav--outer-container">
          <div className="nav--button-container">
            <button className="nav--button" onClick={handlePictureButtonClick}>
              Upload Pictures
            </button>
            <button className="nav--button" onClick={handleNonGPSPButtonClick}>
              Upload Pictures without GPS </button>
            <hr />
            <button className="nav--button" onClick={handleSetupButtonClick}>
              Setup </button>
            <button className="nav--button" onClick={handleSelectEditButtonClick}>
              Select Trip</button>
          </div>
        </div>
      )}

      {isPictureModalOpen && (
        <ManagePictures
          isPictureModalOpen={isPictureModalOpen}
          closePictureModal={() => setIsPictureModalOpen(false)}
          tripID={tripID}
        />
      )}

      {isNonGPSModalOpen && (
        <ManageNonGPSPictures onCancel={closeNonGPSModal} tripID={tripID} />
      )}

      {isSetupModalOpen && (
        <Setup onClose={closeSetupModal} user={user} />
      )}

    {iIsSelectEditModalOpen && (
        <SelectEdit onClose={cloesSelectEditModal} user={user}   onTripChange={onTripChange}/>
      )}

    </div>
  );
}

export default Navigation;
