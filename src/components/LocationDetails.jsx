import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AssistantIcon from '@mui/icons-material/Assistant';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';

import DisplayMedia from './DisplayMedia';
import AIGenComments from './AIGenComments';
import ManageComments from './ManageComments';
import CommentsSummery from './CommentsSummery';

import './locationDetails.css';

const locationDetails = ({ onRequestClose, locations, currentMarker, tripID, user }) => {
  const [currentLocation, setCurrentLocation] = useState(currentMarker);
  const [activeTab, setActiveTab] = useState('Display-Media');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(currentMarker?.shortName || '');

  let longPressTimer;

  const handleButtonClick = (tab) => {
    setActiveTab(tab);
    console.log(`${tab} button clicked`);
  };

  const handleRequestClose = () => {
    console.log('Closing MapPopup');
    setActiveTab('Display-Media');
    onRequestClose();
  };

  const handleRequestPrev = () => {
    if (currentLocation) {
        const currentLocNumber = currentLocation.seq;
        const prevLocation = locations.find((location) => location.seq === currentLocNumber - 1) || locations[locations.length - 1];
        setCurrentLocation(prevLocation);
        setNewTitle(prevLocation.shortName || ''); // Update the title for the new location
        setActiveTab('Display-Media');
    }
  };

  const handleRequestNext = () => {  
    if (currentLocation) {
      const currentLocNumber = currentLocation.seq;
      const nextLocation = locations.find((location) => location.seq === currentLocNumber + 1) || locations[0];
      setCurrentLocation(nextLocation);
      setNewTitle(nextLocation.shortName || ''); // Update the title for the new location
      setActiveTab('Display-Media');
    }
  };
  

  const handleMouseDown = () => {
    longPressTimer = setTimeout(() => {
      console.log(`Long press detected on: ${currentLocation?.shortName || 'No Title'}`);
      setIsEditingTitle(true); // Enable editing mode
    }, 500); // 500ms threshold for a long press
  };

  const handleMouseUp = () => {
    clearTimeout(longPressTimer); // Clear the timer if mouse is released early
  };

  const handleTitleChange = (event) => {
    setNewTitle(event.target.value);
  };

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    console.log(`New title: ${newTitle}`); // This will later save to Firebase

    try {
      const locationDocRef = doc(db, `TRIP-${tripID}-DATA`, currentMarker.id);
      await updateDoc(locationDocRef, { shortName: newTitle });
      console.log('Title successfully updated in Firebase');
    } catch (error) {
      console.error('Error updating title in Firebase:', error);
    }
  };

  return (
    <div className="popup--modal-overlay" onClick={handleRequestClose}>
      <div className="popup--modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Title Bar / Header Section */}
        <div className="popup--header-container">
          <div className="popup--previous-location-sgv" onClick={handleRequestPrev}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="previous-button-svg">
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
              <polyline points="14 16 10 12 14 8" />
            </svg>
          </div>

          {/* Editable Title Section */}
          {isEditingTitle ? (
            <input
              type="text"
              className="popup--location-title-input"
              value={newTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur} // Exit editing mode on blur
              autoFocus
            />
          ) : (
            <h2
              className="popup--location-title"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp} // Handle case where mouse leaves without releasing
            >
              {newTitle || 'No Title'}
            </h2>
          )}

          <div className="popup--next-location-sgv" onClick={handleRequestNext}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="next-button-svg">
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
              <polyline points="10 8 14 12 10 16" />
            </svg>
          </div>

          <div className="popup--close-window-sgv" onClick={handleRequestClose}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="close-button-svg">
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
              <line x1="8" y1="8" x2="16" y2="16" />
              <line x1="16" y1="8" x2="8" y2="16" />
            </svg>
          </div>
        </div>

        <div className="popup--app-border">
          <div className="popup--app-container">
            {/* Top Button Section */}
            <div className="popup--button-bar">
              <button onClick={() => handleButtonClick('Display-Media')} className="popup--top-button">
                <PhotoCameraIcon />
                <span>
                  Photos<br />/Videos
                </span>
              </button>
              <button onClick={() => handleButtonClick('AI-Gen')} className="popup--top-button">
                <AssistantIcon />
                <span>
                  AI<br />Interview
                </span>
              </button>
              <button onClick={() => handleButtonClick('Edit-Comments')} className="popup--top-button">
                <EditIcon />
                <span>
                  Edit<br />Comments
                </span>
              </button>
              <button onClick={() => handleButtonClick('Comments-Summary')} className="popup--top-button">
                <KeyboardVoiceIcon />
                <span>
                  Comments<br />Summary
                </span>
              </button>
            </div>

            {/* Containers Based on State */}
            <div className="popup--container-display">
              {activeTab === 'Display-Media' && (
                <div className="popup--container popup--media">
                  <DisplayMedia currentMarker={currentLocation} />
                </div>
              )}
              {activeTab === 'AI-Gen' && (
                <div className="popup--container popup--ai-gen">
                  <AIGenComments currentMarker={currentLocation} tripID={tripID} user={user} />
                </div>
              )}
              {activeTab === 'Edit-Comments' && (
                <div className="popup--container">
                  <ManageComments user={user} currentMarker={currentLocation} tripID={tripID} />
                </div>
              )}
              {activeTab === 'Comments-Summary' && (
                <div className="popup--container popup--comments-summary">
                  <CommentsSummery currentMarker={currentLocation} tripID={tripID} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

locationDetails.propTypes = {
  onRequestClose: PropTypes.func.isRequired,
  currentMarker: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    shortName: PropTypes.string,
  }),
  tripID: PropTypes.string.isRequired,
  user: PropTypes.object,
};

export default locationDetails;
