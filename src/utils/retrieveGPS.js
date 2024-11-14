import exifr from 'exifr';

// Utility function to retrieve GPS coordinates from files
export const handleRetrieveGPS = async (files, setGpsData) => {
    const gpsResults = [];

    for (let file of files) {
        try {
            // Assuming you are extracting EXIF data to get GPS
            const exifData = await exifr.parse(file);
            if (exifData && exifData.latitude && exifData.longitude) {
                gpsResults.push({
                    file: file,
                    latitude: exifData.latitude,
                    longitude: exifData.longitude,
                });
            } else {
                console.log(`No GPS data found for file: ${file.name}`);
            }
        } catch (error) {
            console.error(`Error processing file: ${file.name}`, error);
        }
    }

    // Check if setGpsData is passed and is a function before calling it
    if (typeof setGpsData === 'function') {
        setGpsData(gpsResults); // Update state with GPS results
    } else {
        console.error('setGpsData is not a function');
    }
};
