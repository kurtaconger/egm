import { useEffect, useState, useRef } from 'react';
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
  const fullscreenRef = useRef(null); // Ref for fullscreen container
  const touchStartX = useRef(null); // Track touch start X coordinate
  const touchStartY = useRef(null); // Track touch start Y coordinate

  // useEffect(() => {
  //   const fetchMediaUrls = async () => {
  //     try {
  //       const files = [
  //               "BI-pool-h.jpg",
  //               "BI-moped-h.jpg",
  //               "Baths-P23.jpg",
  //               "Sunset over harbor.jpg",
  //               "IMG_0285.jpeg",
  //               "small-test.mp4",
  //                     ];

  //     const urls = await Promise.all(
  //       files.map(async (file) => {
  //         const fileRef = ref(storage, `uploaded_media/${file}`);
  //         return {
  //           url: await getDownloadURL(fileRef),
  //           type: file.endsWith('.mp4') ? 'video' : 'image',
  //         };
  //       })
  //     );

  //     setMediaUrls(urls);
  //     } catch (error) {
  //     console.error('Error fetching media URLs:', error);
  //     }
  //     };

  //     fetchMediaUrls();
  //     }, []);



  useEffect(() => {
    const fetchMedia = async () => {
      try {
        if (!currentMarker || !currentMarker.media || !Array.isArray(currentMarker.media)) {
          console.error('Invalid currentMarker or media array');
          setLoading(false); // Stop loading if media array is invalid
          return;
        }
  
        // Fetch URLs and types for the media files from Firebase Storage
        const urls = await Promise.all(
          currentMarker.media.map(async (path) => {
            const fileRef = ref(storage, path);
            const url = await getDownloadURL(fileRef);
            return {
              url,
              type: path.endsWith('.mp4') ? 'video' : 'image',
            };
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
    if (isFullscreen) {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    } else {
      if (fullscreenRef.current?.requestFullscreen) {
        fullscreenRef.current.requestFullscreen();
      } else {
        fullscreenRef.current.style.position = 'fixed';
        fullscreenRef.current.style.top = '0';
        fullscreenRef.current.style.left = '0';
        fullscreenRef.current.style.width = '100vw';
        fullscreenRef.current.style.height = '100vh';
        fullscreenRef.current.style.zIndex = '9999';
      }
      setIsFullscreen(true);
    }
  };

  const exitFullscreenOnEscape = (e) => {
    if (e.key === 'Escape' && isFullscreen) {
      setIsFullscreen(false);
      if (fullscreenRef.current) {
        fullscreenRef.current.style.position = '';
        fullscreenRef.current.style.top = '';
        fullscreenRef.current.style.left = '';
        fullscreenRef.current.style.width = '';
        fullscreenRef.current.style.height = '';
        fullscreenRef.current.style.zIndex = '';
      }
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current || !touchStartY.current) return;

    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;

    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 50) {
        handleNext();
        touchStartX.current = null;
        touchStartY.current = null;
      } else if (diffX < -50) {
        handlePrevious();
        touchStartX.current = null;
        touchStartY.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
  };

  useEffect(() => {
    document.addEventListener('keydown', exitFullscreenOnEscape);
    return () => {
      document.removeEventListener('keydown', exitFullscreenOnEscape);
    };
  }, [isFullscreen]);




  return (
    <div className={`media-component ${isFullscreen ? 'fullscreen' : ''}`} ref={fullscreenRef}>
      <div className="carousel-container" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
      >
        <ArrowBackIosNewIcon className="arrow back-arrow" onClick={handlePrevious} />

        {mediaUrls.length > 0 && mediaUrls[currentIndex].type === 'video' ? (
          <video className="carousel-media" src={mediaUrls[currentIndex].url} controls></video>
        ) : (
          <>
            <img className="carousel-media" src={mediaUrls[currentIndex]?.url} alt="carousel content"
            />
            <FullscreenIcon className="fullscreen-icon" onClick={toggleFullscreen} />
          </>
        )}

        <ArrowForwardIosIcon className="arrow forward-arrow" onClick={handleNext} />

        <div className="indicator">{`${currentIndex + 1} / ${mediaUrls.length}`}</div>
      </div>
    </div>
  )
};

export default DisplayMedia;
