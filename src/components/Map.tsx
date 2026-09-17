import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Location } from '../types';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons (Optional: we can just use default for now, or distinct colors if we had custom SVGs)

interface MapProps {
  locations: Location[];
  users: Record<string, { name: string, role: string }>;
}

const LiveMap: React.FC<MapProps> = ({ locations, users }) => {
  // Center map on the first location or a default coordinate
  const defaultCenter = locations.length > 0 
    ? [locations[0].latitude, locations[0].longitude] 
    : [20.5937, 78.9629]; // Default India coordinates

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0 relative">
      <MapContainer 
        center={defaultCenter as L.LatLngExpression} 
        zoom={locations.length > 0 ? 12 : 5} 
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map(loc => {
          if (!loc.latitude || !loc.longitude) return null;
          const user = users[loc.user_id] || { name: 'Unknown User', role: 'UNKNOWN' };
          
          return (
            <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
              <Popup>
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-indigo-600 mb-1">{user.role}</div>
                <div className="text-xs text-gray-500">
                  Last updated: {new Date(loc.timestamp).toLocaleTimeString()}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LiveMap;
