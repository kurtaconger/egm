import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../utils/firebase';

export const executeSyntaxCheck = async (tripID, currentMarkerID) => {
  try {
    const tripNameData = `TRIP-${tripID}-DATA`;
    const tripNameUsers = `TRIP-${tripID}-USERS`;

    // Fetch content for the current marker
    const docRef = doc(db, tripNameData, currentMarkerID);
    const docSnap = await getDoc(docRef);

    let fetchedContent = '';
    if (docSnap.exists()) {
      fetchedContent = docSnap.data().content || '';
      console.log('FETCHED CONTENT:', fetchedContent);
    } else {
      console.log('No content found during syntax check.');
    }

    // Extract display names from the fetched content
    const regex = /\[([^\]]+)\]/g;
    const matches = Array.from(fetchedContent.matchAll(regex)).map(match => match[1]);
    console.log('Extracted display names from content:', matches);

    // Fetch valid display names from TRIP-${tripID}-USERS
    const usersCollectionRef = collection(db, tripNameUsers);
    const usersSnapshot = await getDocs(usersCollectionRef);

    const validDisplayNames = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.displayName) {
        validDisplayNames.push(userData.displayName);
      }
    });

    console.log('Valid Display Names from Firebase:', validDisplayNames);

    // Compare extracted display names with valid display names
    const invalidNames = matches.filter(name => !validDisplayNames.includes(name));

    return {
      validDisplayNames,
      invalidNames,
    };
  } catch (error) {
    console.error('Error fetching content or users from Firebase:', error);
    return {
      validDisplayNames: [],
      invalidNames: [],
    };
  }
};
