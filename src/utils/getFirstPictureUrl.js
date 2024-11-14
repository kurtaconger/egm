import { getStorage, ref, getDownloadURL } from 'firebase/storage';


// Function to retrieve the first URL from the personalPictures array stored in Firebase
export const getFirstPictureUrl = async (location) => {
  const storage = getStorage();
  try {
    // Check for personal pictures first
    if (location.personalPictures) {
      const personalPicturesArray = JSON.parse(location.personalPictures);
      if (personalPicturesArray.length > 0) {
        const personalImagePath = personalPicturesArray[0];
        const personalStorageRef = ref(storage, personalImagePath);
        const personalUrl = await getDownloadURL(personalStorageRef);
        return personalUrl;
      }
    }
    // If no personal pictures, check for stock pictures
    if (location.stockPictures) {
      const stockPicturesArray = JSON.parse(location.stockPictures);
      if (stockPicturesArray.length > 0) {
        const stockImagePath = stockPicturesArray[0];
        const stockStorageRef = ref(storage, stockImagePath);
        const stockUrl = await getDownloadURL(stockStorageRef);
        return stockUrl;
      }
    }
  } catch (error) {
    console.error('Error fetching image from Firebase or parsing pictures array:', error);
  }
  return '';
};
