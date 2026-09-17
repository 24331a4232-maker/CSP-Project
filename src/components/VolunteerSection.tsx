import React, { useState } from 'react';
import { HeartHandshake, ShieldCheck, MapPin, Clock, Award, CheckCircle2, ArrowRight, UserPlus, Sparkles, Navigation, Bike } from 'lucide-react';
import { DonationItem } from '../types';

interface VolunteerSectionProps {
  availablePickups: DonationItem[];
  onClaimPickup: (id: string, volunteerName: string) => void;
  onOpenAuthModal: (mode: 'register') => void;
}

export const VolunteerSection: React.FC<VolunteerSectionProps> = ({
  availablePickups,
  onClaimPickup,
  onOpenAuthModal,
}) => {
  const [weeklyHours, setWeeklyHours] = useState(2);
  const [volunteerNameInput, setVolunteerNameInput] = useState('');
  const [signedUpSuccess, setSignedUpSuccess] = useState(false);

  const estimatedMonthlyMeals = Math.round(weeklyHours * 60);
  const estimatedCO2Saved = Math.round(estimatedMonthlyMeals * 0.5);

  const handleQuickRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerNameInput) return;
    setSignedUpSuccess(true);
  };

  return (
    <section id="volunteer" className="py-20 bg-gradient-to-b from-white via-emerald-50/40 to-white relative overflow-hidden">
      
      {/* Background Accent */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Large Hero Callout Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-gray-900 text-white rounded-3xl p-8 sm:p-12 lg:p-14 shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-emerald-500/20">
          
          {/* Decorative Circle overlay */}
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="lg:col-span-7 space-y-6 relative z-10">
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              JOIN 3,240+ COMMUNITY HEROES
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Become a Community Hero. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-orange-400">
                Rescue Food in Your City.
              </span>
            </h2>

            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed max-w-xl">
              Turn your spare hour into nutritious meals for local families. As a Last Plate Volunteer Captain, you choose when and where to pick up surplus food from hotels and deliver it to shelters near you.
            </p>

            {/* Quick Hero Impact Estimator Slider */}
            <div className="bg-emerald-950/80 backdrop-blur-md p-5 rounded-2xl border border-emerald-700/60 space-y-3 max-w-lg">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <span>If you give: <strong className="text-white text-sm">{weeklyHours} Hours / Week</strong></span>
                <span className="text-orange-400 font-black">~{estimatedMonthlyMeals} Meals Saved / Month!</span>
              </div>

              <input
                type="range"
                min={1}
                max={10}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className="w-full accent-[#22C55E] cursor-pointer"
              />

              <div className="flex items-center justify-between text-[11px] text-emerald-200/80">
                <span>1 hr/wk</span>
                <span>Prevent ~{estimatedCO2Saved} kg CO2 emissions monthly</span>
                <span>10 hrs/wk</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button
                onClick={() => onOpenAuthModal('register')}
                className="w-full sm:w-auto bg-[#F97316] hover:bg-orange-600 text-white font-bold text-sm px-7 py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-5 h-5" />
                <span>Register as Volunteer</span>
              </button>

              <a
                href="#dashboard"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm px-6 py-4 rounded-xl transition-all text-center"
              >
                View Available Pickups
              </a>
            </div>

          </div>

          {/* Right Column: Hero Visual Illustration & Live Pickup Cards */}
          <div className="lg:col-span-5 relative z-10">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-3xl border border-white/20 shadow-2xl">
              <div className="relative rounded-2xl overflow-hidden h-72 sm:h-80">
                <img
                  src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80"
                  alt="Volunteer handing over food basket"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4 text-white text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Award className="w-4 h-4" />
                    <span>Verified Volunteer Captain Program</span>
                  </div>
                  <p className="text-gray-200 text-[11px]">
                    Receive an official volunteer badge, tax deduction credits, and digital impact certificate for your service.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Available Pickup Map Preview Cards */}
        <div className="mt-16 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block">NEARBY RESCUE OPPORTUNITIES</span>
              <h3 className="text-2xl font-extrabold text-gray-900">Current Unclaimed Pickups</h3>
            </div>
            <a href="#dashboard" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
              <span>See All Dashboard Pickups</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {availablePickups.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                      {item.organizationName}
                    </span>
                    <span className="text-gray-400 text-[11px]">~1.4 km away</span>
                  </div>

                  <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>

                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item.address}</span>
                  </p>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Meal Volume:</span>
                    <span className="font-bold text-emerald-700">~{item.estimatedMeals} Meals</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Safe Window:</span>
                    <span className="font-bold text-orange-600">Within {item.expiryHours} hours</span>
                  </div>
                </div>

                <button
                  onClick={() => onClaimPickup(item.id, 'Volunteer Hero')}
                  className="w-full bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Accept Pickup Route</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
