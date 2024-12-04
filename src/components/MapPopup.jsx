import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Tab, Box, Typography } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AssistantIcon from '@mui/icons-material/Assistant';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';

import LightGallery from 'lightgallery/react';
import lgVideo from 'lightgallery/plugins/video';
import lgFullscreen from 'lightgallery/plugins/fullscreen';

import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-fullscreen.css';

import AIGenComments from './AIGenComments';
import ManageComments from './ManageComments';
import CommentsSummery from './CommentsSummery';

import loadMedia from '../utils/loadMedia';

import './mapPopup.css';

// Construct Tabs
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

const MapPopup = ({ onRequestClose, currentMarker, tripID, onRequestNext, onRequestPrev, user }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [formattedMedia, setFormattedMedia] = useState([]);
  const lightGalleryRef = useRef(null);
  const containerRef = useRef(null);
  const [galleryContainer, setGalleryContainer] = useState(null);

  const onInit = useCallback((detail) => {
    if (detail) {
      lightGalleryRef.current = detail.instance;
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setGalleryContainer(containerRef.current);
    }
  }, []);

  useEffect(() => {
    const fetchMedia = async () => {
      if (currentMarker) {
        console.log('Fetching media for marker:', currentMarker);
        const media = await loadMedia(currentMarker, tripID);
        const formatted = media.map((item) => ({
          src: item.original,
          thumb: item.thumbnail || item.original,
          poster: item.isVideo ? item.original : undefined,
        }));
        console.log('[DEBUG] Formatted Media:', formatted);
        setFormattedMedia(formatted);
      }
    };
    fetchMedia();
  }, [currentMarker, tripID]);

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

  const handleRequestClose = () => {
    console.log('Closing MapPopup');
    setTabIndex(0);
    onRequestClose();
  };

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

          <h2 className="popup--spot-location-title">{currentMarker?.shortName || 'No Title'}</h2>

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
              <Tab key={index} icon={tab.icon} label={<span style={{ fontSize: '14px' }}>{tab.label}</span>} />
            ))}
          </Tabs>

          <div className="popup--display-container">
            {tabIndex === 0 && (
              <TabPanel value={tabIndex} index={0}>

                <div className='placeholder'>placeholder</div>

                <div ref={containerRef}></div>
                <div className="carousel-container">
                  <LightGallery
                    container={galleryContainer}
                    licenseKey="82466149-235C-4086-A637-35D49AFC4BC6"
                    onInit={onInit}
                    plugins={[lgVideo, lgFullscreen]}
                    closable={false}
                    showMaximizeIcon={true}
                    slideDelay={400}
                    appendSubHtmlTo={'.lg-item'}
                    dynamic={true}
                    dynamicEl={formattedMedia}
                    videojs
                    videojsOptions={{
                      muted: false,
                      controls: true,
                      autoplay: false,
                    }}
                    hash={false}
                    elementClassNames={'inline-gallery-container'}
                  />
                </div>
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
