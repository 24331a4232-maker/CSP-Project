import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, getDocs } from 'firebase/firestore';
import { Camera, MapPin, Clock, Package, Navigation, Map as MapIcon, List, Eye, Phone, Building, User, Info, X, CheckCircle2, Sparkles, HeartHandshake, AlertCircle, Utensils, Truck } from 'lucide-react';
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
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'MY_TASKS'>('PENDING');

  const [loading, setLoading] = useState(true);
  const initialLoadRef = useRef(true);
  const knownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Listen for live donations across both PENDING and ASSIGNED
    const unsubscribe = onSnapshot(collection(db, 'donations'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));
      
      // Check for newly added donations after initial load
      if (!initialLoadRef.current) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const added = change.doc.data() as Donation;
            const statusUpper = (added.status || '').toUpperCase();
            if ((statusUpper === 'PENDING' || statusUpper === 'AVAILABLE') && !knownIdsRef.current.has(change.doc.id)) {
              toast.success(
                `🍲 New Food Donation Listed: "${added.food_type || 'Surplus Food'}" (${added.quantity || ''}) by ${added.donor_organization || added.donor_name || 'Donor'}!`,
                { duration: 6000 }
              );
            }
          }
        });
      }

      // Record known IDs
      const currentIds = new Set<string>();
      snapshot.docs.forEach(doc => currentIds.add(doc.id));
      knownIdsRef.current = currentIds;
      initialLoadRef.current = false;

      // Filter logically: pending (open for all), or assigned to THIS volunteer
      const filtered = data.filter(d => {
        const s = (d.status || '').toUpperCase();
        const isPending = s === 'PENDING' || s === 'AVAILABLE' || !d.status;
        const isAssignedToMe = s === 'ASSIGNED' && d.volunteer_id === currentUser?.uid;
        return isPending || isAssignedToMe;
      });

      setDonations(filtered.sort((a, b) => (b.created_at || 0) - (a.created_at || 0)));
      setLoading(false);
    }, (error) => {
      console.warn("Volunteer donations query warning:", error);
      setLoading(false);
    });
    
    return unsubscribe;
  }, [currentUser]);

  const handleAccept = async (donationId: string, donationObj?: Donation) => {
    if (!currentUser) return;
    try {
      const volunteerName = userData?.name || currentUser.displayName || 'Volunteer';
      
      // Update primary collection
      await updateDoc(doc(db, 'donations', donationId), {
        status: 'ASSIGNED',
        volunteer_id: currentUser.uid,
        volunteer_name: volunteerName,
        volunteer_phone: userData?.phone || ''
      });

      // Mirror update to food_donations
      try {
        await updateDoc(doc(db, 'food_donations', donationId), {
          status: 'ASSIGNED',
          volunteer_id: currentUser.uid,
          volunteer_name: volunteerName,
          volunteer_phone: userData?.phone || ''
        });
      } catch (e) {}

      // Log dispatch in pickups
      try {
        await addDoc(collection(db, 'pickups'), {
          donation_id: donationId,
          donor_id: donationObj?.donor_id || '',
          volunteer_id: currentUser.uid,
          volunteer_name: volunteerName,
          status: 'IN_TRANSIT',
          scheduled_time: donationObj?.pickup_time || new Date().toISOString(),
          created_at: Date.now()
        });
      } catch (e) {}

      // Notify admin & donor
      await addDoc(collection(db, 'notifications'), {
        donation_id: donationId,
        message: `Donation Accepted: ${volunteerName} accepted to pick up "${donationObj?.food_type || 'Food Donation'}" (${donationObj?.quantity || ''})`,
        type: 'DONATION_ASSIGNED',
        targetRole: 'all',
        is_read: false,
        created_at: Date.now()
      });

      toast.success('Donation accepted! You can now view pickup details, directions, and scan QR on collection.');
      if (selectedDonation && selectedDonation.id === donationId) {
        setSelectedDonation({
          ...selectedDonation,
          status: 'ASSIGNED',
          volunteer_id: currentUser.uid,
          volunteer_name: volunteerName
        });
      }
    } catch (error: any) {
      console.error('Failed to accept donation:', error);
      toast.error('Failed to accept donation: ' + (error?.message || 'Unknown error'));
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
          message: `Food Donation Collected: "${match.food_type}" (${match.quantity}, ${match.meals} meals) collected by ${userData?.name || 'Volunteer'} from ${match.donor_name || 'Donor'} at ${new Date(now).toLocaleTimeString()}`,
          type: 'QR_SCANNED',
          is_read: false,
          created_at: now
        });

        toast.success('Food Collected Successfully! Thank you for reducing food waste. ✅', { duration: 5000 });
      } catch (error: any) {
        console.error('Error verifying QR Code:', error);
        toast.error('Error verifying QR Code.');
      } finally {
        setScanning(false);
      }
    }, () => {
      // Ignore seek frame errors
    });

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [isScannerOpen, scanning, donations, userData]);

  const pendingDonations = donations.filter(d => {
    const s = (d.status || '').toUpperCase();
    return s === 'PENDING' || s === 'AVAILABLE' || !d.status;
  });
  const assignedDonations = donations.filter(d => (d.status || '').toUpperCase() === 'ASSIGNED');
  const totalMeals = pendingDonations.reduce((acc, curr) => acc + (Number(curr.meals) || 1), 0);
  const uniqueLocations = new Set(donations.map(d => d.pickup_location).filter(Boolean)).size;

  const displayedDonations = donations.filter(d => {
    const s = (d.status || '').toUpperCase();
    const isPending = s === 'PENDING' || s === 'AVAILABLE' || !d.status;
    const isAssigned = s === 'ASSIGNED';
    if (filterTab === 'PENDING') return isPending;
    if (filterTab === 'MY_TASKS') return isAssigned;
    return true;
  });

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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Volunteer Dispatch & Rescue Hub</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 animate-pulse">
              Live Feed
            </span>
          </div>
          <p className="text-gray-600 mt-1 text-sm">
            Live surplus food donations listed by donors. Claim open batches, navigate to pickup, and scan QR on collection.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-xs">
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${viewMode === 'LIST' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('MAP')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${viewMode === 'MAP' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Map View"
            >
              <MapIcon className="w-4 h-4" />
              <span>Map</span>
            </button>
          </div>
          <button
            onClick={() => setIsScannerOpen(!isScannerOpen)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs font-medium text-sm cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            {isScannerOpen ? 'Close Scanner' : 'Scan QR Code'}
          </button>
        </div>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Open For Rescue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{pendingDonations.length}</span>
            <span className="text-xs text-amber-600 font-medium">Ready for pickup</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Active Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{assignedDonations.length}</span>
            <span className="text-xs text-indigo-600 font-medium">Claimed by you</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Meals Available</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{totalMeals}</span>
            <span className="text-xs text-emerald-600 font-medium">Servings</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pickup Sites</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{uniqueLocations}</span>
            <span className="text-xs text-blue-600 font-medium">Active locations</span>
          </div>
        </div>
      </div>

      {/* Live Alert Banner when pending donations exist */}
      {pendingDonations.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-bounce">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span>{pendingDonations.length} Surplus Food {pendingDonations.length === 1 ? 'Donation' : 'Donations'} Waiting For Volunteer Pickup!</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  DONOR LISTED
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Donors recently submitted surplus food. Click &quot;Accept Donation&quot; on any card below to claim the dispatch and initiate pickup.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterTab('PENDING')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors shadow-xs cursor-pointer"
          >
            View Available ({pendingDonations.length})
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setFilterTab('PENDING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
            filterTab === 'PENDING'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>Available Food For Pickup</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterTab === 'PENDING' ? 'bg-indigo-700 text-white' : 'bg-gray-100 text-gray-700'}`}>
            {pendingDonations.length}
          </span>
        </button>

        <button
          onClick={() => setFilterTab('MY_TASKS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
            filterTab === 'MY_TASKS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>My Claimed Pickups</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterTab === 'MY_TASKS' ? 'bg-indigo-700 text-white' : 'bg-gray-100 text-gray-700'}`}>
            {assignedDonations.length}
          </span>
        </button>

        <button
          onClick={() => setFilterTab('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
            filterTab === 'ALL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>All Rescues ({donations.length})</span>
        </button>
      </div>

      {isScannerOpen && (
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 max-w-lg mx-auto">
          <div id="qr-reader" className="w-full"></div>
          <p className="text-sm text-center text-gray-500 mt-4">Point your camera at the donor's QR code to verify pickup.</p>
        </div>
      )}

      {viewMode === 'MAP' ? (
        <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100">
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
                <div key={i} className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 h-56 animate-pulse"></div>
              ))}
            </>
          ) : displayedDonations.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-xs border border-gray-100 p-12 text-center text-gray-500">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-800">
                {filterTab === 'PENDING'
                  ? 'No surplus donations pending right now'
                  : filterTab === 'MY_TASKS'
                  ? 'You have not claimed any active pickups yet'
                  : 'No active food donations found'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {filterTab === 'PENDING'
                  ? 'When donors post new surplus food batches, they will appear here instantly in real-time!'
                  : 'Browse available food donations above to claim tasks and coordinate pickups.'}
              </p>
            </div>
          ) : (
            displayedDonations.map(donation => (
              <div key={donation.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between gap-4 hover:border-indigo-100 transition-shadow">
                <div>
                  {/* Header */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{donation.food_type}</h3>
                        {donation.category && (
                          <span className="text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {donation.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Donation #{donation.id.slice(0, 8)}</p>
                    </div>
                    {((donation.status || '').toUpperCase() === 'PENDING' || (donation.status || '').toUpperCase() === 'AVAILABLE' || !donation.status) ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold shrink-0 bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs animate-pulse">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Ready For Pickup</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-blue-600" />
                        <span>Assigned to You</span>
                      </span>
                    )}
                  </div>

                  {/* Donor Info Strip */}
                  <div className="mt-3 bg-gray-50 rounded-lg p-2.5 flex items-center justify-between text-xs text-gray-700">
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-semibold">{donation.donor_organization || donation.organization || 'Individual Donor'}</span>
                      {donation.donor_name && (
                        <span className="text-gray-500">({donation.donor_name})</span>
                      )}
                    </div>
                    {donation.donor_phone && (
                      <a
                        href={`tel:${donation.donor_phone}`}
                        className="flex items-center gap-1 text-indigo-600 font-medium hover:underline"
                        title="Call Donor"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{donation.donor_phone}</span>
                      </a>
                    )}
                  </div>
                  
                  {/* Food & Logistics details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-4 text-sm text-gray-600 pt-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-900">{donation.quantity}</span>
                      <span className="text-xs text-gray-500">({donation.meals} meals)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-xs">{new Date(donation.pickup_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-700">{donation.pickup_location}</span>
                    </div>
                    {donation.notes && (
                      <div className="flex items-start gap-2 sm:col-span-2 text-xs bg-amber-50/70 text-amber-900 p-2 rounded border border-amber-200/50">
                        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{donation.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedDonation(donation)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-gray-500" />
                    View Details
                  </button>

                  {((donation.status || '').toUpperCase() === 'PENDING' || (donation.status || '').toUpperCase() === 'AVAILABLE' || !donation.status) ? (
                    <button
                      onClick={() => handleAccept(donation.id, donation)}
                      className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <HeartHandshake className="w-4 h-4" />
                      <span>Accept Donation</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsScannerOpen(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white py-2 px-3 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Scan QR at Pickup</span>
                      </button>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(donation.pickup_location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                        title="Directions"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Map</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Volunteer Food Details Modal */}
      {selectedDonation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Donation Details</span>
                <h2 className="text-xl font-bold text-gray-900 mt-0.5">{selectedDonation.food_type}</h2>
              </div>
              <button
                onClick={() => setSelectedDonation(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                <span className="text-xs font-medium text-indigo-900">Current Status:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedDonation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  selectedDonation.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {selectedDonation.status}
                </span>
              </div>

              {/* Food Info Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Food Information</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl">
                  <div>
                    <span className="text-xs text-gray-500 block">Quantity</span>
                    <span className="font-semibold text-gray-900">{selectedDonation.quantity}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Estimated Meals</span>
                    <span className="font-semibold text-gray-900">{selectedDonation.meals} Meals</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Category</span>
                    <span className="font-medium text-gray-900">{selectedDonation.category || 'General Food'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Listed Time</span>
                    <span className="text-xs text-gray-700">{new Date(selectedDonation.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Donor Contact Card */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Donor Details</h3>
                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Organization / Name:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedDonation.donor_organization || selectedDonation.organization || selectedDonation.donor_name || 'Individual Donor'}
                    </span>
                  </div>
                  {selectedDonation.donor_name && selectedDonation.donor_organization && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Contact Person:</span>
                      <span className="text-gray-900 font-medium">{selectedDonation.donor_name}</span>
                    </div>
                  )}
                  {selectedDonation.donor_phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Phone:</span>
                      <a
                        href={`tel:${selectedDonation.donor_phone}`}
                        className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {selectedDonation.donor_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Pickup & Location Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pickup Logistics</h3>
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 block">Scheduled Pickup Window</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      {new Date(selectedDonation.pickup_time).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Address</span>
                    <span className="text-gray-800 text-xs flex items-start gap-1.5 mt-0.5">
                      <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      {selectedDonation.pickup_location}
                    </span>
                  </div>
                  {selectedDonation.notes && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200/60 text-xs text-amber-900">
                      <span className="font-semibold block mb-0.5">Pickup & Handling Instructions:</span>
                      {selectedDonation.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDonation.pickup_location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-4 rounded-lg font-medium transition-colors text-xs"
                >
                  <Navigation className="w-4 h-4" />
                  Open in Google Maps
                </a>

                {selectedDonation.status === 'PENDING' ? (
                  <button
                    onClick={() => handleAccept(selectedDonation.id, selectedDonation)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-colors text-xs shadow-sm"
                  >
                    Accept Donation
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedDonation(null);
                      setIsScannerOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg font-semibold transition-colors text-xs shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    Scan QR on Pickup
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;

