import { useState, useEffect } from 'react';
import './navigation.css';
import { doc, getDocs, setDoc, collection } from 'firebase/firestore';
import { db } from '../utils/firebase';

const UserDisplayNameAndColor = ({ user, tripID, onClose, updateUser }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [hexColor, setHexColor] = useState(user.hexColor || ''); // ✅ Start empty if no color
  const [nameChanged, setNameChanged] = useState(false);
  const [currentUsers, setCurrentUsers] = useState({});
  const [temporaryUsers, setTemporaryUsers] = useState({});

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
      let userHexColor = ''; // ✅ Default to empty if no color exists
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.email === user.email && userData.hexColor) {
          userHexColor = userData.hexColor.toUpperCase(); // ✅ Store user's actual color
        }
        if (userData.hexColor) {
          userMap[userData.hexColor.toUpperCase()] = userData.displayName;
        }
      });

      console.log("📌 Updated User List from Firebase:", userMap);
      console.log("🎨 Setting User's Current Color:", userHexColor);
      setCurrentUsers(userMap);
      setHexColor(userHexColor); // ✅ Set color, or leave empty if none exists
    };
  
    fetchUserData();
  }, [tripID, user.email]);

  // Handle color selection (updates UI immediately)
  const handleColorClick = (color) => {
    const normalizedColor = color.toUpperCase();

    if (currentUsers[normalizedColor]) return;

    setHexColor(normalizedColor);

    setTemporaryUsers((prevTempUsers) => {
      const updatedTempUsers = { ...prevTempUsers };

      if (hexColor && updatedTempUsers[hexColor]) {
        delete updatedTempUsers[hexColor];
      }

      updatedTempUsers[normalizedColor] = displayName;

      return updatedTempUsers;
    });
  };

  // Detect if the user modifies the name field
  const handleNameChange = (e) => {
    setDisplayName(e.target.value);
    setNameChanged(true);
  };

  // Save user settings to Firebase
  const handleSave = async () => {
    if (!displayName.trim() || !hexColor) {
      alert("Both display name and color are required.");
      return;
    }

    const normalizedHexColor = hexColor.toUpperCase();
    const normalizedDisplayName = displayName.trim().toLowerCase();

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
            console.log("🔥 Using user's stored hexColor as fallback:", existingUserColor);
        }

        if (!nameChanged && existingUserColor === normalizedHexColor) {
            console.log("🔹 User is only changing color, skipping name validation.");
        } else {
            if (nameChanged && existingNames.has(normalizedDisplayName)) {
                alert(`This display name "${displayName}" is already taken.`);
                return;
            }
        }

        if (currentUsers[normalizedHexColor]) {
            alert("This color is already assigned to another user.");
            return;
        }

        // ✅ Save to Firebase
        const userDocRef = doc(db, `TRIP-${tripID}-USERS`, user.email);
        await setDoc(userDocRef, { displayName, hexColor: normalizedHexColor }, { merge: true });

        console.log("✅ User details updated successfully in Firebase.");

        setCurrentUsers((prevUsers) => ({
            ...prevUsers,
            ...temporaryUsers,
        }));

        updateUser({ ...user, displayName, hexColor: normalizedHexColor });
        onClose();
    } catch (error) {
        console.error("⚠️ Error saving user data:", error);
        alert("Error updating user settings.");
    }
  };

  return (
    <div className="modal--overlay">
      <div className="modal--content">
        <div className="modal--header">
          <h2 className="modal--title">Your Display Name and Color</h2>
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
              value={hexColor} // ✅ Show empty if user has no color
              readOnly
              className="config--input color-input-disabled"
              style={{ color: hexColor }}
            />

            {/* Color Selection Grid with 2 Columns */}
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

export default UserDisplayNameAndColor;
