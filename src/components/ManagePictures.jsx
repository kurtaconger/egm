import { useState } from 'react';
import PropTypes from 'prop-types';
import { handleRetrieveGPS } from '../utils/retrieveGPS'; // Import the GPS retrieval utility
import { handleConvertHeicToJpg } from '../utils/fileUtil'; // Import the file utilities
import { findClosestLocation } from '../utils/findClosestLocation'; // Import the closest location utility
import { db, storage, tripNameData } from '../utils/firebase'; // Import Firebase Firestore database instance and storage
import { ref, uploadBytes } from 'firebase/storage'; // Import Firebase storage methods
import { updateMetadataForClosestLocations } from '../utils/updateMetadata'; // Import the metadata utility
import ProcessNonGPS from './ProcessNonGPS'; // Combined component for handling both personal and stock pictures
import './managePictures.css';

function ManagePictures({ isPictureModalOpen, closePictureModal, tripID }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [filesUploaded, setFilesUploaded] = useState(false);
    const [gpsData, setGpsData] = useState([]);
    const [gpsRetrieved, setGpsRetrieved] = useState(false);
    const [filesSaved, setFilesSaved] = useState(false);
    const [displayReferences, setDisplayReferences] = useState([]); // The "personal_display" paths
    const [heicConverted, setHeicConverted] = useState(false);
    const [closestLocations, setClosestLocations] = useState([]);
    const [closestLocationsFound, setClosestLocationsFound] = useState(false);
    const [metadataUpdated, setMetadataUpdated] = useState(false);
    const [showNonGPSModal, setShowNonGPSModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);

    // Handle file selection for GPS files
    const handlePersonalGPSButton = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);
        setFilesUploaded(true);
        setGpsData([]);
        setGpsRetrieved(false);
    };

    // Open the modal for non-GPS personal pictures
    const handleOpenNonGPSModal = () => {
        setShowNonGPSModal(true);
    };

    // Open the modal for stock pictures
    const handleOpenStockModal = () => {
        setShowStockModal(true);
    };

    // Save original and converted files to Firebase
    const handleSaveToFirebase = async () => {
        const firebaseRefsOriginal = [];

        for (let file of selectedFiles) {
            // Upload original files to personal_original
            const originalStorageRef = ref(storage, `personal_original/${file.name}`);
            try {
                const originalSnapshot = await uploadBytes(originalStorageRef, file);
                const originalFirebaseRef = originalSnapshot.metadata.fullPath;
                firebaseRefsOriginal.push({ fileName: file.name, firebaseRef: `gs://${originalStorageRef.bucket}/${originalFirebaseRef}` });
            } catch (error) {
                console.error(`Error uploading original file: ${file.name}`, error);
            }
        }

        // Convert HEIC files to JPG and save to personal_display
        await handleConvertHeicToJpg(selectedFiles, setDisplayReferences, setHeicConverted);
        if (firebaseRefsOriginal.length > 0) {
            setFilesSaved(true); // Mark files as saved
        } else {
            console.error("No files were saved.");
        }
    };

    // Function to convert HEIC files to JPG and save converted files to Firebase
    const handleConvertHeicFiles = async () => {
        await handleConvertHeicToJpg(selectedFiles, setDisplayReferences, setHeicConverted);
        console.log('HEIC files converted and saved to personal_display');
    };

    // Retrieve GPS data and associate it with files
    const handleRetrieveGPSData = async () => {
        await handleRetrieveGPS(selectedFiles, setGpsData);
        setGpsRetrieved(true);
    };

    // Find the closest location for files with GPS
    const handleFindClosestLocations = async () => {
        const closestLocationList = await findClosestLocation(db, tripID, gpsData, displayReferences);
        setClosestLocations(closestLocationList);
        setClosestLocationsFound(true);
    };

    // Update metadata for closest locations with personal_display path
    const handleUpdateMetadata = async () => {
        const updatedFileData = closestLocations.map((fileData) => {
            const displayRef = displayReferences.find(ref => ref.fileName === fileData.fileName.replace(/\.[Hh][Ee][Ii][Cc]$/, '.jpg'));
            return {
                ...fileData,
                fullPath: displayRef?.firebaseRef
            };
        });

        const success = await updateMetadataForClosestLocations(db, tripID, updatedFileData);
        if (success) {
            setMetadataUpdated(true);
        }
    };

    return (
        <div>
            {isPictureModalOpen && (
                <div className='pict-modal--overlay'>
                    <div className='pict-modal--content'>
                        <div className='pict-modal--header'>
                            <div className='pict-modal--title'>Picture Functions</div>
                            <button className='pict-modal--close-button' onClick={() => { closePictureModal() }}>X</button>
                        </div>
                        <div className='pict-modal--body'>
                            <div className='pict-modal--button-container'>
                                {!filesUploaded && (
                                    <label className='pict-modal--button'>
                                        Upload Personal Pictures with GPS
                                        <input
                                            type="file"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={handlePersonalGPSButton}
                                        />
                                    </label>
                                )}
                                {!filesUploaded && (
                                    <button className='pict-modal--button' onClick={handleOpenNonGPSModal}>
                                        Upload Personal Pictures without GPS
                                    </button>
                                )}
                                {!filesUploaded && (
                                    <button className='pict-modal--button' onClick={handleOpenStockModal}>
                                        Upload Stock Pictures
                                    </button>
                                )}
                            </div>
                            <div className='pict-modal--progress-message-box'>
                                {selectedFiles.length > 0 && !gpsRetrieved ? (
                                    <>
                                        <p>1. The following files were selected:</p>
                                        <ul className="pict-modal--list">
                                            {selectedFiles.map((file, index) => (
                                                <li key={index}>{file.name}</li>
                                            ))}
                                        </ul>
                                        <button className='pict-modal--button' onClick={handleRetrieveGPSData}>
                                            2. Retrieve GPS coordinates
                                        </button>
                                    </>
                                ) : gpsRetrieved && !heicConverted ? (
                                    <>
                                        <p>2. GPS Coordinates for Files:</p>
                                        <ul className="pict-modal--list">
                                            {selectedFiles.map((file, index) => {
                                                const gpsInfo = gpsData[index];
                                                const latitude = gpsInfo?.latitude || 'NA';
                                                const longitude = gpsInfo?.longitude || 'NA';
                                                return (
                                                    <li key={index}>{`File: ${file.name}, GPS: (${latitude}, ${longitude})`}</li>
                                                );
                                            })}
                                        </ul>
                                        <button className='pict-modal--button' onClick={handleConvertHeicFiles}>
                                            3. Convert HEIC to JPG
                                        </button>
                                    </>
                                ) : heicConverted && !filesSaved ? (
                                    <>
                                        <p>HEIC files converted. All files saved to personal_display.</p>
                                        <button className='pict-modal--button' onClick={handleSaveToFirebase}>
                                            4. Save Files to Firebase
                                        </button>
                                    </>
                                ) : filesSaved && !closestLocationsFound ? (
                                    <>
                                        <p>Files saved to Firebase:</p>
                                        <ul className="pict-modal--list">
                                            {displayReferences.map((ref, index) => (
                                                <li key={index}>
                                                    {`File ${ref.fileName} has Firebase reference ${ref.firebaseRef}`}
                                                </li>
                                            ))}
                                        </ul>
                                        <button className='pict-modal--button' onClick={handleFindClosestLocations}>
                                            5. Find closest location for files with GPS
                                        </button>
                                    </>
                                ) : closestLocationsFound && !metadataUpdated ? (
                                    <>
                                        <p>Distances to closest location:</p>
                                        <ul className="pict-modal--list">
                                            {closestLocations.map((fileData, index) => (
                                                <li key={index}>
                                                    {`File ${fileData.fileName} is closest to ${fileData.closestLocationName} (${fileData.distance} miles)`}
                                                </li>
                                            ))}
                                        </ul>
                                        <button className='pict-modal--button' onClick={handleUpdateMetadata}>
                                            6. Update Metadata for closest location
                                        </button>
                                    </>
                                ) : metadataUpdated ? (
                                    <>
                                        <p>Update complete.</p>
                                        <button className='pict-modal--button' onClick={() => { closePictureModal() }}>
                                            Close
                                        </button>
                                    </>
                                ) : (
                                    "Status of image processing"
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showNonGPSModal && (
                <ProcessNonGPS
                    onCancel={() => setShowNonGPSModal(false)} // Close the modal
                    firebaseFolder="personal_display" // For personal pictures
                    firestoreField="personalPictures" // Field in Firestore
                    tripID={tripID}
                />
            )}
        </div>
    );
}

ManagePictures.propTypes = {
    isPictureModalOpen: PropTypes.bool.isRequired,
    closePictureModal: PropTypes.func.isRequired,
};

export default ManagePictures;
