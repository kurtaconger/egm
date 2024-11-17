import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase'; // Adjust this path if necessary

/**
 * Fetches images from Firebase Storage based on a list of file paths.
 * @param {Array<string>} imagePaths - An array of image paths.
 * @returns {Promise<Array>} An array of image URLs in the format required by ImageGallery.
 */
export const fetchImagesFromFirebase = async (imagePaths) => {
  const storage = getStorage();

  try {
    const imageUrls = await Promise.all(
      imagePaths.map(async (path) => {
        const finalPath = path.includes('uploaded_media') ? path : `uploaded_media/${path}`;
        const storageRef = ref(storage, finalPath);
        const url = await getDownloadURL(storageRef);
        return url;
      })
    );

    return imageUrls.map((url) => ({
      original: url,
      thumbnail: url,
    }));
  } catch (error) {
    console.error('Error fetching images from Firebase:', error);
    throw error;
  }
};

/**
 * Loads media items from the `media` field of the current marker's document.
 * @param {Object} currentMarker - The current location marker containing media paths.
 * @param {string} tripID - The trip ID to construct the document path.
 * @returns {Promise<Array>} An array of formatted media items.
 */
const loadMedia = async (currentMarker, tripID) => {
  if (!currentMarker || !currentMarker.id) {
    console.warn(`[WARN] Invalid marker or missing ID:`, JSON.stringify(currentMarker, null, 2));
    return [];
  }

  try {
    const markerDocPath = `MAP-${tripID}-DATA/${currentMarker.id}`;
    console.log(`[DEBUG] Fetching media from document path: ${markerDocPath}`);

    const markerDocRef = doc(db, markerDocPath);
    const markerDocSnapshot = await getDoc(markerDocRef);

    if (!markerDocSnapshot.exists()) {
      console.warn(`[WARN] No document found at: ${markerDocPath}`);
      return [];
    }

    const markerData = markerDocSnapshot.data();
    console.log(`[DEBUG] Marker data retrieved:`, markerData);

    if (!markerData.media || markerData.media.length === 0) {
      console.warn(`[WARN] No media field found in marker document or field is empty.`);
      return [];
    }

    const mediaPaths = markerData.media; // Array of media paths from the `media` field
    console.log(`[DEBUG] Extracted media paths:`, mediaPaths);

    const mediaItems = await fetchImagesFromFirebase(mediaPaths);
    console.log(`[DEBUG] Successfully loaded media items:`, mediaItems);

    return mediaItems;
  } catch (error) {
    console.error(`[ERROR] Error loading media for marker ID: ${currentMarker.id}`, error);
    return [];
  }
};

export default loadMedia;


