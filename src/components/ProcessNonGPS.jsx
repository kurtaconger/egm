import { useState, useEffect, useRef } from 'react';
import './processNonGPS.css'; // Assuming the CSS file is similar to managePictures.css
import { collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore'; // Firestore methods for fetching data
import { ref, uploadBytes } from 'firebase/storage'; // Firebase Storage methods
import { db, storage } from '../utils/firebase'; // Firebase Firestore and Storage instance

function ProcessNonGPS({ onCancel, fileType, firebaseFolder, firestoreField, tripID }) {
    const [nonGPSFiles, setNonGPSFiles] = useState([]); // State for non-GPS files
    const [selectedLocation, setSelectedLocation] = useState(''); // Selected location
    const [locations, setLocations] = useState([]); // Locations fetched from Firestore
    const [currentFileIndex, setCurrentFileIndex] = useState(0); // To track which file is being processed
    const [currentFile, setCurrentFile] = useState(null); // The currently selected file
    const [isLoading, setIsLoading] = useState(false); // To show loading state

    const fileInputRef = useRef(null); // Reference to the file input element

    // Handle file selection for non-GPS files (filtering by .jpg and .mp4 extensions)
    const handleSelectFiles = (event) => {
        const files = Array.from(event.target.files).filter(file =>
            file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.mp4')
        );

        console.log('File input event:', event.target.files); // Log the raw file input
        console.log('Filtered valid files:', files); // Log the filtered valid files

        if (files.length > 0) {
            console.log('First selected file:', files[0].name); // Debugging: Log first valid file name
            setNonGPSFiles(files);
            setCurrentFile(files[0]); // Set the first file as the current file
            setCurrentFileIndex(0); // Reset the index to the first file
            setSelectedLocation(''); // Clear the location selection when new files are selected
        } else {
            console.error('No valid .jpg or .mp4 files selected.');
        }

        // Reset the file input element to ensure the onChange event fires even if the same file is selected again
        event.target.value = '';
    };

    // Fetch locations from Firestore
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const locationsCollectionRef = collection(db, "MAP-" + tripID + "-DATA"); // tripNameData is where the locations are stored
                const locationSnapshot = await getDocs(locationsCollectionRef);
                const locationList = locationSnapshot.docs.map(doc => ({
                    shortName: doc.data().shortName,
                    id: doc.id, // Store document ID to update later
                }));
                console.log("Fetched locations:", locationList); // Log the fetched locations
                setLocations(locationList); // Update state with the fetched locations
            } catch (error) {
                console.error('Error fetching locations:', error);
            }
        };

        fetchLocations();
    }, []);

    // Handle file uploads and updating Firestore with the Firebase reference
    const handleSubmit = async () => {
        console.log("Submit", currentFile);

        try {
            if (!selectedLocation) {
                console.error("Please select a location.");
                return;
            }

            setIsLoading(true); // Start loading state

            // Upload the current file to Firebase Storage (specific folder)
            const storageRef = ref(storage, `${firebaseFolder}/${currentFile.name}`);
            const snapshot = await uploadBytes(storageRef, currentFile);
            const firebaseRef = snapshot.metadata.fullPath; // Store the relative path

            console.log(`Successfully uploaded ${currentFile.name} to ${firebaseRef}`);

            // Find the location document to update based on the selected location name
            const locationDoc = locations.find(loc => loc.shortName === selectedLocation);
            if (!locationDoc) {
                console.error("Selected location not found.");
                return;
            }

            // Get the Firestore document reference and retrieve the current media array
            const docRef = doc(db, "MAP-" + tripID + "-DATA", locationDoc.id);
            const locationDocSnapshot = await getDoc(docRef);

            if (locationDocSnapshot.exists()) {
                const locationData = locationDocSnapshot.data();

                // Ensure that the media field is initialized properly
                let media = [];
                if (locationData[firestoreField]) {
                    try {
                        media = JSON.parse(locationData[firestoreField]); // Try to parse existing data
                    } catch (error) {
                        console.error(`Error parsing ${firestoreField} field, initializing with an empty array.`);
                        media = []; // Initialize with an empty array if parsing fails
                    }
                }

                // Avoid duplicates in the media array
                if (!media.includes(firebaseRef)) {
                    media.push(firebaseRef); // Add unique Firebase reference
                }

                // Update the Firestore field in Firestore as a stringified array
                await updateDoc(docRef, {
                    [firestoreField]: JSON.stringify(media),
                });

                console.log(`File ${currentFile.name} saved to location ${selectedLocation}`);
            } else {
                console.error(`Location document not found for ${selectedLocation}`);
            }

            // Move to the next file after processing the current one
            if (currentFileIndex < nonGPSFiles.length - 1) {
                const nextIndex = currentFileIndex + 1;
                setCurrentFile(nonGPSFiles[nextIndex]); // Set the next file
                setCurrentFileIndex(nextIndex); // Update the current file index
                setSelectedLocation(''); // Reset the selected location for the next file
            } else {
                // If no more files remain, close the component
                onCancel();
            }

        } catch (error) {
            console.error("Error saving location:", error);
        } finally {
            setIsLoading(false); // End loading state
        }
    };

    return (
        <div className="ass-loc--overlay">
            <div className="ass-loc--content">
                <div className="ass-loc--header">
                    <h3>Assign {fileType} Files</h3>
                    <button className="ass-loc--close-button" onClick={onCancel}>X</button>
                </div>
                <div className="ass-loc--body">
                    {/* Button to open file input dialog */}
                    <button className="ass-loc--button" onClick={() => fileInputRef.current.click()}>
                        Select {fileType} Files
                    </button>

                    {/* Hidden file input element */}
                    <input
                        type="file"
                        multiple
                        accept=".jpg,.mp4"
                        ref={fileInputRef}
                        style={{ display: 'none' }} // Hide the input
                        onChange={handleSelectFiles} // Trigger file selection
                    />

                    {/* Display file name */}
                    <div>File: {currentFile ? currentFile.name : 'No file selected'}</div>

                    {/* Display the selected image or video */}
                    <div className="ass-loc--media-container">
                        {currentFile && currentFile.name.toLowerCase().endsWith('.jpg') && (
                            <img
                                src={URL.createObjectURL(currentFile)}
                                alt="Selected"
                                className="ass-loc--image"
                            />
                        )}
                        {currentFile && currentFile.name.toLowerCase().endsWith('.mp4') && (
                            <div>
                                <p>{isLoading ? 'Loading video...' : ''}</p> {/* Show loading message */}
                                <video controls className="ass-loc--video">
                                    <source src={URL.createObjectURL(currentFile)} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        )}
                    </div>

                    {/* Dropdown to choose location */}
                    <label htmlFor="locationSelect">Choose Location:</label>
                    <select
                        id="locationSelect"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                        <option value="" disabled>Select a location</option>
                        {locations.map((loc, index) => (
                            <option key={index} value={loc.shortName}>{loc.shortName}</option>
                        ))}
                    </select>

                    {/* Submit and Cancel buttons */}
                    <button className="ass-loc--button" onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Uploading...' : 'Submit'}
                    </button>
                    <button className="ass-loc--button" onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

export default ProcessNonGPS;

