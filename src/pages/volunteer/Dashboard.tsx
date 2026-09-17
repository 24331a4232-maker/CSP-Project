import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { Camera, MapPin, Clock, Package, CheckCircle, Navigation, Map as MapIcon, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Donation } from '../../types';
import LiveMap from '../../components/Map';

const VolunteerDashboard = () => {
  const { currentUser, userData } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for PENDING and ASSIGNED donations for this volunteer
    const q = query(
      collection(db, 'donations'),
      where('status', 'in', ['PENDING', 'ASSIGNED'])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));
      // Filter logically: either it's pending (open for all), or assigned to THIS volunteer
      const filtered = data.filter(d => d.status === 'PENDING' || (d.status === 'ASSIGNED' && d.volunteer_id === currentUser?.uid));
      setDonations(filtered.sort((a, b) => b.created_at - a.created_at));
      setLoading(false);
    });
    
    return unsubscribe;
  }, [currentUser]);

  const handleAccept = async (donationId: string) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'ASSIGNED',
        volunteer_id: currentUser.uid
      });
      toast.success('Donation accepted successfully!');
    } catch (error) {
      toast.error('Failed to accept donation');
    }
  };

  useEffect(() => {
    if (!isScannerOpen) return;
    
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    
    scanner.render(async (decodedText) => {
      // On Success
      if (scanning) return; // Prevent double scan
      setScanning(true);
      scanner.clear();
      setIsScannerOpen(false);
      
      try {
        // Find donation by qr_token that belongs to this volunteer and is assigned
        const match = donations.find(d => d.qr_token === decodedText);
        if (!match) {
          toast.error('Invalid QR Code or donation not assigned to you.');
          setScanning(false);
          return;
        }

        if (match.status !== 'ASSIGNED') {
          toast.error('Donation is not in ASSIGNED state.');
          setScanning(false);
          return;
        }

        const now = Date.now();
        // Update donation
        await updateDoc(doc(db, 'donations', match.id), {
          status: 'PICKED_UP',
          scanned_at: now
        });

        // Send Notification to Admin
        await addDoc(collection(db, 'notifications'), {
          donation_id: match.id,
          message: `Food Donation Collected (ID: ${match.id.slice(0, 8)}) - Donor: ${match.donor_id}, Volunteer: ${userData?.name}, Food: ${match.quantity} (${match.meals} meals) at ${new Date(now).toLocaleTimeString()}`,
          type: 'QR_SCANNED',
          is_read: false,
          created_at: now
        });

        toast.success('Food Collected Successfully ✅', { duration: 5000 });
      } catch (error) {
        toast.error('Error verifying QR Code.');
      } finally {
        setScanning(false);
      }
    }, (error) => {
      // Ignore scan errors while seeking
    });

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [isScannerOpen, scanning, donations, userData]);

  // Create markers for the map based on donations (with valid coordinates)
  // For the sake of the prototype, we assume some donations have coordinates
  // Or we just show the donations that have coordinates.
  const mapLocations = donations
    .filter(d => d.pickup_latitude && d.pickup_longitude)
    .map(d => ({
      id: d.id,
      user_id: d.donor_id,
      latitude: d.pickup_latitude as number,
      longitude: d.pickup_longitude as number,
      timestamp: d.created_at,
      sharing_enabled: true
    }));

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Volunteer Dashboard</h1>
          <p className="text-gray-600 mt-1">Accept donations and scan QR codes upon pickup</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'LIST' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('MAP')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'MAP' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Map View"
            >
              <MapIcon className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setIsScannerOpen(!isScannerOpen)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            <Camera className="w-5 h-5" />
            {isScannerOpen ? 'Close Scanner' : 'Scan QR Code'}
          </button>
        </div>
      </div>

      {isScannerOpen && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto">
          <div id="qr-reader" className="w-full"></div>
          <p className="text-sm text-center text-gray-500 mt-4">Point your camera at the donor's QR code to verify pickup.</p>
        </div>
      )}

      {viewMode === 'MAP' ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Available Donations Map</h2>
          {loading ? (
            <div className="h-[400px] w-full rounded-xl bg-gray-100 animate-pulse"></div>
          ) : mapLocations.length > 0 ? (
            <LiveMap locations={mapLocations} users={{}} />
          ) : (
            <div className="h-[400px] w-full rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 flex-col gap-2">
              <MapIcon className="w-8 h-8 text-gray-400" />
              <p>No donations with coordinates available</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-56 animate-pulse"></div>
              ))}
            </>
          ) : donations.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
              No available or assigned donations at the moment. Check back later.
            </div>
          ) : (
            donations.map(donation => (
              <div key={donation.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{donation.food_type}</h3>
                    <p className="text-sm text-gray-500">ID: {donation.id.slice(0, 8)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${donation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                    {donation.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 text-sm text-gray-600 border-t border-gray-50 pt-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span>{donation.quantity} ({donation.meals} meals)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{donation.pickup_location}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{new Date(donation.pickup_time).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  {donation.status === 'PENDING' ? (
                    <button
                      onClick={() => handleAccept(donation.id)}
                      className="flex-1 bg-indigo-50 text-indigo-700 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
                    >
                      Accept Donation
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsScannerOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                      >
                        <Camera className="w-4 h-4" /> Scan to Collect
                      </button>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(donation.pickup_location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                      >
                        <Navigation className="w-4 h-4" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
