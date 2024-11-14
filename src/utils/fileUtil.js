import { ref, uploadBytes } from 'firebase/storage';
import heic2any from 'heic2any';
import { storage } from './firebase'; // Assuming firebase.js is where storage is initialized

// Function to save original files to Firebase
export const handleSaveToFirebase = async (selectedFiles, setDisplayReferences, setFilesSaved) => {
    const firebaseRefs = [];

    for (let file of selectedFiles) {
        const storageRef = ref(storage, `personal_display/${file.name}`); // Store files in 'personal_display'
        try {
            const snapshot = await uploadBytes(storageRef, file);
            const firebaseRef = snapshot.metadata.fullPath; // Get the relative path in Firebase storage
            firebaseRefs.push({ fileName: file.name, firebaseRef }); // Store the relative path in firebaseRefs
        } catch (error) {
            console.error(`Error uploading file: ${file.name}`, error);
        }
    }

    if (firebaseRefs.length > 0) {
        setDisplayReferences(firebaseRefs); // Update displayReferences with relative paths
        setFilesSaved(true); // Mark files as saved
    } else {
        console.error("No files were saved.");
    }
};

// Function to convert HEIC files to JPG and save them to Firebase
export const handleConvertHeicToJpg = async (selectedFiles, setDisplayReferences, setHeicConverted) => {
    const displayRefs = [];

    for (let file of selectedFiles) {
        if (file.name.toLowerCase().endsWith('.heic')) {
            try {
                // Convert HEIC to JPG
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: 'image/jpeg',
                });
                const jpgFileName = file.name.replace(/\.[Hh][Ee][Ii][Cc]$/, '.jpg');
                
                // Upload converted JPG to personal_display
                const storageRef = ref(storage, `personal_display/${jpgFileName}`);
                const snapshot = await uploadBytes(storageRef, convertedBlob);
                const firebaseRef = snapshot.metadata.fullPath; // Get the relative path in Firebase storage
                
                // Push JPG reference to displayRefs (Storing the relative path)
                displayRefs.push({ fileName: jpgFileName, firebaseRef });

            } catch (error) {
                console.error(`Error converting HEIC file: ${file.name}`, error);
            }
        } else {
            // For non-HEIC files, upload them directly to personal_display
            const storageRef = ref(storage, `personal_display/${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const firebaseRef = snapshot.metadata.fullPath; // Get the relative path in Firebase storage
            
            // Push non-HEIC file reference to displayRefs (Storing the relative path)
            displayRefs.push({ fileName: file.name, firebaseRef });
        }
    }

    // Set the display references to only the personal_display paths
    setDisplayReferences(displayRefs);
    setHeicConverted(true); // Mark HEIC files as converted
};
