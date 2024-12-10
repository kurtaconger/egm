import { useEffect, useState } from 'react';
import './style.css';
import fetchMediaFromFirebase from '../utils/fetchMediaFromFirebase';

import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { useSwipeable } from 'react-swipeable';

const DisplaySpot = ({ onRequestClose, locations, currentLocation }) => {
  const [formattedMedia, setFormattedMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % formattedMedia.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? formattedMedia.length - 1 : prevIndex - 1
    );
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  useEffect(() => {
    const fetchMedia = async () => {
      if (currentLocation && locations) {
        const mediaPaths = currentLocation.media;
        const mediaItems = await fetchMediaFromFirebase(mediaPaths);
        const formatted = mediaItems.map((item) => item.original);
        console.log ("formatted media " + formatted[2])
        setFormattedMedia(formatted);
      }
    };

    fetchMedia();
  }, [currentLocation]);

  const renderMedia = () => {
    const currentMedia = formattedMedia[currentIndex];
    console.log('Current media being rendered:', currentMedia);
  
    if (currentMedia?.endsWith('.mp4')) {
      return (
        <video controls autoplay muted style="width: 100%; height: auto;">
        https://firebasestorage.googleapis.com/v0/b/your-bucket/o/uploaded_media%2FBezos-yacht-mp4.mp4?alt=media&token=xyz
      </video>
      
      );
    }
  
    return (
      <img
        src={currentMedia}
        alt={`Slide ${currentIndex + 1}`}
        className="gallery-image"
        style={{ width: '100%', height: 'auto' }}
      />
    );
  };
  

  return (
    <div className="popup--modal-overlay" onClick={onRequestClose}>
      <div className="popup--modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="App">
          <div className="carousel-container">
            <div
              {...handlers}
              className={`image-gallery ${isFullscreen ? 'fullscreen' : ''}`}
            >
              <ArrowBackIosNewIcon
                className="arrow back-arrow"
                onClick={handlePrevious}
              />
              {renderMedia()}
              <ArrowForwardIosIcon
                className="arrow forward-arrow"
                onClick={handleNext}
              />
              <FullscreenIcon
                className="fullscreen-icon"
                onClick={toggleFullscreen}
              />
              <div className="indicator">{`${currentIndex + 1} / ${formattedMedia.length}`}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisplaySpot;
