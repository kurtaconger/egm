import { doc, collection, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase'; // Import the correct constants


// set the name and title of the trip
export const initialzeTrip = async () => {

    // check for location of the device
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          (position) => {
              const latitude = position.coords.latitude;
              const longitude = position.coords.longitude;
              alert(`Latitude: ${latitude}, Longitude: ${longitude}`);
          },
          (error) => {
              alert(`Error: ${error.message}`);
          }
      );
  } else {
      alert("Geolocation is not supported by this browser.");
  }


    const collectionName = prompt('Enter the name of the trip/collection:');
    if (!collectionName) {
      alert("Collection name cannot be empty.");
      return;
    }

    const tripTitle = prompt('Enter Title to appear at the top of the map:');
    if (!tripTitle) {
      alert("Trip title cannot be empty.");
      return;
    }

    const appCollectionName = `${collectionName}-APP`;
    const dataCollectionName = `${collectionName}-DATA`;

    try {
      const appCollectionRef = collection(db, appCollectionName);
      const appSnapshot = await getDocs(appCollectionRef);
      const appCollectionExists = !appSnapshot.empty;

      const dataCollectionRef = collection(db, dataCollectionName);
      const dataSnapshot = await getDocs(dataCollectionRef);
      const dataCollectionExists = !dataSnapshot.empty;

      if (appCollectionExists || dataCollectionExists) {
        alert(`Collection ${appCollectionName} or ${dataCollectionName} already exists.`);
        return;
      }

      const initialData = {
        createdAt: new Date(),
        message: `This is the ${collectionName} collection.`,
        tripTitle: tripTitle  
      };

      const appDocRef = doc(db, appCollectionName, 'init');
      await setDoc(appDocRef, initialData);
      console.log ("app", appCollectionName)

      const dataDocRef = doc(db, dataCollectionName, 'init');
      await setDoc(dataDocRef, initialData);
      console.log ("data ", dataCollectionName)

      alert(`Collections ${appCollectionName} and ${dataCollectionName} have been successfully created with title "${tripTitle}".`);
    } catch (error) {
      console.error("Error initializing collections:", error);
      alert("An error occurred while initializing the trip.");
    }
  };