// utils/loadMedia.js
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

/**
 * Fetches images from Firebase Storage.
 * @param {string} imagePaths - A JSON string containing image paths.
 * @param {boolean} isStock - Whether the images are from the stock folder or personal folder.
 * @returns {Promise<Array>} An array of image URLs in the format required by ImageGallery.
 */
export const fetchImagesFromFirebase = async (imagePaths, isStock = false) => {
  const storage = getStorage();

  try {
    const imageUrls = await Promise.all(
      JSON.parse(imagePaths).map(async (path) => {
        const finalPath = path.includes(isStock ? 'stock_display' : 'personal_display')
          ? path
          : `${isStock ? 'stock_display' : 'personal_display'}/${path}`;
        
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
 * Loads media items from Firebase based on the current marker's data.
 * @param {Object} currentMarker - The current location marker containing media paths.
 * @returns {Promise<Array>} An array of formatted media items.
 */
const loadMedia = async (currentMarker) => {
  if (!currentMarker) return [];

  if (currentMarker.personalPictures) {
    const personalPictures = Array.isArray(currentMarker.personalPictures)
      ? currentMarker.personalPictures
      : JSON.parse(currentMarker.personalPictures);

    if (personalPictures.length > 0) {
      return await fetchImagesFromFirebase(JSON.stringify(personalPictures));
    }
  }
  return [];
};

export default loadMedia;
