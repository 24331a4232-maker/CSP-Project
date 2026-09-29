import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  Plus, Package, Clock, MapPin, X, Phone, Building, Info, 
  UserCheck, Loader2, Sparkles, CheckCircle, User as UserIcon, 
  QrCode, Download, Eye, CheckCircle2, Truck, Bell, Volume2, 
  VolumeX, AlertCircle, ArrowRight, ExternalLink, ShieldCheck, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Donation } from '../../types';
import { useLocation } from '../../hooks/useLocation';
import { QRGenerator } from '../../components/QRGenerator';
import { DonationQRModal } from '../../components/DonationQRModal';
import { UserProfileModal } from '../../components/UserProfileModal';
import { soundManager } from '../../lib/sound';

const DonorDashboard = () => {
  const { currentUser, userData } = useAuth();
  const { position } = useLocation();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedQrDonation, setSelectedQrDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ASSIGNED' | 'PICKED_UP'>('ALL');
  const [soundActive, setSoundActive] = useState(soundManager.isEnabled());

  // Refs for tracking status transitions in real time
  const isInitialLoadRef = useRef(true);
  const prevDonationsMapRef = useRef<Map<string, Donation>>(new Map());

  // Form states
  const [foodType, setFoodType] = useState('');
  const [category, setCategory] = useState('Cooked Catering');
  const [quantity, setQuantity] = useState('');
  const [meals, setMeals] = useState('');
  const [location, setLocation] = useState(userData?.address || '');
  const [time, setTime] = useState('');
  const [contactPhone, setContactPhone] = useState(userData?.phone || '');
  const [organization, setOrganization] = useState(userData?.organization || '');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (userData?.address && !location) setLocation(userData.address);
    if (userData?.phone && !contactPhone) setContactPhone(userData.phone);
    if (userData?.organization && !organization) setOrganization(userData.organization);
  }, [userData]);

  // Real-time Firestore listener for this donor's donations
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'donations'), where('donor_id', '==', currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Donation));
      const sorted = data.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

      // Check for real-time status transitions if not initial load
      if (!isInitialLoadRef.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const updated = { id: change.doc.id, ...change.doc.data() } as Donation;
            const prev = prevDonationsMapRef.current.get(change.doc.id);

            const oldStatus = (prev?.status || '').toUpperCase();
            const newStatus = (updated.status || '').toUpperCase();

            // TRIGGER 1: Volunteer accepts donation request (PENDING -> ASSIGNED)
            if (oldStatus !== 'ASSIGNED' && newStatus === 'ASSIGNED') {
              soundManager.playVolunteerAcceptedChime();
              
              const volName = updated.volunteer_name || 'A volunteer';
              const foodTitle = updated.food_type || 'Food Item';

              toast.custom((t) => (
                <div
                  className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black/5 p-4 border-l-4 border-indigo-600`}
                >
                  <div className="flex-1 w-0">
                    <div className="flex items-start">
                      <div className="shrink-0 pt-0.5">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          <Truck className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                            Volunteer Accepted Request! 🚗
                          </p>
                          <span className="text-[10px] text-gray-400 font-mono">Just now</span>
                        </div>
                        <p className="text-sm font-extrabold text-gray-900 mt-0.5">
                          {volName} is en route for pickup
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          Accepted to collect <span className="font-semibold text-gray-800">"{foodTitle}"</span> ({updated.quantity}).
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedQrDonation(updated);
                              toast.dismiss(t.id);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Show Pickup QR</span>
                          </button>
                          {updated.volunteer_phone && (
                            <a
                              href={`tel:${updated.volunteer_phone}`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-gray-600" />
                              <span>Call Volunteer</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex border-l border-gray-100 pl-2">
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="w-full border border-transparent rounded-none rounded-r-lg p-2 flex items-center justify-center text-xs font-medium text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ), { duration: 9000, position: 'top-right' });
            }

            // TRIGGER 2: Food marked as successfully picked up (ASSIGNED -> PICKED_UP)
            if (oldStatus !== 'PICKED_UP' && newStatus === 'PICKED_UP') {
              soundManager.playFoodPickedUpChime();

              const volName = updated.volunteer_name || 'Volunteer';
              const foodTitle = updated.food_type || 'Food item';

              toast.custom((t) => (
                <div
                  className={`${
                    t.visible ? 'animate-enter' : 'animate-leave'
                  } max-w-md w-full bg-emerald-900 text-white shadow-2xl rounded-2xl pointer-events-auto flex p-4 border border-emerald-500/40`}
                >
                  <div className="flex-1 w-0">
                    <div className="flex items-start">
                      <div className="shrink-0 pt-0.5">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                            Food Picked Up & Verified! 🎉
                          </p>
                          <span className="text-[10px] text-emerald-200/80 font-mono">Just now</span>
                        </div>
                        <p className="text-sm font-bold text-white mt-0.5">
                          "{foodTitle}" successfully collected
                        </p>
                        <p className="mt-1 text-xs text-emerald-100 leading-relaxed">
                          Volunteer <span className="font-semibold text-white">{volName}</span> verified your QR code and collected the surplus food.
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-950 bg-emerald-300 px-2.5 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3" />
                            {updated.meals || 1} meals saved
                          </span>
                          <button
                            onClick={() => {
                              setSelectedQrDonation(updated);
                              toast.dismiss(t.id);
                            }}
                            className="text-xs text-emerald-200 hover:text-white underline font-medium cursor-pointer"
                          >
                            View Receipt
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex pl-2">
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      className="text-emerald-300 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ), { duration: 10000, position: 'top-right' });
            }
          }
        });
      }

      // Store updated map for future diffing
      const map = new Map<string, Donation>();
      sorted.forEach(d => map.set(d.id, d));
      prevDonationsMapRef.current = map;
      isInitialLoadRef.current = false;

      setDonations(sorted);
      setLoading(false);
    }, (err) => {
      console.warn('Donor donations query error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('You must be logged in to donate food.');
      return;
    }

    if (!foodType.trim() || !quantity.trim() || !location.trim()) {
      toast.error('Please fill in all required fields (food name, quantity, pickup location).');
      return;
    }

    setIsSubmitting(true);
    try {
      const qrToken = `FBDN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const donorName = userData?.name || currentUser.displayName || 'Donor';
      const donorContact = contactPhone || userData?.phone || '';
      const orgName = organization || userData?.organization || '';
      const parsedMeals = parseInt(meals, 10) || 1;

      const payload: any = {
        donor_id: currentUser.uid,
        donor_name: donorName,
        donor_phone: donorContact,
        donor_email: currentUser.email || '',
        donor_organization: orgName,
        organization: orgName,
        food_type: foodType.trim(),
        category,
        quantity: quantity.trim(),
        meals: parsedMeals,
        notes: notes ? notes.trim() : '',
        pickup_location: location.trim(),
        pickup_time: time || new Date(Date.now() + 4 * 3600000).toISOString(),
        status: 'PENDING',
        qr_token: qrToken,
        created_at: Date.now()
      };

      if (position) {
        payload.pickup_latitude = position.latitude;
        payload.pickup_longitude = position.longitude;
      }

      // 1. Write primary document to 'donations'
      const docRef = await addDoc(collection(db, 'donations'), payload);
      const newDonationRecord: Donation = { id: docRef.id, ...payload };

      // 2. Also mirror to 'food_donations' for backward compatibility
      try {
        await setDoc(doc(db, 'food_donations', docRef.id), payload);
      } catch (mirrorErr) {
        console.warn('Mirror write to food_donations skipped:', mirrorErr);
      }

      // 3. Mirror into 'donors' role collection to guarantee donor table record
      try {
        await setDoc(doc(db, 'donors', currentUser.uid), {
          id: currentUser.uid,
          full_name: donorName,
          email: currentUser.email || '',
          phone: donorContact,
          organization: orgName,
          address: location.trim(),
          city: userData?.city || '',
          state: userData?.state || '',
          pincode: userData?.pincode || '',
          role: 'donor',
          is_active: true,
          updated_at: new Date().toISOString()
        }, { merge: true });
      } catch (donorRoleErr) {
        console.warn('Donor role table update skipped:', donorRoleErr);
      }

      // 4. Create Notification for Volunteers & Admins
      try {
        await addDoc(collection(db, 'notifications'), {
          donation_id: docRef.id,
          donor_id: currentUser.uid,
          donor_name: donorName,
          food_type: foodType.trim(),
          quantity: quantity.trim(),
          title: 'New Food Donation Available!',
          message: `New food donation available: "${foodType.trim()}" (${quantity.trim()}, ${parsedMeals} meals) from ${orgName || donorName}.`,
          type: 'DONATION_CREATED',
          targetRole: 'all',
          is_read: false,
          created_at: Date.now()
        });
      } catch (notifErr) {
        console.warn('Notification creation skipped:', notifErr);
      }

      toast.success('Food donation created! Your unique Pickup QR Code is ready.', { duration: 5000 });
      setIsModalOpen(false);
      setFoodType('');
      setCategory('Cooked Catering');
      setQuantity('');
      setMeals('');
      setNotes('');
      setTime('');

      // Open the unique QR Code modal automatically so the donor can view/download it immediately
      setSelectedQrDonation(newDonationRecord);
    } catch (error: any) {
      console.error('Error creating donation:', error);
      toast.error('Failed to create donation: ' + (error?.message || 'Check connection or Firestore permissions'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSoundAlerts = () => {
    const next = !soundActive;
    setSoundActive(next);
    soundManager.setEnabled(next);
    toast.success(next ? 'Live sound alerts enabled' : 'Live sound alerts muted', { duration: 2000 });
  };

  // Identify in-transit and completed donations for live highlight banners
  const inTransitDonations = donations.filter(d => (d.status || '').toUpperCase() === 'ASSIGNED');
  const pickedUpDonations = donations.filter(d => (d.status || '').toUpperCase() === 'PICKED_UP' || (d.status || '').toUpperCase() === 'COMPLETED');
  const pendingDonations = donations.filter(d => {
    const s = (d.status || '').toUpperCase();
    return s === 'PENDING' || s === 'AVAILABLE' || !d.status;
  });

  const filteredDonations = donations.filter(d => {
    const s = (d.status || '').toUpperCase();
    if (statusFilter === 'PENDING') return s === 'PENDING' || s === 'AVAILABLE' || !d.status;
    if (statusFilter === 'ASSIGNED') return s === 'ASSIGNED';
    if (statusFilter === 'PICKED_UP') return s === 'PICKED_UP' || s === 'COMPLETED';
    return true;
  });

  const totalMealsSaved = pickedUpDonations.reduce((sum, d) => sum + (Number(d.meals) || 1), 0);

  const StatusBadge = ({ status }: { status: string }) => {
    const s = (status || 'PENDING').toUpperCase();
    if (s === 'ASSIGNED') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 animate-pulse">
          <Truck className="w-3.5 h-3.5" />
          <span>Volunteer En Route</span>
        </span>
      );
    }
    if (s === 'PICKED_UP' || s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verified & Picked Up</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5" />
        <span>Awaiting Volunteer</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Real-Time Alert Center Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Donor Food Control</h1>
          <p className="text-gray-600 text-sm mt-0.5">
            Post surplus food, receive instant alerts when volunteers accept requests, and verify pickups with QR passes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleSoundAlerts}
            className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
              soundActive
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
            }`}
            title={soundActive ? 'Alert chimes on' : 'Alert chimes muted'}
          >
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundActive ? 'Sound On' : 'Muted'}</span>
          </button>

          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-3.5 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-xs font-semibold text-xs cursor-pointer"
            title="Update your contact & organization info"
          >
            <UserIcon className="w-4 h-4 text-indigo-600" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-bold text-xs sm:text-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Donation</span>
          </button>
        </div>
      </div>

      {/* LIVE IN-TRANSIT RESCUE ALERT BANNER */}
      {inTransitDonations.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white p-5 rounded-2xl shadow-xl border border-indigo-500/40 relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/40 border border-indigo-300/40 flex items-center justify-center shrink-0 shadow-inner">
                <Truck className="w-6 h-6 text-indigo-200 animate-bounce-subtle" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-400/30 text-indigo-200 text-[10px] font-extrabold uppercase tracking-wider">
                    Live Pickup In Progress
                  </span>
                  <span className="text-xs text-indigo-300 font-mono">
                    {inTransitDonations.length} Active Request{inTransitDonations.length > 1 ? 's' : ''}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Volunteer <span className="text-emerald-300">{inTransitDonations[0].volunteer_name || 'Assigned Captain'}</span> is heading to your location!
                </h3>
                <p className="text-xs text-indigo-100/90 leading-relaxed max-w-2xl">
                  Food item: <span className="font-semibold text-white">"{inTransitDonations[0].food_type}"</span> ({inTransitDonations[0].quantity}). Please keep your QR pass ready for the volunteer to scan upon arrival.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedQrDonation(inTransitDonations[0])}
                className="bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-gray-950" />
                <span>Open Pickup QR Pass</span>
              </button>

              {inTransitDonations[0].volunteer_phone && (
                <a
                  href={`tel:${inTransitDonations[0].volunteer_phone}`}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Volunteer</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Listings</p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">{donations.length}</p>
          <span className="text-[11px] text-gray-500">All posted foods</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Awaiting Volunteer</p>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-1">{pendingDonations.length}</p>
          <span className="text-[11px] text-gray-500">Live in rescue queue</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">En Route / Transit</p>
          <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 mt-1">{inTransitDonations.length}</p>
          <span className="text-[11px] text-gray-500">Accepted by volunteers</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Meals Rescued</p>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">{totalMealsSaved}</p>
          <span className="text-[11px] text-gray-500">{pickedUpDonations.length} picked up orders</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          All Donations ({donations.length})
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            statusFilter === 'PENDING'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Awaiting Volunteers ({pendingDonations.length})
        </button>
        <button
          onClick={() => setStatusFilter('ASSIGNED')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            statusFilter === 'ASSIGNED'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          En Route ({inTransitDonations.length})
        </button>
        <button
          onClick={() => setStatusFilter('PICKED_UP')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            statusFilter === 'PICKED_UP'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Verified & Picked Up ({pickedUpDonations.length})
        </button>
      </div>

      {/* Donations List Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 h-64"></div>
          ))}
        </div>
      ) : filteredDonations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mx-auto mb-3">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {statusFilter === 'ALL' ? 'No donations posted yet' : `No donations in "${statusFilter}" state`}
          </h3>
          <p className="text-gray-500 text-xs max-w-sm mx-auto mb-5">
            {statusFilter === 'ALL' 
              ? 'Create your first food donation to notify nearby volunteers and feed communities.'
              : 'Switch filters or create a new food donation to track active pickups.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Food Donation</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDonations.map(donation => {
            const statusUpper = (donation.status || 'PENDING').toUpperCase();
            const isAssigned = statusUpper === 'ASSIGNED';
            const isPickedUp = statusUpper === 'PICKED_UP' || statusUpper === 'COMPLETED';

            return (
              <div 
                key={donation.id} 
                className={`bg-white rounded-2xl shadow-xs border p-6 flex flex-col justify-between transition-all ${
                  isAssigned 
                    ? 'border-indigo-300 ring-2 ring-indigo-500/10' 
                    : isPickedUp
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-extrabold text-gray-900">{donation.food_type}</h3>
                        {donation.category && (
                          <span className="text-[11px] font-bold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-md">
                            {donation.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                        Token: {donation.qr_token || donation.id.slice(0, 10)} • Listed {new Date(donation.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <StatusBadge status={donation.status} />
                  </div>

                  {/* Real-time Rescue Progression Step Bar */}
                  <div className="mt-4 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Live Rescue Progression
                    </p>
                    <div className="flex items-center justify-between relative text-xs">
                      {/* Step 1: Listed */}
                      <div className="flex flex-col items-center z-10">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                          ✓
                        </div>
                        <span className="text-[10px] font-bold text-gray-700 mt-1">1. Listed</span>
                      </div>

                      {/* Connecting Line 1 */}
                      <div className={`flex-1 h-1 mx-2 rounded-full ${isAssigned || isPickedUp ? 'bg-indigo-600' : 'bg-gray-200'}`} />

                      {/* Step 2: Volunteer Assigned */}
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          isPickedUp 
                            ? 'bg-emerald-600 text-white' 
                            : isAssigned 
                            ? 'bg-indigo-600 text-white animate-pulse' 
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {isPickedUp ? '✓' : '2'}
                        </div>
                        <span className={`text-[10px] font-bold mt-1 ${isAssigned ? 'text-indigo-600' : 'text-gray-500'}`}>
                          2. Accepted
                        </span>
                      </div>

                      {/* Connecting Line 2 */}
                      <div className={`flex-1 h-1 mx-2 rounded-full ${isPickedUp ? 'bg-emerald-600' : 'bg-gray-200'}`} />

                      {/* Step 3: Picked Up */}
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          isPickedUp 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {isPickedUp ? '✓' : '3'}
                        </div>
                        <span className={`text-[10px] font-bold mt-1 ${isPickedUp ? 'text-emerald-700' : 'text-gray-500'}`}>
                          3. Picked Up
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Information */}
                  <div className="mt-4 space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2 font-medium">
                      <Package className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-gray-900 font-semibold">{donation.quantity}</span>
                      <span className="text-gray-500">({donation.meals} estimated meals)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{donation.pickup_location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>Pickup Target: {new Date(donation.pickup_time).toLocaleString()}</span>
                    </div>

                    {donation.notes && (
                      <div className="flex items-start gap-2 text-xs bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-200/60">
                        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{donation.notes}</span>
                      </div>
                    )}

                    {/* Assigned Volunteer Box */}
                    {donation.volunteer_id && (
                      <div className="mt-3 p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                              Assigned Volunteer Captain
                            </p>
                            <p className="text-xs font-extrabold text-gray-900">
                              {donation.volunteer_name || 'Volunteer in transit'}
                            </p>
                          </div>
                        </div>

                        {donation.volunteer_phone && (
                          <a
                            href={`tel:${donation.volunteer_phone}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors shadow-2xs"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Scanned Verification Box */}
                    {donation.scanned_at && (
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center gap-2 text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-xs">
                          Verified & collected at {new Date(donation.scanned_at).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedQrDonation(donation)}
                    className="flex-1 bg-gray-900 hover:bg-black text-white text-xs font-bold py-2 px-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isPickedUp ? 'View Collection Receipt' : 'Open Pickup QR Pass'}</span>
                  </button>

                  <div className="text-[11px] text-gray-400 font-mono">
                    ID: {donation.id.slice(0, 6)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Donation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">New Food Donation</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Volunteers and admins receive instant alerts once submitted
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Food Item Name / Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 35 Hot Meal Trays, Fresh Pasta & Salad, 20 Pastry Boxes"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                  value={foodType}
                  onChange={e => setFoodType(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Food Category
                  </label>
                  <select
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white font-medium"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="Cooked Catering">Cooked Catering / Buffet</option>
                    <option value="Bakery & Pastries">Bakery & Pastries</option>
                    <option value="Produce & Groceries">Produce & Groceries</option>
                    <option value="Packaged/Non-Perishable">Packaged / Non-Perishable</option>
                    <option value="Dairy & Refrigerated">Dairy & Refrigerated</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Other">Other Food Surplus</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Quantity / Weight *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 15 kg, 40 containers"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Estimated Meals Feedable *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g., 30"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                    value={meals}
                    onChange={e => setMeals(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Contact Phone (for volunteer) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g., +1 555-0199"
                      className="w-full pl-9 pr-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Organization / Business Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g., Downtown Bistro, Grand Hotel, Green Supermarket"
                    className="w-full pl-9 pr-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                    value={organization}
                    onChange={e => setOrganization(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Pickup Address / Location *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Full street address, building, floor or loading dock"
                    className="w-full pl-9 pr-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>
                {!position && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Location sharing helps volunteers route directly to your pickup spot.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Pickup Target Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Special Handling / Pickup Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Sealed insulated bags. Enter via kitchen back door. Call upon arrival."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-md text-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Posting Food Donation & Creating QR Pass...</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      <span>Submit Donation & Generate QR Pass</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Profile Database Edit Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Unique Donation Pickup QR Code Modal */}
      <DonationQRModal
        isOpen={!!selectedQrDonation}
        onClose={() => setSelectedQrDonation(null)}
        donation={selectedQrDonation}
      />
    </div>
  );
};

export default DonorDashboard;
