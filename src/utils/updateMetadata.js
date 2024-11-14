import { doc, getDoc, updateDoc, getDocs, collection } from 'firebase/firestore'; // Firestore methods

// Function to update metadata for the closest locations in Firestore
export const  updateMetadataForClosestLocations= async (db, tripID, closestLocations) => {
    try {
        const locationCollectionRef = collection(db, "MAP-" + tripID + "-DATA");
        const locationSnapshot = await getDocs(locationCollectionRef);

        // Create a map of loc_name to document ID
        const locationMap = {};
        locationSnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            locationMap[data.shortName] = docSnapshot.id; // Map loc_name to its document ID
        });

        // Loop through each file with GPS data and its closest location
        for (let fileData of closestLocations) {
            const { fullPath, closestLocationName } = fileData;

            const docId = locationMap[closestLocationName];
            if (docId) {
                // Reference the document for the closest location using the document ID
                const locationDocRef = doc(db, "MAP-" + tripID + "-DATA", docId);
                const locationDocSnapshot = await getDoc(locationDocRef);

                if (locationDocSnapshot.exists()) {
                    const locationData = locationDocSnapshot.data();
                    let personalPictures = locationData.personalPictures ? JSON.parse(locationData.personalPictures) : [];

                    // Add the Firebase Storage Reference to the personalPictures array
                    personalPictures.push(fullPath);

                    // Update the personalPictures field in Firestore
                    await updateDoc(locationDocRef, {
                        personalPictures: JSON.stringify(personalPictures)
                    });

                    console.log(`Metadata updated for location ${closestLocationName} with file reference ${fullPath}`);
                } else {
                    console.error(`Location document not found: ${closestLocationName}`);
                }
            } else {
                console.error(`Document ID not found for location: ${closestLocationName}`);
            }
        }
        return true;
    } catch (error) {
        console.error("Error updating metadata for closest locations:", error);
        return false;
    }
};
