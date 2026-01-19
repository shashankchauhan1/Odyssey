'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// icons
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// helper to re-center map
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13);
  }, [lat, lng, map]);
  return null;
}

export default function TripMap({ destinationName }) {
  // default to new delhi if nothing found
  const [coords, setCoords] = useState({ lat: 28.6139, lng: 77.2090 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!destinationName) return;

    const fetchCoords = async () => {
      setLoading(true);
      setError(null);

      try {

        const res = await fetch(`/api/geocode?city=${encodeURIComponent(destinationName)}`);
        const data = await res.json();

        if (data && data.length > 0) {
          console.log("✅ Found:", data[0].lat, data[0].lon);
          setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        } else {
          setError("Location not found");
        }
      } catch (err) {
        console.error("Map Error:", err);
        setError("Failed to load map");
      } finally {
        setLoading(false);
      }
    };

    fetchCoords();
  }, [destinationName]);

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-inner border border-gray-200 relative z-0 bg-slate-100">
      
      {/* Loading / Error Overlay */}
      {loading && (
        <div className="absolute inset-0 z-[1000] bg-white/80 flex flex-col items-center justify-center text-gray-500 font-bold">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
          Finding {destinationName}...
        </div>
      )}
      
      {/* Map */}
      <MapContainer 
        center={[coords.lat, coords.lng]} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        <RecenterMap lat={coords.lat} lng={coords.lng} />

        <Marker position={[coords.lat, coords.lng]} icon={icon}>
          <Popup>
            <div className="text-center">
              <span className="font-bold text-lg">{destinationName}</span>
              <br/>
              <span className="text-gray-500 text-xs">Trip Destination</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}