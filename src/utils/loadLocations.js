import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase'; // Import Firestore instance and tripNameData

export const loadLocations = async (tripID) => {
  try {
    const collectionRef = collection(db, "TRIP-" + tripID + "-DATA");
    const snapshot = await getDocs(collectionRef);

    if (snapshot.empty) {
      throw new Error('No valid collection found');
    }

    const locationsData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return locationsData; // Return the loaded locations
  } catch (error) {
    console.error('Error fetching locations from Firebase:', error);
    return []; // Return an empty array in case of error
  }
};
