import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Package, Clock, MapPin, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Donation } from '../../types';
import { useLocation } from '../../hooks/useLocation';

const DonorDashboard = () => {
  const { currentUser } = useAuth();
  const { position } = useLocation();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [foodType, setFoodType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [meals, setMeals] = useState('');
  const [location, setLocation] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'donations'), where('donor_id', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));
      setDonations(data.sort((a, b) => b.created_at - a.created_at));
      setLoading(false);
    });
    return unsubscribe;
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const qrToken = `DONATION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const payload: any = {
        donor_id: currentUser.uid,
        food_type: foodType,
        quantity,
        meals: parseInt(meals),
        pickup_location: location,
        pickup_time: time,
        status: 'PENDING',
        qr_token: qrToken,
        created_at: Date.now()
      };

      if (position) {
        payload.pickup_latitude = position.lat;
        payload.pickup_longitude = position.lng;
      }
      
      await addDoc(collection(db, 'donations'), payload);

      toast.success('Donation created successfully!');
      setIsModalOpen(false);
      setFoodType('');
      setQuantity('');
      setMeals('');
      setLocation('');
      setTime('');
    } catch (error: any) {
      toast.error('Failed to create donation');
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      PICKED_UP: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
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
                    <h3 className="text-lg font-bold text-gray-900">{donation.food_type}</h3>
                    <p className="text-sm text-gray-500">ID: {donation.id.slice(0, 8)}</p>
                  </div>
                  <StatusBadge status={donation.status} />
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span>{donation.quantity} ({donation.meals} meals)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{donation.pickup_location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{new Date(donation.pickup_time).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {(donation.status === 'PENDING' || donation.status === 'ASSIGNED') && (
                <div className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <QRCodeSVG value={donation.qr_token} size={100} />
                  <p className="text-xs text-gray-500 mt-2 text-center">Scan at pickup</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Donation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">New Donation</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Type/Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Rice and Curry, 20 Sandwiches"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  value={foodType}
                  onChange={e => setFoodType(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 5 kgs"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">People/Meals</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g., 10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    value={meals}
                    onChange={e => setMeals(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                <input
                  type="text"
                  required
                  placeholder="Full address or landmark"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
                {!position && (
                  <p className="text-xs text-yellow-600 mt-1">Turn on Location sharing to pin this donation on the live map.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 font-medium transition-colors"
                >
                  Submit Donation
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
