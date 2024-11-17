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

export const findClosestLocation = async (db, tripID, gpsData) => {
    console.log("Starting findClosestLocation function");
    console.log("tripID:", tripID);
    console.log("GPS Data:", gpsData);

    const locationCollectionRef = collection(db, `MAP-${tripID}-DATA`);

    try {
        const locationSnapshot = await getDocs(locationCollectionRef);
        const locationList = locationSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                shortName: data.shortName || "Unknown Location",
                lng: data.lng || "Unknown Longitude",
                lat: data.lat || "Unknown Latitude",
                id: doc.id, // Include the document ID
            };
        });

        console.log("Location List:", locationList);

        const closestLocationList = gpsData.map((fileData) => {
            if (!fileData.latitude || !fileData.longitude || !fileData.fileRef) {
                console.warn(`Invalid GPS data or fileRef for file: ${fileData.file?.name}`);
                return null;
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
                    closestLocation = {
                        locationName: location.shortName,
                        documentId: location.id, // Include the document ID
                        distance: minDistance.toFixed(2),
                    };
                }
            });

            if (closestLocation) {
                return {
                    fileName: fileData.file.name,
                    fileRef: fileData.fileRef,
                    closestLocationName: closestLocation.locationName,
                    documentId: closestLocation.documentId, // Include the document ID
                    distance: closestLocation.distance,
                };
            }

            return null; // No closest location found
        });

        return closestLocationList.filter((loc) => loc !== null); // Remove null entries
    } catch (error) {
        console.error("Error fetching locations:", error);
        return [];
    }
};
