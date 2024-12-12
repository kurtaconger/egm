import { useEffect, useState } from 'react';
import './style.css';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import FullscreenIcon from '@mui/icons-material/Fullscreen';

// Firebase Configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCF3ydrhMuURLzs09E_wk0TZyjx4-vJWQw',
  authDomain: 'm-y-m-660ec.firebaseapp.com',
  projectId: 'm-y-m-660ec',
  storageBucket: 'm-y-m-660ec.appspot.com',
  messagingSenderId: '509277052904',
  appId: '1:509277052904:web:1122937f1d33c2a2540e5d',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const DisplayMedia = ({ currentMarker }) => {
  const [mediaUrls, setMediaUrls] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        if (!currentMarker || !currentMarker.media || !Array.isArray(currentMarker.media)) {
          console.error('Invalid currentMarket or media array');
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
        setLoading(false); // Mark as loaded
        console.log('Media URLs fetched:', urls);
      } catch (error) {
        console.error('Error fetching media URLs:', error);
      }
    };

    fetchMedia();
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
          autoPlay
          muted
          loop
          className="gallery-video"
          style={{ width: '100%', height: 'auto' }}
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
        style={{ width: '100%', height: 'auto' }}
      />
    );
  };

  // Ensure rendering happens only after media is loaded
  if (loading) {
    return <div className="popup--modal-overlay"><p>Loading media...</p></div>;
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

