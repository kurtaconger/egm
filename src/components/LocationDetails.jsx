import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { executeSyntaxCheck } from '../utils/executeSyntaxCheck';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AssistantIcon from '@mui/icons-material/Assistant';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';
import DisplayMedia from './DisplayMedia';
import AIGenComments from './AIGenComments';
import ManageComments from './ManageComments';
import CommentsSummery from './CommentsSummery';
import SyntaxCheck from './syntaxCheck';
import SaveWarning from './SaveWarning';
import './locationDetails.css';

const locationDetails = ({ onRequestClose, locations, currentMarker, tripID, user }) => {
  const [currentLocation, setCurrentLocation] = useState(currentMarker);
  const [activeTab, setActiveTab] = useState('Display-Media');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(currentLocation?.shortName || '');
  const [syntaxCheckUnderway, setSyntaxCheckUnderway] = useState(false);
  const [showInvlidDisplayNameModal, setShowInvlidDisplayNameModal] = useState(false)
  const [validDisplayNames, setValidDisplayNames] = useState( [] );
  const [currentDisplayName, setCurrentDisplayName] = useState(user?.displayName || '');
  const [currentTextColor, setCurrentTextColor] = useState(user?.hexColor || '');
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [commentSaved, setCommentSaved] = useState(false);
 
  const tripNameUsers = `TRIP-${tripID}-USERS`;
  const tripNameData = `TRIP-${tripID}-DATA`;
  
  let longPressTimer;

  const [refreshComments, setRefreshComments] = useState(false);

  const handleUpdateUser = async (newDisplayName, newTextColor) => {
    console.log("🔄 Updating display name from", currentDisplayName, "to", newDisplayName);
    console.log("🎨 Updating text color from", currentTextColor, "to", newTextColor);

    const oldDisplayName = currentDisplayName;
    const oldTextColor = currentTextColor;
    setCurrentDisplayName(newDisplayName);
    setCurrentTextColor(newTextColor);

    const userDocRef = doc(db, tripNameUsers, user.email);
    const tripDataDocRef = doc(db, tripNameData, currentLocation.id);

    try {
        await setDoc(userDocRef, { displayName: newDisplayName, hexColor: newTextColor }, { merge: true });
        console.log('✅ User updated successfully in Firebase (TRIP-1-USERS)');

        const docSnap = await getDoc(tripDataDocRef);
        if (docSnap.exists()) {
            let content = docSnap.data().content || "";

            let updatedContent = content.replaceAll(`[${oldDisplayName}]`, `[${newDisplayName}]`);
            updatedContent = updatedContent.replaceAll(`color: ${oldTextColor}`, `color: ${newTextColor}`);

            console.log("🔄 Replacing content:", content, " → ", updatedContent);

            await setDoc(tripDataDocRef, { content: updatedContent }, { merge: true });
            console.log('✅ Content updated successfully in Firebase (TRIP-1-DATA)');
            
            // ✅ Force ManageComments to re-fetch Firebase content
            setRefreshComments(prev => !prev);
        }

    } catch (error) {
        console.error('⚠️ Error updating user and content in Firebase:', error);
    }
  };

  // handle tab button click
  const handleButtonClick = (tab) => {
    console.log(`request to change from ${activeTab} to ${tab}`);

    if (activeTab === 'Edit-Comments') {
        setSyntaxCheckUnderway(true);
        setRefreshComments(prev => !prev);
    }

    if (activeTab === 'AI-Gen') {
       if (!commentSaved) {
        setShowWarningPopup(true)
        return
       }
    }
    setActiveTab(tab);

    // if we are moving to the AI-Gen Comments screen, reset saved comments flag
    if (activeTab === 'AI-Gen') setCommentSaved(false)
};

  // handle pressing the close button
  const handleRequestClose = async () => {
    console.log ("close request from " + activeTab)
    if (activeTab === 'Edit-Comments') {
      console.log('Checking syntax before closing...');
      const { validDisplayNames, invalidNames } = await executeSyntaxCheck(tripID, currentLocation.id);
      setValidDisplayNames(validDisplayNames);

      if (invalidNames.length > 0) {
        console.error('Invalid Display Names Detected:', invalidNames);
        setShowInvlidDisplayNameModal(true);
        return;
      } else {
        console.log('Syntax is valid, closing screen.');
        setActiveTab('Display-Media');
        onRequestClose();
      }

    } else if (activeTab === 'AI-Gen') {

      if (!commentSaved) {
        setShowWarningPopup(true)
        return
       }
      console.log('Closing MapPopup');
      setActiveTab('Display-Media');
      onRequestClose();
    }
    // Not in Edit-Comments or AI-Gen mode
    onRequestClose();   
  };
  
    // handle the next location and previous location button
  const handleRequestNextPrev = async (direction) => {
 
    if (activeTab === "Edit-Comments") {
     console.log(`Checking syntax before moving to the ${direction === -1 ? 'previous' : 'next'} location...`);
  
      // Execute syntax check before changing location
      const { validDisplayNames, invalidNames } = await executeSyntaxCheck(tripID, currentLocation.id);
      setValidDisplayNames(validDisplayNames);
  
      if (invalidNames.length > 0) {
        console.error("Invalid Display Names Detected:", invalidNames);
        setShowInvlidDisplayNameModal(true);
        return; // Stop here if there's a syntax error
      }
      console.log(`Syntax is valid for ${currentLocation.id}, moving to the ${direction === -1 ? 'previous' : 'next'} location.`);

    } else if ((activeTab === "AI-Gen") && (!commentSaved)) {
        setShowWarningPopup(true);
        return;
    }
  
      // Determine new location
      const currentLocNumber = currentLocation.seq;
      const newLocation = direction === -1
        ? locations.find((location) => location.seq === currentLocNumber - 1) || locations[locations.length - 1]
        : locations.find((location) => location.seq === currentLocNumber + 1) || locations[0];
  
      setCurrentLocation(newLocation);
      setNewTitle(newLocation.shortName || '');
      if (activeTab != "Edit-Comments") setActiveTab('Display-Media');
  };

  // Change the title by pressing on it for a long time
  const handleMouseDown = () => {
    longPressTimer = setTimeout(() => {
      console.log(`Long press detected on: ${currentLocation?.shortName || 'No Title'}`);
      setIsEditingTitle(true); 
    }, 500); // 500ms threshold for a long press
  };
  const handleMouseUp = () => { clearTimeout(longPressTimer); };
  const handleTitleChange = (event) => { setNewTitle(event.target.value); };

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    console.log(`New title: ${newTitle}`); // This will later save to Firebase

    try {
      const locationDocRef = doc(db, `TRIP-${tripID}-DATA`, currentLocation.id);
      await updateDoc(locationDocRef, { shortName: newTitle });
      console.log('Title successfully updated in Firebase');
    } catch (error) {
      console.error('Error updating title in Firebase:', error);
    }
  };

  // Make sure the display names are valid in the Comments
  useEffect(() => {
    const checkCommentsSyntax = async () => {
      console.log('In check syntax');
  
      if (syntaxCheckUnderway) {
        const { validDisplayNames, invalidNames } = await executeSyntaxCheck(tripID, currentLocation.id);
  
        if (invalidNames.length > 0) {
          console.error('Invalid Display Names Detected:', invalidNames);
          setShowInvlidDisplayNameModal(true);
        } else {
          console.log('All display names are valid for ' + currentLocation.id);
        }
  
        setValidDisplayNames(validDisplayNames);
        setSyntaxCheckUnderway(false);
      }
    };
  
    checkCommentsSyntax();
  }, [syntaxCheckUnderway, tripID, currentLocation.id]);

  const onClose = () => {
    setShowInvlidDisplayNameModal(false);
  
    if (syntaxCheckUnderway) {
      console.log('Syntax check completed.');
  
      if (validDisplayNames.length > 0 && showInvlidDisplayNameModal === false) {
        // If there were no syntax errors, close the LocationDetails screen
        console.log('No syntax errors, closing screen.');
        setActiveTab('Display-Media');
        onRequestClose();
      } else {
        // Syntax errors were found, so stay on the current location and allow corrections
        console.log('SyntaxCheck closed, staying on Edit-Comments.');
        setActiveTab('Edit-Comments');
      }
  
      setSyntaxCheckUnderway(false); // Reset flag
    } else {
      console.log('SyntaxCheck closed without syntax check triggered, staying on Edit-Comments.');
      setActiveTab('Edit-Comments');
    }
  };
  
  const onRestore = async () => {
    try {
      console.log("Restoring content from snapshotContent...");
      
      const docRef = doc(db, tripNameData, currentLocation.id);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        const snapshotContent = docSnap.data().snapshotContent;
  
        if (snapshotContent) {
          console.log("Snapshot content retrieved successfully.");
  
          // Update content in the state and UI
          setActiveTab('Edit-Comments');
          setShowInvlidDisplayNameModal(false);
          setSyntaxCheckUnderway(false);
  
          // Update content in the editor
          const editableElement = document.querySelector('.comments--editable-container');
          if (editableElement) {
            editableElement.innerHTML = snapshotContent;
          }
  
          // Save restored content back to Firebase
          await updateDoc(docRef, { content: snapshotContent });
          console.log("Restored content saved back to Firebase.");
        } else {
          console.log("No snapshotContent found in Firebase.");
        }
      } else {
        console.log("No document found in Firebase.");
      }
    } catch (error) {
      console.error("Error restoring content from snapshotContent:", error);
    }
  };
 
  const onCloseWarning = () => {
      setCommentSaved(true)
      setShowWarningPopup(false)
  }
   
  const handleClickOutsideModal = () =>  console.log("click outside of modal, do nothing")

  return (
    <div className="popup--modal-overlay" onClick={handleClickOutsideModal}>
      <div className="popup--modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Title Bar / Header Section */}
        <div className="popup--header-container">
          <div className="popup--previous-location-sgv" onClick={() => handleRequestNextPrev(-1)}>
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

          <div className="popup--next-location-sgv" onClick={() => handleRequestNextPrev(1)}>
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
                <div className="popup--container">
                  <DisplayMedia currentMarker={currentLocation} />
                </div>
              )}
              {activeTab === 'AI-Gen' && (
                <div className="popup--container popup--ai-gen">
                  <AIGenComments 
                    currentMarker={currentLocation}
                    tripID={tripID}
                    user={user} 
                    commentSaved={commentSaved}
                    setCommentSaved={setCommentSaved}/>
                </div>
              )}
              {activeTab === 'Edit-Comments' && (
                <ManageComments 
                  user={user}
                  currentMarker={currentLocation} 
                  tripID={tripID} 
                  currentDisplayName={currentDisplayName} 
                  currentTextColor={currentTextColor}
                  onUpdateUser={handleUpdateUser}
                  refreshComments={refreshComments}  // ✅ New prop to trigger re-fetch
                />

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

      {showInvlidDisplayNameModal && (
        <SyntaxCheck
          validDisplayNames={validDisplayNames}
          onClose={onClose}
          onRestore={onRestore}
        />
      )}

      {showWarningPopup && (
        <SaveWarning onCloseWarning={onCloseWarning} />
      )}

    </div>
  );
};

export default locationDetails;
