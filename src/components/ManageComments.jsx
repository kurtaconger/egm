import React, { useEffect, useRef, useState } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import ReplaceDisplayNameAndColor from './ReplaceDisplayNameAndColor';
import './locationDetails.css';


const ManageComments = ({ user, currentMarker, tripID, currentDisplayName, currentTextColor, onUpdateUser, refreshComments }) => {
  if (!user) {
    return <p>This function requires a login. Press the Login button in the upper right corner of the screen.</p>;
  }

  const [content, setContent] = useState('');
  const [showUserDisplay, setShowUserDisplay] = useState(false);
  const editableRef = useRef(null);
  const tripNameData = `TRIP-${tripID}-DATA`;
  const currentDocumentID = currentMarker.id;
  const mouseTimeout = useRef(null);

  // Make sure editable div is up to date
  useEffect(() => {
    if (editableRef.current) {
      console.log("Current Display Name:", currentDisplayName);
      console.log("Editable Content Before Update:", editableRef.current.innerHTML);
  
      let updatedContent = editableRef.current.innerHTML.replace(/\[([^\]]+)\]/g, `[${currentDisplayName}]`);
      editableRef.current.innerHTML = updatedContent;
      setContent(updatedContent);
  
      console.log("Editable Content After Update:", editableRef.current.innerHTML);
    }
  }, [currentDisplayName]);
  
  useEffect(() => {
    const fetchContent = async () => {
      try {
        console.log("🔄 Fetching latest comments from Firebase...");
        const docRef = doc(db, tripNameData, currentDocumentID);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const fetchedContent = docSnap.data().content || '';
          setContent(fetchedContent);
          
          if (editableRef.current) {
            editableRef.current.innerHTML = fetchedContent;  // ✅ Refresh content from Firebase
          }
  
          console.log("✅ Comments refreshed from Firebase:", fetchedContent);
        }
      } catch (error) {
        console.error("⚠️ Error fetching updated content:", error);
      }
    };
  
    fetchContent();
  }, [tripNameData, currentDocumentID, refreshComments]);  // ✅ Refresh when refreshComments updates
  
  const handleFirstClick = () => {
    if (editableRef.current) {
        let cleanedContent = editableRef.current.innerHTML.trim();

        // Remove any auto-inserted <p><br></p> if it's empty
        if (cleanedContent === "<p><br></p>" || cleanedContent === "<br>") {
            cleanedContent = "";
            editableRef.current.innerHTML = ""; // Clear the editable div
        }

        const existingSpanRegex = /<span[^>]*>\s*\[[^\]]+\]\s*<\/span>/g;
        cleanedContent = cleanedContent.replace(existingSpanRegex, ""); // Remove old spans

        const userNameTag = `[${currentDisplayName}]&nbsp;`; // Ensures space is inserted
        const styledUserName = `<span class="user-display-name" style="color: ${currentTextColor}">${userNameTag}</span>`;

        const updatedContent = cleanedContent + styledUserName;
        setContent(updatedContent);
        editableRef.current.innerHTML = updatedContent;

        console.log("✅ Updated Content with Display Name:", updatedContent);

        // ✅ Move cursor to the end of the inserted text
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editableRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }
};
 
  const handleInput = async () => {
    if (editableRef.current) {
      const updatedContent = editableRef.current.innerHTML;
      setContent(updatedContent);

      // Update Firebase with the new content
      try {
        const docRef = doc(db, tripNameData, currentDocumentID);
        await setDoc(docRef, { content: updatedContent }, { merge: true });
        console.log('Content updated in Firebase:');
      } catch (error) {
        console.error('Error updating content in Firebase:', error);
      }
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain'); // Get plain text from the clipboard
    document.execCommand('insertText', false, text); // Insert plain text at the cursor
  };

  const handleKeyDown = (event) => {
    if (event.key === '[' || event.key === ']') {
      event.preventDefault(); // Prevent the default input behavior
      alert('Brackets are reserved characters indicating the author of a comment');
    }
  };

  const handleMouseDown = (event) => {
    console.log('Mouse down detected');
    mouseTimeout.current = setTimeout(() => {
      setShowUserDisplay(true);
      console.log('Long press detected, showing UpdateUserName');
    }, 700);
  };

  const handleMouseUp = () => {
    console.log('Mouse up detected');
    if (mouseTimeout.current) {
      clearTimeout(mouseTimeout.current); // Clear timeout if mouse is released early
      mouseTimeout.current = null;
      console.log('Mouse up before long press, timeout cleared');
    }
  };

  const closeUserDisplay = () =>  setShowUserDisplay(false);

  return (
    <div className="comments--editor-control-div">
      <div 
      className='comments--message'
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}>
        Comments being added/edited by <span className='comments--name'>{currentDisplayName}</span>
      </div>
      <div
        ref={editableRef}
        className="comments--editable-container"
        contentEditable="true"
        suppressContentEditableWarning={true} 
        spellCheck="true"
        onClick={handleFirstClick}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
      ></div>
      {showUserDisplay && (
        <ReplaceDisplayNameAndColor
          user={user}
          tripID={tripID}
          onClose={() => setShowUserDisplay(false)}
        />
      )}
    </div>
  );
};

export default ManageComments;