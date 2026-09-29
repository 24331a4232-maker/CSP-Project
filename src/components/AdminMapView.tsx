import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Package, Truck, CheckCircle2, Clock, MapPin, Phone, 
  User as UserIcon, Shield, Navigation, Compass, Layers, 
  Search, Eye, Sparkles, Filter, ExternalLink, RefreshCw, 
  Maximize2, Crosshair, ArrowRight, AlertTriangle, Building, 
  Check, UserCheck, Flame, Route
} from 'lucide-react';
import { Donation, Location, User, VolunteerUser } from '../types';
import toast from 'react-hot-toast';

// Fix for standard leaflet icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper: Calculate Haversine Distance in Kilometers
export const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
};

// Fallback coordinate mapping for common cities/landmarks
export const getGeocodedCoords = (locationStr?: string, indexSeed: number = 0): [number, number] => {
  const str = (locationStr || '').toLowerCase();
  
  // Known cities coordinate baselines with slight jitter for distinct addresses
  let base: [number, number] = [18.1067, 83.3956]; // Vizianagaram (default)
  
  if (str.includes('vizag') || str.includes('visakhapatnam')) {
    base = [17.6868, 83.2185];
  } else if (str.includes('hyderabad') || str.includes('cyber') || str.includes('gachibowli')) {
    base = [17.3850, 78.4867];
  } else if (str.includes('bangalore') || str.includes('bengaluru') || str.includes('koramangala')) {
    base = [12.9716, 77.5946];
  } else if (str.includes('mumbai') || str.includes('andheri') || str.includes('bandra')) {
    base = [19.0760, 72.8777];
  } else if (str.includes('delhi') || str.includes('noida') || str.includes('gurugram')) {
    base = [28.6139, 77.2090];
  } else if (str.includes('chennai') || str.includes('anna')) {
    base = [13.0827, 80.2707];
  } else if (str.includes('kolkata')) {
    base = [22.5726, 88.3639];
  } else if (str.includes('san francisco') || str.includes('sf') || str.includes('mission')) {
    base = [37.7749, -122.4194];
  } else if (str.includes('new york') || str.includes('nyc') || str.includes('manhattan')) {
    base = [40.7128, -74.0060];
  }

  // Deterministic micro-jitter so multiple donations in the same city don't completely overlap
  const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), indexSeed);
  const jitterLat = ((hash % 100) - 50) * 0.003;
  const jitterLon = (((hash * 7) % 100) - 50) * 0.003;

  return [base[0] + jitterLat, base[1] + jitterLon];
};

// Create Custom HTML DivIcon for Donations
const createDonationMarkerIcon = (donation: Donation) => {
  const status = (donation.status || 'PENDING').toUpperCase();
  const isPending = status === 'PENDING' || status === 'AVAILABLE' || !donation.status;
  const isAssigned = status === 'ASSIGNED';
  const isPickedUp = status === 'PICKED_UP' || status === 'COMPLETED';

  let bgClass = 'bg-amber-500 text-amber-950 border-amber-300';
  let pulseHtml = '<div class="absolute -inset-1 rounded-full bg-amber-400 opacity-75 animate-ping"></div>';
  let iconSvg = `🍲`;
  let badgeText = `${donation.meals || 1} meals`;

  if (isAssigned) {
    bgClass = 'bg-indigo-600 text-white border-indigo-300';
    pulseHtml = '<div class="absolute -inset-1 rounded-full bg-indigo-400 opacity-60 animate-ping"></div>';
    iconSvg = `🚗`;
    badgeText = 'In Transit';
  } else if (isPickedUp) {
    bgClass = 'bg-emerald-600 text-white border-emerald-300';
    pulseHtml = '';
    iconSvg = `✅`;
    badgeText = 'Collected';
  }

  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer">
      ${isPending ? pulseHtml : ''}
      <div class="w-10 h-10 rounded-2xl shadow-lg border-2 flex items-center justify-center font-bold text-base transition-transform group-hover:scale-110 ${bgClass}">
        <span>${iconSvg}</span>
      </div>
      <div class="mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold whitespace-nowrap shadow-xs uppercase tracking-tight bg-gray-900 text-white border border-gray-700">
        ${badgeText}
      </div>
      <div class="w-2 h-2 bg-gray-900 rotate-45 -mt-1"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-donation-marker',
    iconSize: [42, 54],
    iconAnchor: [21, 50],
    popupAnchor: [0, -48],
  });
};

