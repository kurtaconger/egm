import { useState, useEffect, useRef } from 'react';
import './processNonGPS.css';
import { collection, getDocs, updateDoc, doc,arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../utils/firebase';

function ManageNonGPSPictures({ onCancel, tripID }) {
    const [nonGPSFiles, setNonGPSFiles] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [locations, setLocations] = useState([]);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const [currentFile, setCurrentFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(''); // New state for success message

    const fileInputRef = useRef(null);
    const firebaseFolder = "uploaded_media";

    const handleSelectFiles = (event) => {
        const files = Array.from(event.target.files).filter(file =>
            file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.mp4')
        );

        if (files.length > 0) {
            console.log("Selected files:", files);
            setNonGPSFiles(files);
            setCurrentFile(files[0]);
            setCurrentFileIndex(0);
            setSelectedLocation('');
            setSuccessMessage(''); // Clear the success message when new files are selected
        } else {
            console.error('No valid .jpg or .mp4 files selected.');
        }

        event.target.value = '';
    };

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                console.log("Fetching locations for tripID:", tripID);
                const locationsCollectionRef = collection(db, "MAP-" + tripID + "-DATA");
                const locationSnapshot = await getDocs(locationsCollectionRef);
                const locationList = locationSnapshot.docs.map(doc => ({
                    shortName: doc.data().shortName,
                    id: doc.id,
                }));
                console.log("Fetched locations:", locationList);
                setLocations(locationList);
            } catch (error) {
                console.error('Error fetching locations:', error);
            }
        };

        fetchLocations();
    }, [tripID]);

    const handleSubmit = async () => {
        console.log("Submit button clicked");
        
        if (!selectedLocation) {
            console.error("No location selected. Please select a location.");
            return;
        }
        if (!currentFile) {
            console.error("No file selected. Please select a file.");
            return;
        }

        setIsLoading(true);
        console.log("Uploading file:", currentFile.name, "to location:", selectedLocation);

        try {
            const storageRef = ref(storage, `${firebaseFolder}/${currentFile.name}`);
            const snapshot = await uploadBytes(storageRef, currentFile);
            const firebaseRef = snapshot.metadata.fullPath;
            console.log("File uploaded to Firebase Storage. Firebase path:", firebaseRef);

            const locationDoc = locations.find(loc => loc.shortName === selectedLocation);
            if (!locationDoc) {
                console.error("Selected location not found in locations list.");
                return;
            }

            console.log("Updating Firestore document for location:", selectedLocation);
            const locationDocRef = doc(db, `MAP-${tripID}-DATA`, locationDoc.id);

            // Append the file path to the `media` array field
            await updateDoc(locationDocRef, {
                media: arrayUnion(firebaseRef),
            });
            console.log(`Successfully added file "${currentFile.name}" to media array for location ${selectedLocation}`);

            // Set success message on successful upload
            setSuccessMessage(`File "${currentFile.name}" successfully uploaded to "${selectedLocation}"`);

            // Process the next file or close the modal
            if (currentFileIndex < nonGPSFiles.length - 1) {
                const nextIndex = currentFileIndex + 1;
                setCurrentFile(nonGPSFiles[nextIndex]);
                setCurrentFileIndex(nextIndex);
                setSelectedLocation('');
            } else {
                console.log("All files processed, closing modal.");
                onCancel();
            }
        } catch (error) {
            console.error("Error during file upload or Firestore update:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="ass-loc--overlay">
            <div className="ass-loc--content">
                <div className="ass-loc--header">
                    <h3>Upload Files without GPS</h3>
                    <button className="ass-loc--close-button" onClick={onCancel}>X</button>
                </div>
                <div className="ass-loc--body">
                    <button className="ass-loc--button" onClick={() => fileInputRef.current.click()}>
                        Select Files
                    </button>
                    <input
                        type="file"
                        multiple
                        accept=".jpg,.mp4"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleSelectFiles}
                    />
                    <div>
                        {successMessage || `File: ${currentFile ? currentFile.name : 'No file selected'}`}
                    </div>
                    <div className="ass-loc--media-container">
                        {currentFile && currentFile.name.toLowerCase().endsWith('.jpg') && (
                            <img src={URL.createObjectURL(currentFile)} alt="Selected" className="ass-loc--image" />
                        )}
                        {currentFile && currentFile.name.toLowerCase().endsWith('.mp4') && (
                            <video controls className="ass-loc--video">
                                <source src={URL.createObjectURL(currentFile)} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        )}
                    </div>
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
                    <button className="ass-loc--button" onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Uploading...' : 'Submit'}
                    </button>
                    <button className="ass-loc--button" onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

export default ManageNonGPSPictures;
