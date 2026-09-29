import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Location, Donation } from '../types';
import { getGeocodedCoords } from './AdminMapView';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const createQuickDonationIcon = (status: string) => {
  const isPending = status === 'PENDING' || status === 'AVAILABLE' || !status;
  const isAssigned = status === 'ASSIGNED';
  const bg = isPending ? '#f59e0b' : isAssigned ? '#4f46e5' : '#10b981';
  const symbol = isPending ? '🍲' : isAssigned ? '🚗' : '✅';

  const html = `
    <div style="background:${bg}; width:32px; height:32px; border-radius:10px; border:2px solid white; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 6px -1px rgba(0,0,0,0.2); font-size:14px; cursor:pointer;">
      <span>${symbol}</span>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-quick-donation-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 30],
    popupAnchor: [0, -28],
  });
};

const createQuickVolunteerIcon = () => {
  const html = `
    <div style="background:#059669; width:34px; height:34px; border-radius:50%; border:2px solid white; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 6px -1px rgba(0,0,0,0.2); color:white; font-weight:bold; font-size:12px; cursor:pointer;">
      <span>🚗</span>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-quick-vol-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

interface MapProps {
  locations: Location[];
  users: Record<string, { name: string; role: string }>;
  donations?: Donation[];
}

const LiveMap: React.FC<MapProps> = ({ locations, users, donations = [] }) => {
  // Center map on the first location, first donation, or default coordinate
  const defaultCenter = locations.length > 0 
    ? [locations[0].latitude, locations[0].longitude] 
    : donations.length > 0 && donations[0].pickup_latitude
    ? [donations[0].pickup_latitude, donations[0].pickup_longitude!]
    : [18.1067, 83.3956]; // Default HQ coordinates

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm z-0 relative">
      <MapContainer 
        center={defaultCenter as L.LatLngExpression} 
        zoom={locations.length > 0 || donations.length > 0 ? 12 : 5} 
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Real-time volunteer & user locations */}
        {locations.map(loc => {
          if (!loc.latitude || !loc.longitude) return null;
          const user = users[loc.user_id] || { name: 'Field Volunteer', role: 'VOLUNTEER' };
          
          return (
            <Marker 
              key={`loc_${loc.id}`} 
              position={[loc.latitude, loc.longitude]}
              icon={createQuickVolunteerIcon()}
            >
              <Popup>
                <div className="p-1">
                  <div className="font-bold text-gray-900 text-xs">{user.name}</div>
                  <div className="text-[11px] text-emerald-600 font-semibold mb-1">
                    {user.role} (Live Location)
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Last updated: {new Date(loc.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Geotagged active donation locations */}
        {donations.map((d, i) => {
          let lat = d.pickup_latitude;
          let lon = d.pickup_longitude;
          if (!lat || !lon) {
            const coords = getGeocodedCoords(d.pickup_location, i + 1);
            lat = coords[0];
            lon = coords[1];
          }

          return (
            <Marker
              key={`d_${d.id}`}
              position={[lat, lon]}
              icon={createQuickDonationIcon(d.status || 'PENDING')}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <span className="font-bold text-gray-900 block">{d.food_type}</span>
                  <span className="text-gray-500 block">{d.pickup_location}</span>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-indigo-600">{d.meals} meals</span>
                    <span className="font-semibold text-gray-700">{d.status}</span>
                  </div>
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