// Create Custom HTML DivIcon for Live Volunteers
const createVolunteerMarkerIcon = (volunteerName: string, vehicleType: string = 'Vehicle', isActive: boolean = true) => {
  const initial = (volunteerName || 'V').charAt(0).toUpperCase();
  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer">
      <div class="absolute -inset-2 rounded-full bg-emerald-400/50 animate-ping"></div>
      <div class="w-11 h-11 rounded-full shadow-xl border-2 border-white bg-gradient-to-tr from-emerald-700 to-teal-500 text-white flex items-center justify-center font-black text-sm relative z-10">
        <span>${initial}</span>
        <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-[9px] flex items-center justify-center border border-white">
          🚗
        </span>
      </div>
      <div class="mt-1 px-2 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap bg-emerald-950 text-emerald-200 border border-emerald-700 shadow-md">
        ${volunteerName.split(' ')[0]} (Live)
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-volunteer-marker',
    iconSize: [48, 56],
    iconAnchor: [24, 48],
    popupAnchor: [0, -44],
  });
};

// Map Recenter Controller
const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

// Auto-Fit Bounds Controller
const MapBoundsFitter: React.FC<{ markers: [number, number][]; trigger: number }> = ({ markers, trigger }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    try {
      const bounds = L.latLngBounds(markers.map(m => L.latLng(m[0], m[1])));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } catch (e) {
      console.warn('Could not fit bounds:', e);
    }
  }, [trigger, markers, map]);
  return null;
};

interface AdminMapViewProps {
  donations: Donation[];
  locations: Location[];
  users: Record<string, User>;
  volunteersList?: VolunteerUser[];
  onAssignVolunteer?: (donationId: string, volunteerId: string, volunteerName: string, volunteerPhone: string) => Promise<void>;
  onViewDonationQr?: (donation: Donation) => void;
}

