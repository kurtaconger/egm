import { collection, getDocs } from 'firebase/firestore';

// Haversine formula to calculate distance between two lat/lng points
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 3958.8; // Radius of Earth in miles (for nautical, use 3440)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in miles
};

// Function to find closest locations based on GPS data and locations from Firestore
export const findClosestLocation = async (db, tripID, gpsData, firebaseRefs) => {
    const locationCollectionRef = collection(db, "MAP-" + tripID + "-DATA");
    try {
        const locationSnapshot = await getDocs(locationCollectionRef);
        const locationList = locationSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                shortName: data.shortName || "Unknown Location",
                lng: data.lng !== undefined ? data.lng : "Unknown Longitude",
                lat: data.lat !== undefined ? data.lat : "Unknown Latitude",
            };
        });

        // For each file with GPS data, find the closest location
        const closestLocationList = gpsData.map((fileData, index) => {
            if (!fileData || !fileData.file || !fileData.latitude || !fileData.longitude) {
                console.error('GPS or file data is missing for:', fileData);
                return {
                    fileName: 'Unknown',
                    closestLocationName: 'Unknown Location',
                    distance: 'N/A',
                    fullPath: 'N/A'
                };
            }

            let closestLocation = null;
            let minDistance = Infinity;

            locationList.forEach((location) => {
                const distance = haversineDistance(
                    fileData.latitude,
                    fileData.longitude,
                    location.lat,
                    location.lng
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    closestLocation = { locationName: location.shortName, distance };
                }
            });

            const fullPath = firebaseRefs[index] 
                ? `gs://bvi-map2.appspot.com/${firebaseRefs[index].firebaseRef}` 
                : "No Firebase reference found";

            return {
                fileName: fileData.file.name, // Correctly access the file name
                closestLocationName: closestLocation ? closestLocation.locationName : 'Unknown Location',
                distance: minDistance !== Infinity ? minDistance.toFixed(2) : 'N/A', // Rounds distance to 2 decimal places
                fullPath: fullPath // Include the full Firebase storage path
            };
        });

        return closestLocationList; // Return the closest locations for each file
    } catch (error) {
        console.error("Error fetching locations:", error);
        return [];
    }
};
