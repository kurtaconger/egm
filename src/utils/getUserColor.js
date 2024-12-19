import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase'; // Ensure 'db' is initialized correctly


const getUserColor = async (email, tripUserCollection) => {
  try {
    // Reference the collection
    const usersRef = collection(db, tripUserCollection);

    // Query for documents where the "email" field matches the provided email
    const q = query(usersRef, where('email', '==', email));

    // Execute the query
    const querySnapshot = await getDocs(q);

    // Check if a matching document exists
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0]; // Assuming the first match is sufficient
      const userData = userDoc.data();

      // Return the hexColor field
      return userData.hexColor || '#000000'; // Default to black if hexColor doesn't exist
    } else {
      console.warn('No matching user found for email:', email);
      return '#000000'; // Default to black
    }
  } catch (error) {
    console.error('Error fetching user color:', error);
    return '#000000'; // Default to black in case of an error
  }
};

export default getUserColor