export const AdminMapView: React.FC<AdminMapViewProps> = ({
  donations,
  locations,
  users,
  volunteersList = [],
  onAssignVolunteer,
  onViewDonationQr,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'PENDING' | 'ASSIGNED' | 'PICKED_UP'>('ALL');
  const [showVolunteers, setShowVolunteers] = useState(true);
  const [showDonations, setShowDonations] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.1067, 83.3956]);
  const [mapZoom, setMapZoom] = useState(12);
  const [fitTrigger, setFitTrigger] = useState(0);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<Record<string, string>>({});

  // 1. Process Geo-tagged Donations
  const processedDonations = useMemo(() => {
    return donations.map((d, index) => {
      let lat = d.pickup_latitude;
      let lon = d.pickup_longitude;

      if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        const coords = getGeocodedCoords(d.pickup_location, index + 1);
        lat = coords[0];
        lon = coords[1];
      }

      return {
        ...d,
        computedLat: lat,
        computedLon: lon,
      };
    });
  }, [donations]);

  // 2. Process Live Volunteer Locations
  const liveVolunteers = useMemo(() => {
    const map = new Map<string, {
      userId: string;
      name: string;
      phone: string;
      role: string;
      vehicle_type: string;
      organization: string;
      latitude: number;
      longitude: number;
      timestamp: number;
      isAssigned: boolean;
    }>();

    // From active locations sharing collection
    locations.forEach(loc => {
      if (!loc.latitude || !loc.longitude) return;
      const user = users[loc.user_id];
      const role = (user?.role || '').toUpperCase();
      
      if (role === 'VOLUNTEER' || role === 'CAPTAIN' || role === 'ADMIN' || !user) {
        map.set(loc.user_id, {
          userId: loc.user_id,
          name: user?.name || (user as any)?.full_name || 'Active Volunteer',
          phone: user?.phone || '',
          role: user?.role || 'VOLUNTEER',
          vehicle_type: (user as any)?.vehicle_type || 'Cargo Vehicle',
          organization: user?.organization || 'FoodBridge Relief Team',
          latitude: loc.latitude,
          longitude: loc.longitude,
          timestamp: loc.timestamp || Date.now(),
          isAssigned: donations.some(d => d.volunteer_id === loc.user_id && d.status === 'ASSIGNED')
        });
      }
    });

    // If locations collection has fewer entries, also include volunteers with assigned addresses/coords
    volunteersList.forEach((v, idx) => {
      if (!map.has(v.id)) {
        const coords = getGeocodedCoords(v.address || v.city || 'Vizianagaram', idx + 10);
        map.set(v.id, {
          userId: v.id,
          name: v.full_name || v.username || 'Volunteer',
          phone: v.phone || '',
          role: 'VOLUNTEER',
          vehicle_type: v.vehicle_type || 'Utility Vehicle',
          organization: v.organization || 'Volunteer Network',
          latitude: coords[0],
          longitude: coords[1],
          timestamp: Date.now() - 5 * 60000,
          isAssigned: donations.some(d => d.volunteer_id === v.id && d.status === 'ASSIGNED')
        });
      }
    });

    return Array.from(map.values());
  }, [locations, users, volunteersList, donations]);

  // 3. Filtered Donations based on UI controls
  const filteredDonations = useMemo(() => {
    return processedDonations.filter(d => {
      const statusUpper = (d.status || 'PENDING').toUpperCase();
      const isPending = statusUpper === 'PENDING' || statusUpper === 'AVAILABLE' || !d.status;
      const isAssigned = statusUpper === 'ASSIGNED';
      const isPickedUp = statusUpper === 'PICKED_UP' || statusUpper === 'COMPLETED';

      if (filterType === 'PENDING' && !isPending) return false;
      if (filterType === 'ASSIGNED' && !isAssigned) return false;
      if (filterType === 'PICKED_UP' && !isPickedUp) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const food = (d.food_type || '').toLowerCase();
        const donor = (d.donor_organization || d.donor_name || '').toLowerCase();
        const vol = (d.volunteer_name || '').toLowerCase();
        const loc = (d.pickup_location || '').toLowerCase();
        return food.includes(term) || donor.includes(term) || vol.includes(term) || loc.includes(term);
      }
      return true;
    });
  }, [processedDonations, filterType, searchTerm]);

  // 4. Connecting In-Transit Trajectories
  const activeRoutes = useMemo(() => {
    const routes: Array<{
      donationId: string;
      foodType: string;
      volunteerName: string;
      from: [number, number];
      to: [number, number];
      distanceKm: number;
    }> = [];

    processedDonations.forEach(d => {
      if ((d.status || '').toUpperCase() === 'ASSIGNED' && d.volunteer_id) {
        const vol = liveVolunteers.find(v => v.userId === d.volunteer_id);
        if (vol && d.computedLat && d.computedLon) {
          const dist = calculateDistanceKm(vol.latitude, vol.longitude, d.computedLat, d.computedLon);
          routes.push({
            donationId: d.id,
            foodType: d.food_type,
            volunteerName: vol.name,
            from: [vol.latitude, vol.longitude],
            to: [d.computedLat, d.computedLon],
            distanceKm: dist
          });
        }
      }
    });

    return routes;
  }, [processedDonations, liveVolunteers]);

  // All coordinates for auto-fit
  const allCoordinates = useMemo(() => {
    const list: [number, number][] = [];
    if (showDonations) {
      filteredDonations.forEach(d => {
        if (d.computedLat && d.computedLon) list.push([d.computedLat, d.computedLon]);
      });
    }
    if (showVolunteers) {
      liveVolunteers.forEach(v => {
        if (v.latitude && v.longitude) list.push([v.latitude, v.longitude]);
      });
    }
    return list;
  }, [filteredDonations, liveVolunteers, showDonations, showVolunteers]);

  // Set initial bounds once on load
  useEffect(() => {
    if (allCoordinates.length > 0) {
      setMapCenter(allCoordinates[0]);
      setFitTrigger(prev => prev + 1);
    }
  }, []);

  const handleFitAll = () => {
    if (allCoordinates.length === 0) {
      toast.error('No coordinates to fit');
      return;
    }
    setFitTrigger(prev => prev + 1);
    toast.success('Map adjusted to fit all active markers', { duration: 1500 });
  };

  const handleFocusDonation = (d: any) => {
    setSelectedDonationId(d.id);
    setSelectedVolunteerId(null);
    setMapCenter([d.computedLat, d.computedLon]);
    setMapZoom(15);
  };

  const handleFocusVolunteer = (v: any) => {
    setSelectedVolunteerId(v.userId);
    setSelectedDonationId(null);
    setMapCenter([v.latitude, v.longitude]);
    setMapZoom(15);
  };

  const handleQuickDispatch = async (donationId: string) => {
    const selectedVolId = selectedAssignee[donationId];
    if (!selectedVolId) {
      toast.error('Please select a volunteer from the list');
      return;
    }

    const vol = liveVolunteers.find(v => v.userId === selectedVolId) || 
                volunteersList.find(v => v.id === selectedVolId);
    if (!vol) {
      toast.error('Volunteer not found');
      return;
    }

    const volName = (vol as any).name || (vol as any).full_name || 'Volunteer';
    const volPhone = (vol as any).phone || '';

    setIsAssigning(donationId);
    try {
      if (onAssignVolunteer) {
        await onAssignVolunteer(donationId, selectedVolId, volName, volPhone);
      }
      toast.success(`Dispatched ${volName} to donation! Trajectory now active on map.`);
    } catch (err: any) {
      toast.error('Dispatch failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsAssigning(null);
    }
  };

  const pendingCount = processedDonations.filter(d => (d.status || '').toUpperCase() === 'PENDING' || (d.status || '').toUpperCase() === 'AVAILABLE' || !d.status).length;
  const assignedCount = processedDonations.filter(d => (d.status || '').toUpperCase() === 'ASSIGNED').length;
  const pickedUpCount = processedDonations.filter(d => (d.status || '').toUpperCase() === 'PICKED_UP' || (d.status || '').toUpperCase() === 'COMPLETED').length;

  return (
    <div className="space-y-4">
      {/* Top Map Statistics & Quick Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Navigation className="w-5 h-5 text-indigo-600" />
              <span>Real-Time Geolocation Dispatch Map</span>
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Visualizing <span className="font-bold text-gray-800">{processedDonations.length}</span> food listings & <span className="font-bold text-emerald-600">{liveVolunteers.length}</span> active field volunteers with live trajectory routing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleFitAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Fit all markers in viewport"
          >
            <Crosshair className="w-3.5 h-3.5 text-gray-600" />
            <span>Fit All Bounds</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMapCenter([18.1067, 83.3956]);
              setMapZoom(13);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors border border-indigo-200 cursor-pointer"
          >
            <Building className="w-3.5 h-3.5 text-indigo-600" />
            <span>HQ Center</span>
          </button>
        </div>
      </div>

      {/* Main Map Container + Interactive Side Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left / Center: Interactive Leaflet Map (8 cols on desktop) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative">
          
          {/* Map Controls Floating Header */}
          <div className="p-3 bg-gray-50/95 backdrop-blur-xs border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filterType === 'ALL' ? 'bg-gray-900 text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                All ({processedDonations.length})
              </button>
              <button
                onClick={() => setFilterType('PENDING')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  filterType === 'PENDING' ? 'bg-amber-500 text-amber-950 shadow-xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>🟡 Needs Volunteer</span>
                <span className="px-1 py-0.2 bg-amber-200/80 rounded-full text-[10px] font-extrabold">{pendingCount}</span>
              </button>
              <button
                onClick={() => setFilterType('ASSIGNED')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  filterType === 'ASSIGNED' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <span>🔵 In Transit</span>
                <span className="px-1 py-0.2 bg-indigo-200/80 text-indigo-900 rounded-full text-[10px] font-extrabold">{assignedCount}</span>
              </button>
              <button
                onClick={() => setFilterType('PICKED_UP')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  filterType === 'PICKED_UP' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span>🟢 Picked Up</span>
                <span className="px-1 py-0.2 bg-emerald-200/80 text-emerald-950 rounded-full text-[10px] font-extrabold">{pickedUpCount}</span>
              </button>
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-3 font-semibold text-gray-700">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDonations}
                  onChange={(e) => setShowDonations(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Donation Pins</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showVolunteers}
                  onChange={(e) => setShowVolunteers(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Live Volunteers</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showRoutes}
                  onChange={(e) => setShowRoutes(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Transit Routes</span>
              </label>
            </div>
          </div>

          {/* Leaflet Map Surface */}
          <div className="h-[520px] w-full relative z-0">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapRecenter center={mapCenter} zoom={mapZoom} />
              <MapBoundsFitter markers={allCoordinates} trigger={fitTrigger} />

              {/* 1. RENDER DONATION MARKERS */}
              {showDonations && filteredDonations.map(donation => {
                if (!donation.computedLat || !donation.computedLon) return null;
                const isSelected = selectedDonationId === donation.id;
                const statusUpper = (donation.status || 'PENDING').toUpperCase();
                const isPending = statusUpper === 'PENDING' || statusUpper === 'AVAILABLE' || !donation.status;
                const isAssigned = statusUpper === 'ASSIGNED';
                const isPickedUp = statusUpper === 'PICKED_UP' || statusUpper === 'COMPLETED';

                // Find closest live volunteers to this donation
                const nearbyVolunteers = liveVolunteers
                  .map(v => ({
                    ...v,
                    distanceKm: calculateDistanceKm(donation.computedLat!, donation.computedLon!, v.latitude, v.longitude),
                  }))
                  .sort((a, b) => a.distanceKm - b.distanceKm)
                  .slice(0, 3);

                return (
                  <React.Fragment key={`don_${donation.id}`}>
                    <Marker
                      position={[donation.computedLat, donation.computedLon]}
                      icon={createDonationMarkerIcon(donation)}
                      eventHandlers={{
                        click: () => {
                          setSelectedDonationId(donation.id);
                          setSelectedVolunteerId(null);
                        }
                      }}
                    >
                      <Popup className="custom-popup" minWidth={280} maxWidth={320}>
                        <div className="p-1 space-y-2">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2 border-b pb-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${
                                  isPending ? 'bg-amber-500' : isAssigned ? 'bg-indigo-600' : 'bg-emerald-500'
                                }`} />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                  {isPending ? 'Awaiting Volunteer' : isAssigned ? 'Volunteer En Route' : 'Picked Up'}
                                </span>
                              </div>
                              <h3 className="text-sm font-extrabold text-gray-900 mt-0.5">
                                {donation.food_type}
                              </h3>
                              <p className="text-[11px] text-gray-500">
                                {donation.category || 'Food Rescue'}
                              </p>
                            </div>
                            <span className="text-xs font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md shrink-0">
                              {donation.meals || 1} meals
                            </span>
                          </div>

                          {/* Details */}
                          <div className="space-y-1.5 text-xs text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="font-semibold text-gray-900">
                                {donation.donor_organization || donation.donor_name || 'Donor'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{donation.pickup_location}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>Qty: {donation.quantity}</span>
                            </div>

                            {/* Volunteer info if assigned */}
                            {donation.volunteer_id && (
                              <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center justify-between text-[11px] text-indigo-900">
                                <div className="flex items-center gap-1.5">
                                  <Truck className="w-3.5 h-3.5 text-indigo-600" />
                                  <span className="font-bold">{donation.volunteer_name || 'Volunteer in transit'}</span>
                                </div>
                                {donation.volunteer_phone && (
                                  <a
                                    href={`tel:${donation.volunteer_phone}`}
                                    className="font-bold text-indigo-600 hover:text-indigo-800"
                                  >
                                    Call
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Nearby Volunteers for Instant Dispatch */}
                            {isPending && nearbyVolunteers.length > 0 && (
                              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                                  Nearby Active Volunteers
                                </span>
                                <div className="space-y-1">
                                  {nearbyVolunteers.map(v => (
                                    <div key={v.userId} className="flex items-center justify-between bg-gray-50 p-1.5 rounded text-[11px]">
                                      <div className="truncate pr-2">
                                        <span className="font-bold text-gray-800">{v.name}</span>
                                        <span className="text-gray-400 text-[10px] block">{v.vehicle_type}</span>
                                      </div>
                                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                                        {v.distanceKm} km
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Dispatch Dropdown */}
                                {onAssignVolunteer && (
                                  <div className="pt-1 flex items-center gap-1.5">
                                    <select
                                      value={selectedAssignee[donation.id] || ''}
                                      onChange={(e) => setSelectedAssignee({ ...selectedAssignee, [donation.id]: e.target.value })}
                                      className="w-full text-xs p-1 border rounded bg-white"
                                    >
                                      <option value="">Choose Volunteer...</option>
                                      {liveVolunteers.map(v => (
                                        <option key={v.userId} value={v.userId}>
                                          {v.name} ({v.vehicle_type})
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      disabled={isAssigning === donation.id || !selectedAssignee[donation.id]}
                                      onClick={() => handleQuickDispatch(donation.id)}
                                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs shrink-0 disabled:opacity-50"
                                    >
                                      {isAssigning === donation.id ? '...' : 'Assign'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Footer Actions */}
                          <div className="pt-2 border-t flex items-center justify-between">
                            {onViewDonationQr && (
                              <button
                                type="button"
                                onClick={() => onViewDonationQr(donation)}
                                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                              >
                                <span>View QR Pass</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                            <span className="text-[10px] text-gray-400 font-mono">
                              ID: {donation.id.slice(0, 6)}
                            </span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Proximity Circle around pending donation */}
                    {isPending && isSelected && (
                      <Circle
                        center={[donation.computedLat, donation.computedLon]}
                        radius={2500} // 2.5km radius
                        pathOptions={{ color: '#f59e0b', fillColor: '#fef3c7', fillOpacity: 0.15, dashArray: '4, 4' }}
                      />
                    )}
                  </React.Fragment>
                );
              })}

              {/* 2. RENDER LIVE VOLUNTEER MARKERS */}
              {showVolunteers && liveVolunteers.map(volunteer => {
                if (!volunteer.latitude || !volunteer.longitude) return null;
                const isSelected = selectedVolunteerId === volunteer.userId;

                return (
                  <React.Fragment key={`vol_${volunteer.userId}`}>
                    <Marker
                      position={[volunteer.latitude, volunteer.longitude]}
                      icon={createVolunteerMarkerIcon(volunteer.name, volunteer.vehicle_type, true)}
                      eventHandlers={{
                        click: () => {
                          setSelectedVolunteerId(volunteer.userId);
                          setSelectedDonationId(null);
                        }
                      }}
                    >
                      <Popup className="custom-popup" minWidth={260}>
                        <div className="p-1 space-y-2">
                          <div className="flex items-center gap-2 border-b pb-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                              {volunteer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-gray-900">{volunteer.name}</h4>
                              <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                Active Field Volunteer
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1 text-xs text-gray-600">
                            <div><span className="text-gray-400">Vehicle:</span> <span className="font-bold text-gray-800">{volunteer.vehicle_type}</span></div>
                            <div><span className="text-gray-400">Team:</span> <span>{volunteer.organization}</span></div>
                            <div><span className="text-gray-400">GPS Updated:</span> <span>{new Date(volunteer.timestamp).toLocaleTimeString()}</span></div>
                            {volunteer.phone && (
                              <div className="pt-1">
                                <a
                                  href={`tel:${volunteer.phone}`}
                                  className="w-full inline-flex items-center justify-center gap-1.5 py-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-bold text-xs transition-colors"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>Call Volunteer ({volunteer.phone})</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Coverage Radius Circle */}
                    {isSelected && (
                      <Circle
                        center={[volunteer.latitude, volunteer.longitude]}
                        radius={4000} // 4km service radius
                        pathOptions={{ color: '#059669', fillColor: '#10b981', fillOpacity: 0.12 }}
                      />
                    )}
                  </React.Fragment>
                );
              })}

              {/* 3. RENDER ACTIVE TRANSIT ROUTES */}
              {showRoutes && activeRoutes.map((route, i) => (
                <Polyline
                  key={`route_${route.donationId}_${i}`}
                  positions={[route.from, route.to]}
                  pathOptions={{
                    color: '#4f46e5',
                    weight: 3.5,
                    opacity: 0.8,
                    dashArray: '8, 8',
                  }}
                >
                  <Popup>
                    <div className="text-xs font-bold text-gray-900 p-1">
                      <p className="text-indigo-600">🚗 Active Transit Trajectory</p>
                      <p className="mt-0.5">{route.volunteerName} &rarr; {route.foodType}</p>
                      <p className="text-gray-500 font-mono text-[10px] mt-1">Direct Distance: {route.distanceKm} km</p>
                    </div>
                  </Popup>
                </Polyline>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Right: Live Feeds & Dispatch Sidebar (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search map by food, donor, location..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-2xs font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-[10px] font-extrabold uppercase text-amber-800">Pending Rescue</span>
              <p className="text-lg font-black text-amber-900 mt-0.5">{pendingCount}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[10px] font-extrabold uppercase text-emerald-800">Live Volunteers</span>
              <p className="text-lg font-black text-emerald-900 mt-0.5">{liveVolunteers.length}</p>
            </div>
          </div>

          {/* Live Dispatch Feed List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Active Geotagged Listings</span>
              </h3>
              <span className="text-[11px] font-bold text-gray-500 font-mono">
                {filteredDonations.length} Items
              </span>
            </div>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
              {filteredDonations.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-bold text-gray-700">No listings match filter</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Try resetting search or filter tags</p>
                </div>
              ) : (
                filteredDonations.map(d => {
                  const statusUpper = (d.status || 'PENDING').toUpperCase();
                  const isPending = statusUpper === 'PENDING' || statusUpper === 'AVAILABLE' || !d.status;
                  const isAssigned = statusUpper === 'ASSIGNED';
                  const isPickedUp = statusUpper === 'PICKED_UP' || statusUpper === 'COMPLETED';
                  const isSelected = selectedDonationId === d.id;

                  return (
                    <div
                      key={d.id}
                      onClick={() => handleFocusDonation(d)}
                      className={`p-3 transition-colors cursor-pointer text-left hover:bg-gray-50 ${
                        isSelected ? 'bg-indigo-50/60 border-l-4 border-indigo-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="truncate">
                          <h4 className="text-xs font-extrabold text-gray-900 truncate">
                            {d.food_type}
                          </h4>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">
                            {d.donor_organization || d.donor_name || 'Donor'} • {d.pickup_location}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold shrink-0 ${
                          isPending ? 'bg-amber-100 text-amber-900' :
                          isAssigned ? 'bg-indigo-100 text-indigo-900' :
                          'bg-emerald-100 text-emerald-900'
                        }`}>
                          {isPending ? 'Pending' : isAssigned ? 'In Transit' : 'Collected'}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                        <span className="font-semibold text-gray-700">{d.quantity} ({d.meals || 1} meals)</span>
                        <span className="font-bold text-indigo-600 hover:underline flex items-center gap-1">
                          <span>Focus Map</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Live Volunteers List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Live Volunteers in Field</span>
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {liveVolunteers.length} Active
              </span>
            </div>

            <div className="max-h-[220px] overflow-y-auto divide-y divide-gray-100">
              {liveVolunteers.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  No volunteers currently broadcasting location.
                </div>
              ) : (
                liveVolunteers.map(v => (
                  <div
                    key={v.userId}
                    onClick={() => handleFocusVolunteer(v)}
                    className={`p-2.5 transition-colors cursor-pointer flex items-center justify-between hover:bg-gray-50 ${
                      selectedVolunteerId === v.userId ? 'bg-emerald-50/60 border-l-4 border-emerald-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                        {v.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-gray-900 truncate">{v.name}</p>
                        <p className="text-[10px] text-gray-400">{v.vehicle_type} • {v.isAssigned ? 'On Delivery' : 'Available'}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFocusVolunteer(v);
                      }}
                      className="px-2 py-1 bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-800 rounded text-[10px] font-bold transition-colors shrink-0"
                    >
                      Locate
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
export default AdminMapView;
