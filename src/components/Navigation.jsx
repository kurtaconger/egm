import { useState } from 'react';
import './navigation.css';
import ManagePictures from './ManagePictures';
import Configure from './Configure';
import AddStops from './AddStops';
import AddUser from './AddUser';
import Account from './Account';
import LoginIcon from '@mui/icons-material/Login';
import { Avatar } from '@mui/material';
import { getAuth, signOut } from 'firebase/auth';

function Navigation({
  tripTitle,
  toggleMapPopups,
  rotateMap,
  tripID,
  mapboxAccessToken,
  onLogin
}) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isPictureModalOpen, setIsPictureModalOpen] = useState(false);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAddStopsModalOpen, setIsAddStopsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  const toggleNav = () => setIsNavOpen(!isNavOpen);
  const handlePictureButtonClick = () => { setIsPictureModalOpen(true); setIsNavOpen(false); };
  const handleConfigureButtonClick = () => { setIsConfigureModalOpen(true); setIsNavOpen(false); };
  const handleAddStopsButtonClick = () => { setIsAddStopsModalOpen(true); setIsNavOpen(false); };
  const handleUserButtonClick = () => { setIsUserModalOpen(true); setIsNavOpen(false); };
  const handleAccountButtonClick = () => setIsAccountModalOpen(true);

  const closeConfigureModal = () => { setIsConfigureModalOpen(false); };
  const closeAddStopModal = () => { setIsAddStopsModalOpen(false); };
  const closeAccountModal = () => setIsAccountModalOpen(false);
  const closeUserModal = () => setIsUserModalOpen(false);

  const handleLogin = (userInfo) => {
    setUser(userInfo);
    onLogin(userInfo);
    closeAccountModal();
  };

  const handleLogout = () => {
    const auth = getAuth();
    signOut(auth).then(() => {
      setUser(null);
    }).catch((error) => {
      console.error("Logout failed:", error);
    });
  };

  return (
    <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 400 }}>
      <div className='nav--map-top-row'>
        <div className='nav--map-title-container'>
          <div className='nav--map-top-buttons'>
            <i className="material-icons" style={{ fontSize: '32px' }} onClick={toggleNav}>menu</i>
          </div>
          <div className='nav--map-title'>{tripTitle}</div>
        </div>
        <div className='nav--map-top-buttons'>
          <i className="material-icons" style={{ fontSize: '32px', cursor: 'pointer', marginRight: '10px', verticalAlign: 'middle' }} onClick={rotateMap}>
            autorenew
          </i>
          <i className="material-icons" style={{ fontSize: '32px', cursor: 'pointer', marginRight: '10px', verticalAlign: 'middle' }} onClick={toggleMapPopups}>
            loupe
          </i>
          {user ? (
            <Avatar
              src={user.photoURL || ''}
              alt={user.displayName || ''}
              style={{
                cursor: 'pointer',
                width: '32px',
                height: '32px',
                marginRight: '10px',
                display: 'inline-flex',
                verticalAlign: 'middle'
              }}
              onClick={handleLogout}
            >
              {!user.photoURL && user.displayName ? user.displayName[0] : null}
            </Avatar>
          ) : (
            <LoginIcon style={{ fontSize: '32px', cursor: 'pointer', marginRight: '10px', verticalAlign: 'middle' }} onClick={handleAccountButtonClick} />
          )}
        </div>
      </div>

      {isNavOpen && (
        <div className='nav--outer-container'>
          <div className="nav--button-container">
            <button className='nav--button' onClick={handleConfigureButtonClick}>Add Title</button>
            <button className='nav--button' onClick={handleAddStopsButtonClick}>Add Stops</button>
            <button className='nav--button' onClick={handleUserButtonClick}>Add Users</button>
            <button className='nav--button' onClick={handlePictureButtonClick}>Upload Pictures</button>
            <button className='nav--button'>Select Trips</button>
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

      {isConfigureModalOpen && (
        <Configure
          isConfigureModalOpen={isConfigureModalOpen}
          tripID={tripID}
          onClose={closeConfigureModal}
        />
      )}

      {isAddStopsModalOpen && (
        <AddStops
          onClose={closeAddStopModal}
          tripID={tripID}
          mapboxAccessToken={mapboxAccessToken}
        />
      )}

      {isUserModalOpen && (
        <AddUser
          onClose={closeUserModal}
          tripID={tripID}
        />
      )}

      {isAccountModalOpen && (
        <Account 
          onLogin={handleLogin} 
          onClose={closeAccountModal} 
          tripID={tripID}
        />
      )}
    </div>
  );
}

export default Navigation;


