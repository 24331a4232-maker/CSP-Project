import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Bike, ShieldCheck, Camera, Save, CheckCircle2, Award, Heart, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfileInDatabase } from '../lib/authService';

export interface VolunteerProfileData {
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  vehicleType: string;
  serviceCity: string;
  availability: string;
  emergencyContact: string;
  profilePicUrl: string;
  badgeLevel: string;
  totalRescues: number;
  totalHours: number;
  rating: number;
}

const DEFAULT_PROFILE: VolunteerProfileData = {
  fullName: 'Sarah Jenkins',
  email: 'sarah.jenkins@lastplate.org',
  phone: '+1 (555) 382-9102',
  bio: 'Dedicated food rescue captain working to eliminate urban hunger and curb food waste. Equipped with insulated thermal boxes for hot catering transfers.',
  vehicleType: 'Insulated Electric SUV',
  serviceCity: 'Metropolis (Central & Bay Area)',
  availability: 'Evenings (4:00 PM - 9:00 PM), Weekend Mornings',
  emergencyContact: 'David Jenkins (+1 555-901-2234)',
  profilePicUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  badgeLevel: 'Senior Rescue Captain',
  totalRescues: 48,
  totalHours: 120,
  rating: 4.9,
};

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
];

interface VolunteerProfileProps {
  onBackToDashboard?: () => void;
}

