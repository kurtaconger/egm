import { useState } from 'react';
import { updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import PropTypes from 'prop-types';
import heic2any from 'heic2any';

import { handleRetrieveGPS } from '../utils/retrieveGPS';
import { findClosestLocation } from '../utils/findClosestLocation';
import { db, storage } from '../utils/firebase';
import './managePictures.css';

// Function to add a timestamp to console.log messages
const logWithTimestamp = (message, ...optionalParams) => {
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0]; // hh:mm:ss
    console.log(`[${timeString}] ${message}`, ...optionalParams);
};

function ManagePictures({ isPictureModalOpen, closePictureModal, tripID }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [closestLocations, setClosestLocations] = useState([]);
    const [filesWithoutGPS, setFilesWithoutGPS] = useState([]);
    const [errors, setErrors] = useState([]);
    const [processingMessage, setProcessingMessage] = useState("");

    const handleFileSelection = async (event) => {
        const files = Array.from(event.target.files).filter(file =>
            file.name.toLowerCase().endsWith('.jpg') ||
            file.name.toLowerCase().endsWith('.jpeg') ||
            file.name.toLowerCase().endsWith('.png') ||
            file.name.toLowerCase().endsWith('.heic') ||
            file.name.endsWith('.HEIC')
        );

        logWithTimestamp("Selected files:", files);

        setSelectedFiles(files);
        setUploadedFiles([]);
        setClosestLocations([]);
        setFilesWithoutGPS([]);
        setErrors([]);
        setProcessingMessage("Files being processed, please wait.");

        if (files.length === 0) {
            logWithTimestamp("No valid files selected.");
            setProcessingMessage("No valid files selected.");
            return;
        }

        // Convert HEIC files
        const heicFiles = files.filter(file => file.name.toLowerCase().endsWith('.heic') || file.name.endsWith('.HEIC'));
        const converted = [];
        for (let file of heicFiles) {
            try {
                const blob = await heic2any({
                    blob: file,
                    toType: 'image/jpeg',
                });
                const jpgFile = new File([blob], file.name.replace(/\.[Hh][Ee][Ii][Cc]$/, '.jpg'), {
                    type: 'image/jpeg',
                });
                converted.push(jpgFile);
                logWithTimestamp(`Converted HEIC file: ${file.name} to JPG: ${jpgFile.name}`);
            } catch (error) {
                const errorMsg = `Error converting HEIC file: ${file.name}`;
                logWithTimestamp(errorMsg, error);
                setErrors(prevErrors => [...prevErrors, errorMsg]);
            }
        }

        // Retrieve GPS data
        let gpsResults = [];
        await handleRetrieveGPS(files, (results) => {
            logWithTimestamp("GPS results in callback:", results);
            gpsResults = results;
        });

        logWithTimestamp("GPS results before proceeding:", gpsResults);

        // Upload only converted files and other non-HEIC files
        const filesToUpload = [...converted, ...files.filter(file => !file.name.toLowerCase().endsWith('.heic'))];
        const uploaded = [];
        for (let file of filesToUpload) {
            const storageRef = ref(storage, `uploaded_media/${file.name}`);
            try {
                const snapshot = await uploadBytes(storageRef, file);
                const fileRef = snapshot.metadata.fullPath;
                uploaded.push({ fileName: file.name, fileRef });
                logWithTimestamp(`Uploaded ${file.name} to Firebase storage: ${fileRef}`);
            } catch (error) {
                const errorMsg = `Error uploading ${file.name} to Firebase Storage`;
                logWithTimestamp(errorMsg, error);
                setErrors(prevErrors => [...prevErrors, errorMsg]);
            }
        }

        setUploadedFiles(uploaded);
        setProcessingMessage("");

        // Map GPS data with fileRefs
        const gpsDataWithRefs = gpsResults.map((gpsData) => {
            const jpgFileName = gpsData.file.name.replace(/\.[Hh][Ee][Ii][Cc]$/, '.jpg');
            const matchingUpload = uploaded.find(upload => upload.fileName === jpgFileName);
            return {
                ...gpsData,
                fileRef: matchingUpload?.fileRef || null,
            };
        }).filter(data => data.fileRef); // Filter out invalid entries

        logWithTimestamp("Mapped GPS data with file references:", gpsDataWithRefs);

        // Find closest locations
        if (gpsDataWithRefs.length > 0) {
            const closest = await findClosestLocation(db, tripID, gpsDataWithRefs);
            logWithTimestamp("Closest locations returned:", closest);
            setClosestLocations(closest);

            // Update Firestore
            for (let location of closest) {
                if (location.documentId && location.fileRef) {
                    const locationRef = doc(db, `MAP-${tripID}-DATA`, location.documentId);

                    try {
                        await updateDoc(locationRef, {
                            media: arrayUnion(location.fileRef),
                        });
                        logWithTimestamp(`Stored ${location.fileName} at ${location.closestLocationName} in media array`);
                    } catch (error) {
                        const errorMsg = `Error storing ${location.fileName} at ${location.closestLocationName}`;
                        logWithTimestamp(errorMsg, error);
                        setErrors(prevErrors => [...prevErrors, errorMsg]);
                    }
                } else {
                    logWithTimestamp(`Skipping location for ${location.fileName} as it has no documentId or fileRef`);
                }
            }
        } else {
            logWithTimestamp("No GPS data with file references to process.");
        }

        // Collect files without GPS data
        const filesWithoutGPS = files.filter(file => !gpsResults.some(gps => gps.file.name === file.name));
        setFilesWithoutGPS(filesWithoutGPS.map(file => file.name));
    };

    return (
        <div>
            {isPictureModalOpen && (
                <div className="pict-modal--overlay">
                    <div className="pict-modal--content">
                        <div className="pict-modal--header">
                            <div className="pict-modal--title">Upload Pictures</div>
                            <button
                                className="pict-modal--close-button"
                                onClick={closePictureModal}
                            >
                                X
                            </button>
                        </div>

                        <div className="pict-modal--body">
                            <label className="pict-modal--button">
                                Select Files
                                <input
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.heic,.HEIC"
                                    style={{ display: 'none' }}
                                    onChange={handleFileSelection}
                                />
                            </label>

                            {processingMessage && (
                                <div className="pict-modal--list">
                                    <p>{processingMessage}</p>
                                </div>
                            )}

                            {closestLocations.length > 0 && (
                                <div className="pict-modal--list">
                                    <h4>Pictures Saved at Closest Spot:</h4>
                                    <ul>
                                        {closestLocations.map((location, index) => (
                                            <li key={index}>
                                                {location.fileName.replace(/\.[Hh][Ee][Ii][Cc]$/, '.jpg')} stored at {location.closestLocationName} ({location.distance} mi)
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {filesWithoutGPS.length > 0 && (
                                <div className="pict-modal--list">
                                    <h4>The following files do not have GPS coordinates, load using 'Load Pictures without GPS' button:</h4>
                                    <p>{filesWithoutGPS.join(', ')}</p>
                                </div>
                            )}

                            {errors.length > 0 && (
                                <div className="pict-modal--list">
                                    <h4>Errors:</h4>
                                    <ul>
                                        {errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

ManagePictures.propTypes = {
    isPictureModalOpen: PropTypes.bool.isRequired,
    closePictureModal: PropTypes.func.isRequired,
    tripID: PropTypes.string.isRequired,
};

export default ManagePictures;

        