import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { Plus, Package, Clock, MapPin, X, Phone, Building, Info, UserCheck, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Donation } from '../../types';
import { useLocation } from '../../hooks/useLocation';
import { QRGenerator } from '../../components/QRGenerator';

const DonorDashboard = () => {
  const { currentUser, userData } = useAuth();
  const { position } = useLocation();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'donations'), where('donor_id', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));
      setDonations(data.sort((a, b) => b.created_at - a.created_at));
      setLoading(false);
    }, (err) => {
      console.warn('Donor donations query error:', err);
      setLoading(false);
    });
    return unsubscribe;
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
      const qrToken = `DONATION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

      if (position && position.lat && position.lng) {
        payload.pickup_latitude = position.lat;
        payload.pickup_longitude = position.lng;
      }
      
      // 1. Write primary document to 'donations'
      const docRef = await addDoc(collection(db, 'donations'), payload);

      // 2. Also mirror to 'food_donations' for backward compatibility
      try {
        await setDoc(doc(db, 'food_donations', docRef.id), { id: docRef.id, ...payload });
      } catch (mirrorErr) {
        console.warn('Mirror to food_donations skipped:', mirrorErr);
      }

      // 3. Post to API route as in-memory/backend sync
      try {
        await fetch('/api/donations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: foodType.trim(),
            foodType: category,
            quantity: quantity.trim(),
            servings: parsedMeals,
            donorName,
            donorPhone: donorContact,
            donorEmail: currentUser.email || '',
            pickupAddress: location.trim(),
            pickupTime: time || 'Today within 4 hours',
            urgency: 'high'
          })
        });
      } catch (apiErr) {
        console.warn('Backend API donation sync skipped:', apiErr);
      }

      // 4. Create notification for admin & volunteers
      try {
        await addDoc(collection(db, 'notifications'), {
          donation_id: docRef.id,
          message: `New Food Donation Listed: ${foodType.trim()} (${quantity.trim()}, ${parsedMeals} meals) by ${donorName}${orgName ? ` from ${orgName}` : ''} at ${location.trim()}`,
          type: 'DONATION_CREATED',
          targetRole: 'all',
          userId: currentUser.uid,
          is_read: false,
          created_at: Date.now()
        });
      } catch (notifErr) {
        console.warn('Notification creation error:', notifErr);
      }

      // 5. Increment donor's total_donations count
      try {
        const donorDocRef = doc(db, 'donors', currentUser.uid);
        const donorSnap = await getDoc(donorDocRef);
        if (donorSnap.exists()) {
          const currentCount = donorSnap.data()?.total_donations || 0;
          await updateDoc(donorDocRef, { total_donations: currentCount + 1 });
        }
      } catch (statErr) {
        console.warn('Stat counter update skipped:', statErr);
      }

      toast.success('Food donation created successfully! It is now live for Volunteers to accept and Admins to monitor.', { duration: 5000 });
      setIsModalOpen(false);
      setFoodType('');
      setCategory('Cooked Catering');
      setQuantity('');
      setMeals('');
      setNotes('');
      setTime('');
    } catch (error: any) {
      console.error('Error creating donation:', error);
      toast.error('Failed to create donation: ' + (error?.message || 'Check connection or Firestore permissions'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      ASSIGNED: 'bg-blue-100 text-blue-800 border border-blue-200',
      PICKED_UP: 'bg-green-100 text-green-800 border border-green-200',
      COMPLETED: 'bg-gray-100 text-gray-800 border border-gray-200'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Donations</h1>
          <p className="text-gray-600 mt-1">Manage your food donations and track pickups</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Plus className="w-5 h-5" />
          New Donation
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-64"></div>
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No donations yet</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-6">Create your first food donation to help those in need in your community.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-indigo-600 font-medium hover:text-indigo-700"
          >
            Create a donation &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {donations.map(donation => (
            <div key={donation.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{donation.food_type}</h3>
                      {donation.category && (
                        <span className="text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {donation.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">ID: {donation.id.slice(0, 8)}</p>
                  </div>
                  <StatusBadge status={donation.status} />
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{donation.quantity} ({donation.meals} meals)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{donation.pickup_location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{new Date(donation.pickup_time).toLocaleString()}</span>
                  </div>
                  {donation.notes && (
                    <div className="flex items-start gap-2 text-xs bg-amber-50 text-amber-900 p-2 rounded border border-amber-200/60">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{donation.notes}</span>
                    </div>
                  )}
                  {donation.volunteer_id && (
                    <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium bg-indigo-50 px-2.5 py-1.5 rounded">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assigned Volunteer: {donation.volunteer_name || 'Volunteer in transit'}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {(donation.status === 'PENDING' || donation.status === 'ASSIGNED') && (
                <div className="flex flex-col items-center justify-center">
                  <QRGenerator value={donation.qr_token} size={110} label="Scan at pickup" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Donation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8 overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">New Food Donation</h2>
                <p className="text-xs text-gray-500">Provide food details so volunteers and admins can coordinate pickup</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Item Name / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Prepared Rice & Curry, 30 Fresh Sandwiches, Assorted Pastries"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  value={foodType}
                  onChange={e => setFoodType(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Food Category</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="Cooked Catering">Cooked Catering / Prepared Meals</option>
                    <option value="Baked Goods">Baked Goods / Bread</option>
                    <option value="Packaged Goods">Packaged / Canned Goods</option>
                    <option value="Produce & Groceries">Fresh Produce & Fruits</option>
                    <option value="Dairy & Refrigerated">Dairy & Refrigerated</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Other">Other Surplus Food</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Meals / Servings *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g., 25"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    value={meals}
                    onChange={e => setMeals(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity & Units *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 10 kg, 4 large trays, 3 boxes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization / Establishment</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g., Grand Hotel, Bakery, Home"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      value={organization}
                      onChange={e => setOrganization(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone (for volunteer) *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g., +1 555-0199"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address / Location *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Full street address, building, floor or landmark"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>
                {!position && (
                  <p className="text-xs text-amber-600 mt-1">Turn on Location sharing to automatically pin this donation on the live map.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date & Time Window *</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Handling / Pickup Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g., Packed in sealed containers. Enter through rear loading dock. Must be kept warm."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md hover:bg-indigo-700 font-semibold transition-colors shadow-sm text-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Posting Food Donation...</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      <span>Submit & Donate Surplus Food</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorDashboard;

