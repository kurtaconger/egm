import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db, tripNameData } from './firebase'; // Import Firestore instance and tripNameData
import Papa from 'papaparse'; // Assuming you're using PapaParse for CSV parsing

// Function to parse CSV
export const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true, // Assumes first row is headers
      skipEmptyLines: true, // Ignore empty rows
      complete: (results) => {
        resolve(results.data); // Returns array of parsed CSV rows
      },
      error: (error) => {
        reject(error); // Handle errors in CSV parsing
      },
    });
  });
};

// Function to upload locations
export const uploadLocations = async (file) => {
  try {
    // Step 1: Parse the CSV file into an array of location objects
    const parsedLocations = await parseCSV(file);
    console.log('Parsed CSV data:', parsedLocations);

    // Step 2: Reference the Firestore collection and delete all existing documents
    const collectionRef = collection(db, tripNameData);
    const existingSnapshot = await getDocs(collectionRef);

    for (const docSnapshot of existingSnapshot.docs) {
      await deleteDoc(doc(db, tripNameData, docSnapshot.id));
    }
    console.log('All existing locations deleted.');

    // Step 3: Upload new locations with sequential loc_sec starting from 1
    let locSecCounter = 1; // Initialize loc_sec at 1

    for (const location of parsedLocations) {
      const { loc_name, lat, long } = location;

      // Validate parsed location data
      if (!loc_name || !lat || !long) {
        console.error(`Invalid data at row:`, location);
        continue;
      }

      const locationDocName = `location ${locSecCounter}`;

      // Step 4: Add the new location to Firestore with the incremented loc_sec
      const newDocRef = doc(db, tripNameData, locationDocName);
      await setDoc(newDocRef, {
        loc_name: loc_name.trim(),
        lat: parseFloat(lat),
        lng: parseFloat(long),
        loc_sec: locSecCounter, // Set loc_sec in sequential order
      });

      console.log(`Uploaded new location: ${locationDocName}`);
      locSecCounter++; // Increment loc_sec for the next location
    }

    console.log('All locations have been uploaded successfully.');
  } catch (error) {
    console.error('Error uploading locations:', error);
  }
};

// Function to load locations from Firestore
export const loadLocations = async () => {
  try {
    const collectionRef = collection(db, tripNameData);
    const snapshot = await getDocs(collectionRef);

    if (snapshot.empty) {
      throw new Error('No valid collection found');
    }

    const locationsData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return locationsData;
  } catch (error) {
    console.error('Error fetching locations from Firebase:', error);
    return [];
  }
};


