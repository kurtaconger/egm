import { useState, useEffect } from 'react';
import './navigation.css';
import { doc, getDocs, setDoc, collection } from 'firebase/firestore';
import { db, auth } from '../utils/firebase';
import { signOut } from "firebase/auth";

const ReplaceDisplayNameAndColor = ({ user, tripID, onClose }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [hexColor, setHexColor] = useState(user.hexColor || '');
  const [nameChanged, setNameChanged] = useState(false);
  const [currentUsers, setCurrentUsers] = useState({});
  const [temporaryUsers, setTemporaryUsers] = useState({}); // Stores temporary UI updates

  // Define available colors
  const colors = [
    '#0000CC', '#008000', '#000000', '#B22222', '#800080',
    '#FF8C00', '#008080', '#8B4513', '#800000', '#333333',
  ];

  // Fetch existing users and their assigned colors
  useEffect(() => {
    const fetchUserData = async () => {
      console.log('Fetching users from Firebase...');
  
      const tripNameUsers = `TRIP-${tripID}-USERS`;
      const usersCollectionRef = collection(db, tripNameUsers);
      const usersSnapshot = await getDocs(usersCollectionRef);
  
      let userMap = {};
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.hexColor) {
          userMap[userData.hexColor.toUpperCase()] = userData.displayName;
        }
      });

      console.log("📌 Updated User List from Firebase:", userMap);
      setCurrentUsers(userMap);
      setTemporaryUsers(userMap);
    };
  
    fetchUserData();
  }, [tripID]);

  // Handle color selection (updates UI immediately)
  const handleColorClick = (color) => {
    const normalizedColor = color.toUpperCase();

    if (currentUsers[normalizedColor]) return; // Prevent selection if taken

    setHexColor(normalizedColor);

    setTemporaryUsers((prevTempUsers) => {
        const updatedTempUsers = { ...prevTempUsers };
      
        // Remove user from previously selected color
        if (hexColor && updatedTempUsers[hexColor] === displayName) {
          updatedTempUsers[hexColor] = "Available";
        }
      
        // Assign new color to user
        updatedTempUsers[normalizedColor] = displayName;
      
        return updatedTempUsers;
      });
      
  };

  // Track if the user changes their display name
  const handleNameChange = (e) => {
    setDisplayName(e.target.value);
    setNameChanged(true);
  };

  // Function to update all content and snapshotContent fields
  const updateAllUserReferences = async (tripID, oldDisplayName, oldHexColor, newDisplayName, newHexColor) => {
    try {
      const tripDataCollectionRef = collection(db, `TRIP-${tripID}-DATA`);
      const snapshot = await getDocs(tripDataCollectionRef);

      const batchUpdates = snapshot.docs.map(async (docRef) => {
        const docData = docRef.data();
        let updated = false;

        const replaceValues = (data) => {
          if (typeof data === "string") {
            return data.replaceAll(oldDisplayName, newDisplayName).replaceAll(oldHexColor, newHexColor);
          } else if (Array.isArray(data)) {
            return data.map((item) => replaceValues(item));
          }
          return data;
        };

        if (docData.content) {
          const newContent = replaceValues(docData.content);
          if (newContent !== docData.content) {
            docData.content = newContent;
            updated = true;
          }
        }

        if (docData.snapshotContent) {
          const newSnapshotContent = replaceValues(docData.snapshotContent);
          if (newSnapshotContent !== docData.snapshotContent) {
            docData.snapshotContent = newSnapshotContent;
            updated = true;
          }
        }

        if (updated) {
          return setDoc(doc(db, `TRIP-${tripID}-DATA`, docRef.id), docData, { merge: true });
        }
      });

      await Promise.all(batchUpdates);
      console.log("✅ All occurrences of display name and color updated successfully.");
    } catch (error) {
      console.error("⚠️ Error updating user references:", error);
    }
  };
  
  const handleSave = async () => {
      if (!displayName.trim() || !hexColor) {
          alert("Both display name and color are required.");
          return;
      }
  
      const normalizedHexColor = hexColor.toUpperCase();
      const normalizedDisplayName = displayName.trim().toLowerCase();
      const oldDisplayName = user.displayName.toLowerCase();
      const oldHexColor = user.hexColor ? user.hexColor.toUpperCase() : null;
  
      console.log("📌 Checking against currentUsers before saving:", currentUsers);
  
      try {
          const tripNameUsers = `TRIP-${tripID}-USERS`;
          const usersCollectionRef = collection(db, tripNameUsers);
          const usersSnapshot = await getDocs(usersCollectionRef);
  
          let existingNames = new Set();
          let existingUserColor = null;
  
          usersSnapshot.forEach(doc => {
              const userData = doc.data();
              if (userData.displayName) {
                  existingNames.add(userData.displayName.trim().toLowerCase());
              }
              if (userData.email === user.email) {
                  existingUserColor = userData.hexColor ? userData.hexColor.toUpperCase() : null;
              }
          });
  
          console.log("🔥 Fetched Names from Firebase:", existingNames);
          console.log("🔥 Current User's Existing Color:", existingUserColor);
  
          if (!existingUserColor) {
              existingUserColor = user.hexColor ? user.hexColor.toUpperCase() : null;
          }
  
          // ✅ Detect if only the color changed
          const isOnlyColorChange = (existingUserColor !== normalizedHexColor) && (normalizedDisplayName === oldDisplayName);
  
          if (isOnlyColorChange) {
              console.log("🔹 User is only changing color, skipping name validation.");
          } else {
              // ✅ Ensure new name is unique only if it has changed
              if (normalizedDisplayName !== oldDisplayName && existingNames.has(normalizedDisplayName)) {
                  alert(`This display name "${displayName}" is already taken.`);
                  return;
              }
          }
  
          // ✅ Ensure color isn't already taken
          if (currentUsers[normalizedHexColor] && currentUsers[normalizedHexColor] !== displayName) {
              alert("This color is already assigned to another user.");
              return;
          }
  
          // ✅ Update Firebase
          const userDocRef = doc(db, `TRIP-${tripID}-USERS`, user.email);
          await setDoc(userDocRef, { displayName, hexColor: normalizedHexColor }, { merge: true });
  
          console.log("✅ User details updated successfully in Firebase.");
  
          // ✅ Update references in all content fields
          await updateAllUserReferences(tripID, user.displayName, user.hexColor, displayName, normalizedHexColor);
  
          // ✅ Update UI to remove old color and assign new one
          setCurrentUsers((prevUsers) => {
              const updatedUsers = { ...prevUsers };
  
              // 🔥 Remove user from old color (if they changed colors)
              if (existingUserColor && existingUserColor !== normalizedHexColor) {
                  if (updatedUsers[existingUserColor] === displayName) {
                      updatedUsers[existingUserColor] = "Available";
                  }
              }
  
              // 🔥 Assign new color
              updatedUsers[normalizedHexColor] = displayName;
  
              return updatedUsers;
          });
  
          // ✅ Update temporary state to reflect immediate UI changes
          setTemporaryUsers((prevTempUsers) => {
              const updatedTempUsers = { ...prevTempUsers };
  
              // Remove user from old color
              if (existingUserColor && existingUserColor !== normalizedHexColor) {
                  if (updatedTempUsers[existingUserColor] === displayName) {
                      updatedTempUsers[existingUserColor] = "Available";
                  }
              }
  
              // Assign new color
              updatedTempUsers[normalizedHexColor] = displayName;
  
              return updatedTempUsers;
          });
  
          // ✅ Logout the user after committing Firebase updates
          console.log("🚪 Logging user out...");
          signOut(auth)
              .then(() => {
                  console.log("✅ User successfully logged out.");
                  window.location.reload(); // Refresh the app after logout
              })
              .catch((error) => {
                  console.error("⚠️ Error during logout:", error);
              });
  
      } catch (error) {
          console.error("⚠️ Error saving user data:", error);
          alert("Error updating user settings.");
      }
  }; 

  return (
    <div className="modal--overlay">
      <div className="modal--content">
        <div className="modal--header">
          <h2 className="modal--title">Change Display Name and Color</h2>
          <button className="modal--close-button" onClick={onClose}>X</button>
        </div>

        <div className="select--body">
          <div className="select--container">
            <label className="config--label">Unique User Identifier</label>
            <input type="text" value={user.email} readOnly className="config--input" />

            <label className="config--label">User Name</label>
            <input
              type="text"
              value={displayName}
              onChange={handleNameChange}
              className="config--input"
            />

            <label className="config--label">User Color</label>
            <input
              type="text"
              value={hexColor}
              readOnly
              className="config--input color-input-disabled"
              style={{ color: hexColor }}
            />

            <div className="color--grid">
              {colors.map((color, index) => {
                const normalizedColor = color.toUpperCase();
                const assignedUser = temporaryUsers[normalizedColor] || currentUsers[normalizedColor] || "Available";

                return (
                  <div key={index} className="color--grid-item">
                    <button
                      className="color--button"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorClick(color)}
                      disabled={currentUsers[normalizedColor]}
                    />
                    <span className="color--label">
                      {assignedUser === "Available" ? assignedUser : <strong>{assignedUser}</strong>}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="select--button-container">
              <button className="modal--button" onClick={handleSave}>Update User</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplaceDisplayNameAndColor;



