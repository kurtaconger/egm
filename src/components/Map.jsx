// Map.jsx
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../index.css';
import { drawLinesBetweenLocations } from '../utils/lineDrawing';
import { getFirstPictureUrl } from '../utils/getFirstPictureUrl';

const Map = ({
  mapBoxToken,
  locations,
  showPopups,
  mapBearing,
  handlePopupClick,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupsRef = useRef([]);

  const hasValidCoordinates = (location) => {
    return location.lat && location.lng && !isNaN(location.lat) && !isNaN(location.lng);
  };

  const sanitizeId = (id) => {
    return id.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  };

  useEffect(() => {
    if (locations.length > 0 && !mapRef.current) {
      mapboxgl.accessToken = mapBoxToken;
      const bounds = new mapboxgl.LngLatBounds();
      const validLocations = locations.filter(hasValidCoordinates);

      validLocations.forEach((location) => {
        if (hasValidCoordinates(location)) {
          bounds.extend([location.lng, location.lat]);
        }
      });

      if (!bounds.isEmpty()) {
        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          bearing: mapBearing,
        });

        mapRef.current.on('style.load', () => {
          drawLinesBetweenLocations(validLocations, mapRef, '#FF0000');
        });

        validLocations.forEach(async (location) => {
          const locationDiv = document.createElement('div');
          locationDiv.className = 'marker';
          locationDiv.textContent = location.seq;

          const imageUrl = await getFirstPictureUrl(location);
          const hasValidImage = imageUrl;
          const popupContent = `
            <div class="popup-${sanitizeId(location.id)}">
              <div class="map--popup-container" style="width: ${hasValidImage ? '200px' : '100px'};">
                ${hasValidImage ? `<img class="map--popup-image" src="${imageUrl}" alt="${location.shortName}">` : ''}
                <h3 class="map--popup-title">${location.shortName}</h3>
              </div>
            </div>
          `;

          const popup = new mapboxgl.Popup({
            closeOnClick: false,
            closeButton: false,
          })
            .setHTML(popupContent)
            .setLngLat([location.lng, location.lat]);

          new mapboxgl.Marker({ element: locationDiv })
            .setLngLat([location.lng, location.lat])
            .setPopup(popup)
            .addTo(mapRef.current);

          popup.on('open', () => {
            const popupElement = popup.getElement();
            if (popupElement) {
              popupElement.addEventListener('click', () => {
                handlePopupClick(location.id);
              });
            }
          });

          popupsRef.current.push(popup);
          if (showPopups) {
            popup.addTo(mapRef.current);
          }
        });

        // Fit the map to the bounds with padding and a maximum zoom level
        mapRef.current.fitBounds(bounds, {
          padding: { top: 150, bottom: 150, left: 100, right: 100 },
          maxZoom: 15, // Prevent zooming in too far
        });
      }
    }
  }, [locations, mapBearing]);

  useEffect(() => {
    popupsRef.current.forEach((popup) => {
      if (showPopups) {
        popup.addTo(mapRef.current);
      } else {
        popup.remove();
      }
    });
  }, [showPopups]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setBearing(mapBearing);
      mapRef.current.triggerRepaint();
    }
  }, [mapBearing]);

  useEffect(() => {
    if (mapRef.current && locations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      locations.filter(hasValidCoordinates).forEach((location) => {
        bounds.extend([location.lng, location.lat]);
      });

      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, {
          padding: { top: 150, bottom: 150, left: 100, right: 100 },
          maxZoom: 15,
        });
      }
    }
  }, [locations]);

  return (
    <div>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100vh' }} />
    </div>
  );
};

export default Map;
