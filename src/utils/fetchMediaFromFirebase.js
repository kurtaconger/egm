import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase'; // Adjust this path if necessary

const fetchMediaFromFirebase = async (mediaPaths) => {
  const storage = getStorage();

  try {
    const mediaItems = await Promise.all(
      mediaPaths.map(async (path) => {
        const finalPath = path.includes('uploaded_media') ? path : `uploaded_media/${path}`;
        const storageRef = ref(storage, finalPath);
        const url = await getDownloadURL(storageRef);

        // Determine if the file is a video based on the file extension
        const isVideo = finalPath.endsWith('.mp4');

        return {
          original: url,
          thumbnail: isVideo ? undefined : url, // Videos typically don't need thumbnails
          isVideo, // Set the isVideo flag
        };
      })
    );

    return mediaItems;
  } catch (error) {
    console.error('Error fetching media from Firebase:', error);
    throw error;
  }
};

export default fetchMediaFromFirebase
