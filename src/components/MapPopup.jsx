import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, Box, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AssistantIcon from '@mui/icons-material/Assistant';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';
import LightGallery from 'lightgallery/react';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-fullscreen.css';
import 'lightgallery/css/lg-video.css';
import lgFullscreen from 'lightgallery/plugins/fullscreen';
import lgVideo from 'lightgallery/plugins/video';

import AIGenComments from './AIGenComments';
import ManageComments from './ManageComments';
import CommentsSummery from './CommentsSummery';

import loadMedia from '../utils/loadMedia';

import './mapPopup.css';

const lightGalleryLic = import.meta.env.VITE_LIGHT_GALLERY_LIC;


const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`tabpanel-${index}`}
    aria-labelledby={`tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box p={0.4}>
        <Typography component="div">{children}</Typography>
      </Box>
    )}
  </div>
);

TabPanel.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
  other: PropTypes.object,
};

const MapPopup = ({ isOpen, onRequestClose, currentMarker, tripID, onRequestNext, onRequestPrev, user }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [formattedMedia, setFormattedMedia] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);

  const isMobile = useMediaQuery('(max-width:600px)');

  const tabs = useMemo(
    () => [
      { icon: <PhotoCameraIcon />, label: <span>Photos/<br />Videos</span> },
      { icon: <KeyboardVoiceIcon />, label: <span>AI<br />Interview</span> },
      { icon: <EditIcon />, label: <span>Edit<br />Comments</span> },
      { icon: <AssistantIcon />, label: <span>Comments<br />Summary</span> },
    ],
    []
  );

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const handleExitFullScreen = () => {
    setIsFullscreen(false);
    document.body.style.overflow = 'auto';
  };

  useEffect(() => {
    const fetchMedia = async () => {
      if (isOpen && currentMarker) {
        const media = await loadMedia(currentMarker, tripID);
        const formatted = media.map((item) => ({
          src: item.original,
          thumb: item.thumbnail || item.original,
          poster: item.isVideo ? item.original : undefined,
          html: item.isVideo
            ? `<video controls><source src="${item.original}" type="video/mp4"></video>`
            : undefined,
        }));
        setFormattedMedia(formatted);
      }
    };
    fetchMedia();
  }, [isOpen, currentMarker, tripID]);

  useEffect(() => {
    if (isOpen) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
        } else {
          setTimeout(loadVoices, 500);
        }
      };
      loadVoices();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFormattedMedia([]);
      setTabIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isFullscreen) {
      const container = document.querySelector('.popup--modal-content');
      if (container) {
        container.style.transform = 'scale(1)';
        container.offsetHeight;
      }
    }
  }, [isFullscreen]);

  const handleRequestClose = () => {
    setTabIndex(0);
    onRequestClose();
  };

  if (!isOpen || !currentMarker) return null;

  return (
    <div className="popup--modal-overlay" onClick={handleRequestClose}>
      <div className="popup--modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="popup--header-container">
          <div className="popup--previous-location-sgv" onClick={onRequestPrev}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="previous-button-svg">
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
              <polyline points="14 16 10 12 14 8" />
            </svg>
          </div>

          <h2 className="popup--spot-location-title">{currentMarker.shortName || 'No Title'}</h2>

          <div className="popup--next-location-sgv" onClick={onRequestNext}>
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

        <div className="popup--button-and-display-container">
          <Tabs value={tabIndex} onChange={handleTabChange} aria-label="Map popup tabs">
            {tabs.map((tab, index) => (
              <Tab key={index} icon={tab.icon} label={<span style={{ fontSize: isMobile ? '12px' : '14px' }}>{tab.label}</span>} />
            ))}
          </Tabs>

          <div className="popup--display-container">
            {tabIndex === 0 && (
              
              <TabPanel value={tabIndex} index={0}>
                  {console.log('[DEBUG] LightGallery dynamicEl:', formattedMedia)}
                <LightGallery
                  speed={500}
                  licenseKey={lightGalleryLic}
                  plugins={[lgFullscreen, lgVideo]}
                  dynamic
                  dynamicEl={formattedMedia}
                  onBeforeOpen={() => setIsFullscreen(true)}
                  onCloseAfter={() => setIsFullscreen(false)}
                />
              </TabPanel>
            )}
            {tabIndex === 1 && (
              <TabPanel value={tabIndex} index={1}>
                <AIGenComments currentMarker={currentMarker} tripID={tripID} user={user} resetAIInterview={tabIndex === 1} />
              </TabPanel>
            )}
            {tabIndex === 2 && (
              <TabPanel value={tabIndex} index={2}>
                <ManageComments user={user} currentMarker={currentMarker} tripID={tripID} />
              </TabPanel>
            )}
            <TabPanel value={tabIndex} index={3}>
              <CommentsSummery currentMarker={currentMarker} tripID={tripID} />
            </TabPanel>
          </div>
        </div>
      </div>
    </div>
  );
};

MapPopup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onRequestClose: PropTypes.func.isRequired,
  currentMarker: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    shortName: PropTypes.string,
  }),
  tripID: PropTypes.string.isRequired,
  onRequestNext: PropTypes.func.isRequired,
  onRequestPrev: PropTypes.func.isRequired,
  user: PropTypes.object,
};

export default MapPopup;


