import bezierSpline from './bezierSpline'; // Assuming bezierSpline is in the utils folder

export const drawLinesBetweenLocations = (locationsData, mapRef, mapLineColor) => {
  // Sort locationsData by seq as an integer to ensure correct sequence
  const sortedLocationsData = locationsData.sort((a, b) => parseInt(a.seq, 10) - parseInt(b.seq, 10));

  const maxLocSeq = Math.max(...sortedLocationsData.map(location => parseInt(location.seq, 10)));
  console.log("Drawing lines between locations");

  sortedLocationsData.forEach((location, index) => {
    const currentLocSeq = parseInt(location.seq, 10);

    // Skip drawing a line for the last location
    if (currentLocSeq === maxLocSeq) {
      console.log(`Skipping line from last location: ${location.name}`);
      return;
    }

    const nextLocation = sortedLocationsData[index + 1];

    // Only draw if the next location exists
    if (!nextLocation) {
      console.log(`No next location for ${location.name} (seq=${currentLocSeq})`);
      return;
    }

    // Parse waypoints if they exist, otherwise use an empty array
    let waypoints = location.nextWaypoints && location.nextWaypoints.length > 0
      ? JSON.parse(location.nextWaypoints).map(wp => [wp.lng, wp.lat])
      : [];

    // Include current location lat/lng and next location lat/lng
    const coordinates = [
      [location.lng, location.lat],
      ...waypoints,
      [nextLocation.lng, nextLocation.lat]
    ];

    console.log(`Drawing line from ${location.name} to ${nextLocation.name}, with waypoints:`, waypoints);

    // Create the line string
    const createLineString = (coordinates) => {
      return {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: coordinates
        }
      };
    };

    // Check if waypoints exist to determine if the line should be curved or straight
    const lineString = createLineString(coordinates);
    const lineData = waypoints.length > 0
      ? bezierSpline(lineString, { resolution: 10000, sharpness: 0.85 })  // Curved line
      : lineString;  // Straight line if no waypoints

    // Add the line to the map
    mapRef.current.addSource(`line-${index + 1}`, {
      type: 'geojson',
      data: lineData,
    });

    mapRef.current.addLayer({
      id: `line-layer-${index + 1}`,
      type: 'line',
      source: `line-${index + 1}`,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': mapLineColor,
        'line-width': 2,
      },
    });
  });
};
