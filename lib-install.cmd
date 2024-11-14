@echo off
echo Installing Firebase and related libraries...
npm install firebase

echo Installing Mapbox...
npm install mapbox-gl

echo Installing React Image Gallery...
npm install react-image-gallery

echo Installing Material UI (MUI)...
npm install @mui/material @mui/icons-material

echo Installing Tiptap editor...
npm install @tiptap/react @tiptap/starter-kit @tiptap/core

echo Installing Papaparse...
npm install papaparse

echo Installing Exifr for EXIF metadata extraction...
npm install exifr

echo Installing Heic2any for HEIC to other image format conversion...
npm install heic2any

echo All libraries installed. Running final audit fix...
npm audit fix

echo Installation and audit complete.
pause
