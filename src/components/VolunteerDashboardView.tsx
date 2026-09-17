import React, { useState } from 'react';
import { DonationItem, PickupStatus } from '../types';
import { Bike, CheckCircle2, Clock, MapPin, Camera, Upload, ShieldCheck, HeartHandshake, ArrowRight, Sparkles, Navigation, Phone, User } from 'lucide-react';
import { VolunteerProfile } from './VolunteerProfile';

interface VolunteerDashboardViewProps {
  donations: DonationItem[];
  onUpdateStatus: (id: string, newStatus: PickupStatus, proofPhoto?: string) => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
}

export const VolunteerDashboardView: React.FC<VolunteerDashboardViewProps> = ({
  donations,
  onUpdateStatus,
  onOpenAuthModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dispatch' | 'profile'>('dispatch');
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
  const [proofPhotoPreview, setProofPhotoPreview] = useState<string>('');
  const [volunteerNote, setVolunteerNote] = useState('');

  // Filter donations relevant to volunteers
  const claimedTasks = donations.filter((d) => d.status === 'Assigned' || d.status === 'Collected');
  const completedTasks = donations.filter((d) => d.status === 'Delivered');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sampleProofUrls = [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80',
  ];

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header Glass Banner */}
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider">
            <Bike className="w-3.5 h-3.5 text-[#F97316]" />
            Volunteer Captain Control Center
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Volunteer <span className="text-[#F97316]">Rescue Dashboard</span>
          </h1>
          <p className="text-gray-600 text-sm max-w-2xl font-medium">
            Manage your active rescue routes, update real-time status, and upload Proof of Delivery for transparent tracking.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setActiveSubTab(activeSubTab === 'profile' ? 'dispatch' : 'profile')}
            className={`font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'profile'
                ? 'bg-[#22C55E] text-white hover:bg-emerald-600'
                : 'bg-white text-gray-800 border border-gray-200 hover:bg-emerald-50'
            }`}
          >
            <User className="w-4 h-4 text-[#22C55E]" />
            <span>{activeSubTab === 'profile' ? 'View Rescue Routes' : 'My Profile & Bio'}</span>
          </button>

          <button
            onClick={() => onOpenAuthModal('login')}
            className="bg-[#1F2937] hover:bg-gray-800 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ID Verified</span>
          </button>
        </div>
      </div>

      {/* Sub Tab Navigation Pill Bar */}
      <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md p-1.5 rounded-2xl border border-white/90 shadow-2xs w-fit">
        <button
          onClick={() => setActiveSubTab('dispatch')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSubTab === 'dispatch'
              ? 'bg-[#F97316] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
          }`}
        >
          Active Rescue Dispatch
        </button>
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-[#22C55E] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
          }`}
        >
          My Profile & Settings
        </button>
      </div>

      {activeSubTab === 'profile' ? (
        <VolunteerProfile onBackToDashboard={() => setActiveSubTab('dispatch')} />
      ) : (
        <>
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card-subtle p-5 rounded-3xl">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Active Claimed Routes</span>
          <div className="text-3xl font-extrabold text-orange-500 mt-1">{claimedTasks.length}</div>
        </div>
        <div className="glass-card-subtle p-5 rounded-3xl">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Delivered Meals</span>
          <div className="text-3xl font-extrabold text-[#22C55E] mt-1">{completedTasks.length * 85 + 3200}</div>
        </div>
        <div className="glass-card-subtle p-5 rounded-3xl">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Avg. Pickup Speed</span>
          <div className="text-3xl font-extrabold text-gray-900 mt-1">24 Mins</div>
        </div>
        <div className="glass-card-subtle p-5 rounded-3xl">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Hero Rating</span>
          <div className="text-3xl font-extrabold text-amber-500 mt-1">4.9 / 5.0</div>
        </div>
      </div>

      {/* Main Grid: Active Routes & Completed Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Active Route Section (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-[#F97316]" />
              Active Dispatch Assignments ({claimedTasks.length})
            </h2>
            <span className="text-xs text-gray-500 font-semibold">Updated Real-Time</span>
          </div>

          {claimedTasks.length === 0 ? (
            <div className="glass-card p-10 text-center rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 text-[#F97316] flex items-center justify-center mx-auto">
                <Bike className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">No Active Pickup Routes</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                All food rescues in your immediate sector have been fulfilled! Head over to the Available Donations tab to claim a new route.
              </p>
            </div>
          ) : (
            claimedTasks.map((item) => {
              const isSelected = selectedDonationId === item.id;
              return (
                <div
                  key={item.id}
                  className="glass-card rounded-3xl p-6 border border-white/80 shadow-xl space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                    <div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-orange-100 text-orange-800">
                        {item.status} Route
                      </span>
                      <h3 className="text-lg font-extrabold text-gray-900 mt-1">{item.title}</h3>
                      <p className="text-xs font-medium text-gray-500">{item.organizationName} ({item.organizationType})</p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs font-bold text-[#22C55E] block">{item.quantity}</span>
                      <span className="text-[11px] text-gray-400 font-medium">Est. {item.estimatedMeals} Meals</span>
                    </div>
                  </div>

                  {/* Route Steps Visualizer */}
                  <div className="grid grid-cols-3 gap-2 bg-white/70 p-3 rounded-2xl border border-gray-200/80 text-center text-xs">
                    <div className={`p-2 rounded-xl font-bold ${item.status === 'Assigned' ? 'bg-orange-500 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                      1. Assigned
                    </div>
                    <div className={`p-2 rounded-xl font-bold ${item.status === 'Collected' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      2. Collected
                    </div>
                    <div className="p-2 rounded-xl font-bold bg-gray-100 text-gray-400">
                      3. Delivered
                    </div>
                  </div>

                  {/* Quick Action Controls */}
                  <div className="space-y-4">
                    {item.status === 'Assigned' && (
                      <button
                        onClick={() => onUpdateStatus(item.id, 'Collected')}
                        className="w-full bg-[#F97316] hover:bg-orange-600 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Food Picked Up from Kitchen</span>
                      </button>
                    )}

                    {item.status === 'Collected' && (
                      <div className="bg-emerald-50/90 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900">
                          <Camera className="w-4 h-4 text-[#22C55E]" />
                          <span>Complete Delivery & Upload Proof Photo</span>
                        </div>

                        {/* File Upload or Preset Choice */}
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                          />

                          {proofPhotoPreview && (
                            <div className="relative w-full h-36 rounded-xl overflow-hidden border border-emerald-300">
                              <img src={proofPhotoPreview} alt="Proof preview" className="w-full h-full object-cover" />
                            </div>
                          )}

                          <p className="text-[10px] text-gray-500 font-medium">Or select a verified sample proof photo:</p>
                          <div className="flex gap-2">
                            {sampleProofUrls.map((url, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setProofPhotoPreview(url)}
                                className="w-12 h-12 rounded-lg overflow-hidden border border-gray-300 hover:border-[#22C55E]"
                              >
                                <img src={url} alt="Sample" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onUpdateStatus(item.id, 'Delivered', proofPhotoPreview || sampleProofUrls[0]);
                            setProofPhotoPreview('');
                          }}
                          className="w-full bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit Verified Proof of Delivery</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* History / Completed Logs Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
              Completed Deliveries History
            </h3>

            {completedTasks.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No completed deliveries recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <div key={task.id} className="p-3 bg-white/80 rounded-2xl border border-gray-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span className="truncate max-w-[150px]">{task.title}</span>
                      <span className="text-[#22C55E] font-extrabold">DELIVERED</span>
                    </div>
                    <p className="text-[11px] text-gray-500">{task.organizationName}</p>
                    {task.proofPhotoUrl && (
                      <div className="w-full h-24 rounded-xl overflow-hidden border border-gray-200">
                        <img src={task.proofPhotoUrl} alt="Proof" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
        </>
      )}

    </div>
  );
};
