import { useEffect, useState } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { storage } from '../utils/firebase';
import './locationDetails.css';

const DisplayMedia = ({ currentMarker }) => {
  const [mediaUrls, setMediaUrls] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        if (!currentMarker || !currentMarker.media || !Array.isArray(currentMarker.media)) {
          console.error('Invalid currentMarker or media array');
          setLoading(false); // Stop loading if media array is invalid
          return;
        }

        // Fetch URLs for the media files from Firebase Storage
        const urls = await Promise.all(
          currentMarker.media.map(async (path) => {
            const fileRef = ref(storage, path);
            return await getDownloadURL(fileRef);
          })
        );

        setMediaUrls(urls);
        setLoading(false);
        console.log('Media URLs fetched:', urls);
      } catch (error) {
        console.error('Error fetching media URLs:', error);
        setLoading(false);
      }
    };

    fetchMedia();
  }, [currentMarker]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [currentMarker]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % mediaUrls.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? mediaUrls.length - 1 : prevIndex - 1
    );
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderMedia = () => {
    if (!mediaUrls.length || !mediaUrls[currentIndex]) {
      return <p>Loading media...</p>;
    }

    const currentMedia = mediaUrls[currentIndex];
    console.log('Current media being rendered:', currentMedia);

    if (currentMedia.includes('.mp4')) {
      return (
        <video
          controls
          muted
          loop
          className="gallery-video"
        >
          <source src={currentMedia} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    }

    return (
      <img
        src={currentMedia}
        alt={`Slide ${currentIndex + 1}`}
        className="gallery-image"
      />
    );
  };

  if (loading) {
    return (
      <div className="popup--modal-overlay">
        <p>Loading media...</p>
      </div>
    );
  }

  if (!mediaUrls.length) {
    return (
      <div>
        <p className="popup--warning-message">No Pictures or Videos have been loaded for this location. Use menu option "Load Pictures" to load pictures or videos.</p>
      </div>
    );
  }

  return (
    <div className="carousel-container">
      <div className={`image-gallery ${isFullscreen ? 'fullscreen' : ''}`}>
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
        <div className="indicator">{`${currentIndex + 1} / ${mediaUrls.length}`}</div>
      </div>
    </div>
  );
};

export default DisplayMedia;
