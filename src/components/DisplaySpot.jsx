import { useCallback, useEffect, useRef, useState } from 'react';
import LightGallery from 'lightgallery/react';
import lgVideo from 'lightgallery/plugins/video';
import lgThumbnail from 'lightgallery/plugins/thumbnail';

import 'lightgallery/css/lightgallery.css';
import './style.css';

const DisplaySopt = ({ onRequestClose }) => {
  const lightGalleryRef = useRef(null);
  const containerRef = useRef(null);
  const [galleryContainer, setGalleryContainer] = useState(null);
  const [height, setHeight] = useState('800px'); // Default for wide screens

  console.log ("in DisplaySpot")

  const onInit = useCallback((detail) => {
    if (detail) {
      lightGalleryRef.current = detail.instance;
      lightGalleryRef.current.openGallery();
      console.log ("in init")
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setGalleryContainer(containerRef.current);
    }
  }, []);

  // Adjust the height dynamically based on screen size
  useEffect(() => {
    const adjustHeight = () => {
      const width = window.innerWidth;

      if (width > 800) {
        setHeight('800px'); // Wide screen
      } else {
        setHeight('60vh'); // Narrow screen
      }
    };

    window.addEventListener('resize', adjustHeight);
    adjustHeight(); // Call once on mount

    return () => {
      window.removeEventListener('resize', adjustHeight);
    };
  }, []);

  const galleryItems = [
    {
      src: 'https://images.unsplash.com/photo-1542103749-8ef59b94f47e?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80', // Image
      thumb: 'https://images.unsplash.com/photo-1542103749-8ef59b94f47e?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    },
    {
      src: 'https://www.youtube.com/watch?v=IUN664s7N-c', // Video
      poster: 'https://img.youtube.com/vi/IUN664s7N-c/hqdefault.jpg', // Thumbnail for the video
    },
    {
      src: 'https://www.youtube.com/watch?v=ttLu7ygaN6I', // Video
      poster: 'https://img.youtube.com/vi/ttLu7ygaN6I/hqdefault.jpg', // Thumbnail for the video
    },
    {
      src: 'https://www.youtube.com/watch?v=C3vyugaBhSs', // Video
      poster: 'https://img.youtube.com/vi/C3vyugaBhSs/hqdefault.jpg', // Thumbnail for the video
    },
  ];

  return (


    <div className="popup--modal-overlay" onClick={onRequestClose}>
      <div className="popup--modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="App">
          <HeaderComponent />
          <div
            ref={containerRef}
            style={{
              height: height,
            }}
          ></div>
          <div>
            <div className="carousel-container">
              <LightGallery
                container={galleryContainer}
                licenseKey="82466149-235C-4086-A637-35D49AFC4BC6"
                onInit={onInit}
                plugins={[lgVideo]}
                closable={false}
                showMaximizeIcon={true}
                slideDelay={400}
                thumbWidth={130}
                thumbHeight={'100px'}
                thumbMargin={6}
                appendSubHtmlTo={'.lg-item'}
                dynamic={true}
                dynamicEl={galleryItems}
                videojs
                videojsOptions={{
                  muted: false,
                  controls: true, // Ensure the controls are displayed
                  autoplay: false,
                }}
                hash={false}
                elementClassNames={'inline-gallery-container'}
              ></LightGallery>
            </div>
          </div>
        </div>
    </div>
 </div>
  );
};

const HeaderComponent = () => (
  <div className="popup--header">
    <a
      className="popup--header-button"
      href="https://github.com/sachinchoolur/lightGallery"
      target="_blank"
      rel="noopener noreferrer"
    >
      View on GitHub
    </a>
  </div>
);

export default DisplaySopt;