export const VolunteerProfile: React.FC<VolunteerProfileProps> = ({ onBackToDashboard }) => {
  const { currentUser, userData } = useAuth();
  const [profile, setProfile] = useState<VolunteerProfileData>(() => {
    try {
      const saved = localStorage.getItem('last_plate_volunteer_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  // Sync with Firestore user data when loaded
  useEffect(() => {
    if (userData) {
      setProfile((prev) => ({
        ...prev,
        fullName: userData.name || (userData as any).full_name || prev.fullName,
        email: userData.email || prev.email,
        phone: (userData as any).phone || prev.phone,
        bio: (userData as any).bio || prev.bio,
        vehicleType: (userData as any).vehicle_type || (userData as any).vehicleType || prev.vehicleType,
        serviceCity: (userData as any).city || (userData as any).serviceCity || prev.serviceCity,
        availability: (userData as any).availability || (userData as any).availability_status || prev.availability,
        emergencyContact: (userData as any).emergency_contact || (userData as any).emergencyContact || prev.emergencyContact,
        profilePicUrl: (userData as any).avatar_url || (userData as any).profilePicUrl || prev.profilePicUrl
      }));
    }
  }, [userData]);

  const [isSavedToast, setIsSavedToast] = useState(false);
  const [customPhotoInput, setCustomPhotoInput] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, profilePicUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('last_plate_volunteer_profile', JSON.stringify(profile));

      // UPDATE the existing users/{uid} and volunteers/{uid} documents in Firestore
      const uid = currentUser?.uid || userData?.id;
      if (uid) {
        await updateUserProfileInDatabase(uid, {
          name: profile.fullName.trim(),
          full_name: profile.fullName.trim(),
          phone: profile.phone.trim(),
          bio: profile.bio.trim(),
          vehicle_type: profile.vehicleType.trim(),
          city: profile.serviceCity.trim(),
          service_city: profile.serviceCity.trim(),
          availability: profile.availability.trim(),
          emergency_contact: profile.emergencyContact.trim(),
          avatar_url: profile.profilePicUrl,
          role: 'VOLUNTEER'
        });
      }

      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 3000);
    } catch (err) {
      console.error('Error updating volunteer profile in Firestore users:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Toast Confirmation */}
      {isSavedToast && (
        <div className="fixed top-20 right-5 z-50 bg-[#22C55E] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-extrabold animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>Volunteer Profile successfully updated!</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
            Verified Hero Account
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Volunteer <span className="text-[#22C55E]">Profile Settings</span>
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm font-medium">
            Update your public rescue captain bio, vehicle logistics, and emergency details.
          </p>
        </div>

        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition-all cursor-pointer"
          >
            ← Back to Rescue Hub
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Avatar & Impact Stats (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Avatar Card */}
          <div className="glass-card p-6 rounded-3xl text-center space-y-4 border border-white/80 shadow-xl">
            <div className="relative inline-block mx-auto group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100 mx-auto">
                <img
                  src={profile.profilePicUrl}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-1 right-1 bg-[#22C55E] hover:bg-emerald-600 text-white p-2.5 rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110"
                title="Upload custom photo"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-gray-900">{profile.fullName}</h3>
              <p className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1 mt-0.5">
                <Award className="w-3.5 h-3.5" />
                {profile.badgeLevel}
              </p>
            </div>

            {/* Quick Avatar Presets */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                Choose Avatar Preset
              </span>
              <div className="flex justify-center gap-2">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setProfile((prev) => ({ ...prev, profilePicUrl: url }))}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                      profile.profilePicUrl === url ? 'border-[#22C55E] scale-110 shadow-sm' : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Image URL input option */}
            <div className="pt-2">
              <input
                type="text"
                placeholder="Paste Image URL..."
                value={customPhotoInput}
                onChange={(e) => setCustomPhotoInput(e.target.value)}
                onBlur={() => {
                  if (customPhotoInput.trim()) {
                    setProfile((prev) => ({ ...prev, profilePicUrl: customPhotoInput.trim() }));
                  }
                }}
                className="w-full px-3 py-1.5 bg-white/80 border border-gray-200 rounded-xl text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-[#22C55E]"
              />
            </div>
          </div>

          {/* Impact Achievements Box */}
          <div className="glass-card p-6 rounded-3xl space-y-4 border border-white/80">
            <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#F97316]" />
              Volunteer Milestones
            </h4>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/60">
                <div className="text-2xl font-extrabold text-[#22C55E]">{profile.totalRescues}</div>
                <div className="text-[10px] text-emerald-900 font-bold uppercase tracking-wide">Food Rescues</div>
              </div>
              <div className="bg-orange-50/80 p-3 rounded-2xl border border-orange-200/60">
                <div className="text-2xl font-extrabold text-[#F97316]">{profile.totalHours} hrs</div>
                <div className="text-[10px] text-orange-900 font-bold uppercase tracking-wide">Active Service</div>
              </div>
            </div>

            <div className="p-3 bg-white/80 rounded-2xl border border-gray-200 text-xs flex items-center justify-between">
              <span className="font-bold text-gray-600">Community Star Rating</span>
              <span className="font-extrabold text-amber-500 text-sm">★ {profile.rating} / 5.0</span>
            </div>
          </div>

        </div>

        {/* Right Column: Editable Profile Form (8 cols) */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="glass-card p-6 sm:p-8 rounded-3xl space-y-6 border border-white/80 shadow-2xl">
            
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#22C55E]" />
                Personal Information
              </h3>
            </div>

            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/80 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/80 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            {/* Phone & Service City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                  Contact Phone Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/80 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                  Primary Service Area / City
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profile.serviceCity}
                    onChange={(e) => setProfile({ ...profile, serviceCity: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/80 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                  />
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                Volunteer Captain Bio
              </label>
              <textarea
                rows={3}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Share a short bio that hotels and recipient shelters see when you claim a pickup route..."
                className="w-full p-4 bg-white/80 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              />
            </div>

            <div className="border-b border-gray-100 pb-4 pt-2">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Bike className="w-4 h-4 text-[#F97316]" />
                Logistics & Availability
              </h3>
            </div>

            {/* Transport Vehicle & Availability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                  Vehicle / Transport Method
                </label>
                <select
                  value={profile.vehicleType}
                  onChange={(e) => setProfile({ ...profile, vehicleType: e.target.value })}
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                >
                  <option value="Cargo Bike / Bicycle">Cargo Bike / Bicycle</option>
                  <option value="Electric SUV / Car">Electric SUV / Car</option>
                  <option value="Insulated Cargo Van">Insulated Cargo Van</option>
                  <option value="Motorcycle / Scooter with Thermal Box">Motorcycle / Scooter with Thermal Box</option>
                  <option value="On Foot / Transit">On Foot / Transit</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                  Preferred Active Hours
                </label>
                <input
                  type="text"
                  value={profile.availability}
                  onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
                  placeholder="e.g. Weekday Evenings (5 PM - 9 PM)"
                  className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                Emergency Contact Details
              </label>
              <input
                type="text"
                value={profile.emergencyContact}
                onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                placeholder="Name and phone number for dispatch support emergency..."
                className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#22C55E]"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-[#22C55E] hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm py-4 rounded-2xl shadow-xl shadow-green-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
};
