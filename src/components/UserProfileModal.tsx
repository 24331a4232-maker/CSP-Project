import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, Mail, Phone, MapPin, Building, ShieldCheck, 
  Camera, Save, CheckCircle2, AlertCircle, X, Truck, HeartHandshake, 
  Sparkles, AtSign, Loader2, Database, Shield, Lock, Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfileInDatabase } from '../lib/authService';
import toast from 'react-hot-toast';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userData } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [vehicleType, setVehicleType] = useState('Motorcycle');
  const [availability, setAvailability] = useState('Available');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Populate form with current user profile from Firestore / Auth
  useEffect(() => {
    if (userData) {
      setFullName(userData.name || (userData as any).full_name || '');
      setUsername(userData.username || (userData as any).user_name || (currentUser?.email ? currentUser.email.split('@')[0] : ''));
      setPhone((userData as any).phone || '');
      setOrganization((userData as any).organization || (userData as any).organization_name || '');
      setAddress((userData as any).address || '');
      setCity((userData as any).city || (userData as any).serviceCity || 'Vizianagaram');
      setState((userData as any).state || 'Andhra Pradesh');
      setPincode((userData as any).pincode || '535003');
      setBio((userData as any).bio || '');
      setAvatarUrl((userData as any).avatar_url || (userData as any).profilePicUrl || currentUser?.photoURL || '');
      setVehicleType((userData as any).vehicle_type || (userData as any).vehicleType || 'Motorcycle');
      setAvailability((userData as any).availability || (userData as any).availability_status || 'Available');
      setEmergencyContact((userData as any).emergency_contact || (userData as any).emergencyContact || '');
    } else if (currentUser) {
      setFullName(currentUser.displayName || currentUser.email?.split('@')[0] || 'User');
      setUsername(currentUser.email ? currentUser.email.split('@')[0] : 'user');
    }
  }, [userData, currentUser, isOpen]);

  if (!isOpen) return null;

  const role = (userData?.role || 'DONOR').toUpperCase();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser && !userData?.id) {
      toast.error('You must be logged in to update your profile.');
      return;
    }

    if (!fullName.trim()) {
      toast.error('Full Name cannot be empty.');
      return;
    }

    setIsSaving(true);
    const uid = currentUser?.uid || userData?.id || '';

    try {
      const payload: Record<string, any> = {
        name: fullName.trim(),
        full_name: fullName.trim(),
        username: username.trim() || fullName.toLowerCase().replace(/\s+/g, '_'),
        phone: phone.trim(),
        organization: organization.trim(),
        organization_name: organization.trim(),
        address: address.trim(),
        city: city.trim(),
        serviceCity: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
        profilePicUrl: avatarUrl,
        vehicle_type: vehicleType,
        vehicleType: vehicleType,
        availability: availability,
        availability_status: availability,
        emergency_contact: emergencyContact.trim(),
        role: role,
        email: currentUser?.email || userData?.email || ''
      };

      // Write directly into Firestore database single source of truth (users/{uid}) and corresponding partition collection
      await updateUserProfileInDatabase(uid, payload);

      toast.success('Your profile changes have been successfully saved to the database!', { duration: 4000 });
      onClose();
    } catch (err: any) {
      console.error('Error saving profile to database:', err);
      toast.error('Failed to update database: ' + (err?.message || 'Check connection'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden animate-fadeIn my-6">
        {/* Header Bar */}
        <div className="p-6 bg-gradient-to-r from-gray-900 via-slate-900 to-indigo-950 text-white flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-lg overflow-hidden ${
                role === 'ADMIN' ? 'bg-rose-600' :
                role === 'VOLUNTEER' ? 'bg-emerald-600' :
                'bg-indigo-600'
              }`}>
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={fullName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  (fullName || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <label 
                htmlFor="avatar-modal-upload" 
                className="absolute inset-0 bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-xs font-semibold"
                title="Change Avatar"
              >
                <Camera className="w-5 h-5" />
              </label>
              <input 
                type="file" 
                id="avatar-modal-upload" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{fullName || 'My Profile'}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  role === 'ADMIN' ? 'bg-rose-500/30 text-rose-300 border border-rose-400/40' :
                  role === 'VOLUNTEER' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40' :
                  'bg-indigo-500/30 text-indigo-300 border border-indigo-400/40'
                }`}>
                  {role}
                </span>
              </div>
              <p className="text-xs text-gray-300 flex items-center gap-1.5 mt-1 font-mono">
                <Mail className="w-3 h-3 text-gray-400" />
                <span>{currentUser?.email || userData?.email}</span>
                {username && <span className="text-indigo-300 ml-1">(@{username})</span>}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400 font-medium">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Connected to Firestore (users/{currentUser?.uid || userData?.id})</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Avatar Selector */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Choose Avatar:</span>
          <div className="flex items-center gap-2">
            {PRESET_AVATARS.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAvatarUrl(url)}
                className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-transform cursor-pointer ${
                  avatarUrl === url ? 'border-indigo-600 scale-110 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={url} alt="Preset avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveProfile} className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Section 1: Core Identity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
              <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Identity & Login Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe / Sarah Jenkins"
                  className="w-full px-3.5 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Username (@handle)</span>
                  <span className="text-[10px] text-indigo-600 font-normal">Used for Login</span>
                </label>
                <div className="relative">
                  <AtSign className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. john_doe"
                    className="w-full pl-8 pr-3.5 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full pl-8 pr-3.5 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Organization / Business Name
                </label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Grand Palace Caterers / Independent"
                    className="w-full pl-8 pr-3.5 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Address & Location */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Location & Address Details</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Street Address / Landmark
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 45 Fort Road, Near Clock Tower"
                className="w-full px-3.5 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">City / Hub</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Vizianagaram"
                  className="w-full px-3 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Andhra Pradesh"
                  className="w-full px-3 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 535003"
                  className="w-full px-3 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Role-Specific Operational Details */}
          {role === 'VOLUNTEER' && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Volunteer Logistics & Vehicle Information</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    <option value="Motorcycle">Motorcycle / 2-Wheeler (Fast Dispatch)</option>
                    <option value="Scooter with Thermal Bag">Scooter with Thermal Bag</option>
                    <option value="Car / Hatchback">Car / Hatchback</option>
                    <option value="Insulated Electric SUV">Insulated Electric SUV</option>
                    <option value="Delivery Van / Cargo">Delivery Van / Cargo</option>
                    <option value="Bicycle">Bicycle (Eco Short-Distance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Availability Status</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    <option value="Available">Available for Pickups</option>
                    <option value="Evenings (4:00 PM - 9:00 PM)">Evenings (4:00 PM - 9:00 PM)</option>
                    <option value="Weekends Only">Weekends Only</option>
                    <option value="On-Call Emergency Only">On-Call Emergency Only</option>
                    <option value="Currently Busy / Off-Duty">Currently Busy / Off-Duty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Contact</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. David Jenkins (+91 98765 00000)"
                  className="w-full px-3.5 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Section 4: Bio / Description */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-gray-700">
              About / Bio / Mission Notes
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about your food rescue efforts or restaurant food safety standards..."
              className="w-full px-3.5 py-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
            <div className="text-[11px] text-gray-500 font-mono">
              Direct update to: users/{currentUser?.uid || userData?.id}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-indigo-200 cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes to Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
