import { useCallback, useEffect, useRef, useState } from 'react';
import LightGallery from 'lightgallery/react';
import lgVideo from 'lightgallery/plugins/video';
import lgFullscreen from 'lightgallery/plugins/fullscreen';

import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-fullscreen.css';
import './mapPopup.css';

const DisplaySopt = ({ onRequestClose }) => {
  const lightGalleryRef = useRef(null);
  const containerRef = useRef(null);
  const [galleryContainer, setGalleryContainer] = useState(null);
  const [height, setHeight] = useState('800px');
  const [isFullScreen, setIsFullScreen] = useState(false); // Fullscreen state

  const onInit = useCallback((detail) => {
    if (detail) {
      lightGalleryRef.current = detail.instance;
      lightGalleryRef.current.openGallery();
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setGalleryContainer(containerRef.current);
    }
  }, []);

  useEffect(() => {
    const adjustHeight = () => {
        console.log ('adjusting')
      const width = window.innerWidth;

      if (!isFullScreen) {
        if (width > 800) {
          setHeight('800px');
        } else {
          setHeight('60vh');
        }
      }
    };

    window.addEventListener('resize', adjustHeight);
    adjustHeight();

    return () => {
      window.removeEventListener('resize', adjustHeight);
    };
  }, [isFullScreen]);

  const handleFillWindow = () => {
    setIsFullScreen((prev) => !prev);
  };

  const galleryItems = [
    {
      src: 'https://images.unsplash.com/photo-1542103749-8ef59b94f47e?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80',
      thumb: 'https://images.unsplash.com/photo-1542103749-8ef59b94f47e?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    },
    {
      src: 'https://www.youtube.com/watch?v=IUN664s7N-c',
      poster: 'https://img.youtube.com/vi/IUN664s7N-c/hqdefault.jpg',
    },
    {
      src: 'https://www.youtube.com/watch?v=ttLu7ygaN6I',
      poster: 'https://img.youtube.com/vi/ttLu7ygaN6I/hqdefault.jpg',
    },
    {
      src: 'https://www.youtube.com/watch?v=C3vyugaBhSs',
      poster: 'https://img.youtube.com/vi/C3vyugaBhSs/hqdefault.jpg',
    },
  ];

  const HeaderComponent = () => (
    <div className="header">
      <h1 className="header__title">lightGallery</h1>
    </div>
  );

  return (
    <div className="popup--modal-overlay" onClick={onRequestClose}>
      <div
        className={`popup--modal-content ${isFullScreen ? 'popup--fullscreen' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup--header-container">
          <div className="popup--previous-location-sgv">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="previous-button-svg"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
              <polyline points="14 16 10 12 14 8" />
            </svg>
          </div>

          <h2 className="popup--spot-location-title">Title</h2>

          <div className="popup--fill-window-sgv" onClick={handleFillWindow}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="fill-window-button-svg"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
              <polyline points="12 14 12 10 8 12" />
            </svg>
          </div>

          <div className="popup--next-location-sgv">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="next-button-svg"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
              <polyline points="10 8 14 12 10 16" />
            </svg>
          </div>

          <div className="popup--close-window-sgv" onClick={onRequestClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="close-button-svg"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
              <line x1="8" y1="8" x2="16" y2="16" />
              <line x1="16" y1="8" x2="8" y2="16" />
            </svg>
          </div>
        </div>

        <HeaderComponent />
        <div ref={containerRef} style={{ height: isFullScreen ? '100%' : height }}></div>

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
            dynamicEl={galleryItems}
            videojs
            videojsOptions={{
              muted: false,
              controls: true,
              autoplay: false,
            }}
            hash={false}
            elementClassNames={'inline-gallery-container'}
          ></LightGallery>
        </div>
      </div>
    </div>
  );
};

export default DisplaySopt;



