import React, { useState } from 'react';
import { Radar, Users, Lock, Camera, LayoutDashboard, BellRing, Check, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  const features = [
    {
      id: 'tracking',
      title: 'Real-time Donation Tracking',
      description: 'Track the exact status of surplus food from hotel kitchen packaging to final shelter distribution via live GPS & timestamped status updates.',
      icon: Radar,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      demoComponent: (
        <div className="bg-slate-900 text-white p-5 rounded-2xl font-mono text-xs space-y-3 shadow-inner">
          <div className="flex items-center justify-between text-emerald-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-2 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              LIVE GPS TRACKER #DON-001
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded">ETA 12 MINS</span>
          </div>
          <div className="space-y-2 text-slate-300">
            <p className="flex justify-between"><span className="text-slate-500">Origin:</span> Grand Palace Hotel (Dock B)</p>
            <p className="flex justify-between"><span className="text-slate-500">Carrier:</span> Volunteer Alex M. (Electric Cargo Van)</p>
            <p className="flex justify-between"><span className="text-slate-500">Destination:</span> Hope Center Shelter Kitchen</p>
            <p className="flex justify-between"><span className="text-slate-500">Food Temp:</span> 64°C (Safe Hot Hold Verified)</p>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[75%] rounded-full animate-pulse" />
          </div>
        </div>
      ),
    },
    {
      id: 'coordination',
      title: 'Volunteer Coordination',
      description: 'Smart dispatch system groups nearby pickups by optimal route, vehicle capacity, and urgency level so volunteers maximize their impact per hour.',
      icon: Users,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      demoComponent: (
        <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between font-bold text-gray-800 border-b pb-2">
            <span>Route Optimization Match</span>
            <span className="text-orange-600 font-extrabold">+3 Pickups Batched</span>
          </div>
          <div className="space-y-2">
            <div className="p-2.5 bg-orange-50/80 rounded-xl border border-orange-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">Stop 1: Lumière Bakery</p>
                <p className="text-[11px] text-gray-500">40 Pastry Boxes (1.2 km away)</p>
              </div>
              <span className="px-2 py-1 bg-orange-600 text-white rounded text-[10px] font-bold">READY</span>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">Stop 2: Expo Center</p>
                <p className="text-[11px] text-gray-500">100 Sandwich Trays (2.4 km away)</p>
              </div>
              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] font-bold">NEXT</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'auth',
      title: 'Secure Role-Based Login',
      description: 'Dedicated portals and permissions tailored for Hotel Managers, Kitchen Staff, Volunteer Captains, and NGO Shelter Coordinators.',
      icon: Lock,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      demoComponent: (
        <div className="bg-gradient-to-br from-teal-900 to-gray-900 text-white p-5 rounded-2xl text-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-teal-800 pb-2">
            <Lock className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-teal-200">Verified Partner Portal</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-teal-950/60 rounded border border-teal-800/80 text-teal-200">
              ✓ Hotel Tax Receipt Generator
            </div>
            <div className="p-2 bg-teal-950/60 rounded border border-teal-800/80 text-teal-200">
              ✓ Health Dept Audit Logs
            </div>
            <div className="p-2 bg-teal-950/60 rounded border border-teal-800/80 text-teal-200">
              ✓ Staff Access Levels
            </div>
            <div className="p-2 bg-teal-950/60 rounded border border-teal-800/80 text-teal-200">
              ✓ Instant SMS Notifications
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'proof',
      title: 'Proof of Delivery (POD)',
      description: 'Volunteers capture timestamped photos and digital recipient signatures upon delivery for complete corporate compliance and donor peace of mind.',
      icon: Camera,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      demoComponent: (
        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-gray-800">
            <span>Proof of Delivery #9841</span>
            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">VERIFIED</span>
          </div>
          <div className="h-28 rounded-xl overflow-hidden relative">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"
              alt="Proof of delivery"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
              📸 Photo Verified • 19:42 PM • GPS Matched
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'dashboard',
      title: 'Live Interactive Dashboard',
      description: 'Unified command center showing total donations, active rescue routes, meals served, and environmental carbon metrics in clean visual charts.',
      icon: LayoutDashboard,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      demoComponent: (
        <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <span className="text-[10px] text-gray-500 block">Total Meals</span>
              <span className="text-lg font-black text-indigo-700">148,500</span>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <span className="text-[10px] text-gray-500 block">CO2 Diverted</span>
              <span className="text-lg font-black text-emerald-700">74,250 kg</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      title: 'Automated Food Status Updates',
      description: 'Receive real-time push alerts and SMS notifications when surplus food is claimed, picked up, in transit, or safely received.',
      icon: BellRing,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      demoComponent: (
        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-2 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-bold">
            <BellRing className="w-4 h-4 text-amber-600" />
            <span>SMS Alert Triggered</span>
          </div>
          <p className="bg-white p-2.5 rounded-xl border border-amber-200 font-sans text-gray-700 shadow-2xs">
            "Your donation of 60 catering trays was just picked up by Volunteer Sarah J. Target arrival at Hope Shelter in 18 minutes!"
          </p>
        </div>
      ),
    },
  ];

  return (
    <section id="features" className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
            BUILT FOR IMPACT & SCALE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Powerful Features Guiding Every Rescue
          </h2>
          <p className="text-gray-600 text-base">
            Engineered with modern glassmorphism UI, intelligent routing algorithms, and stringent food safety verification to maximize social impact.
          </p>
        </div>

        {/* Feature Grid & Interactive Preview Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Feature Selector Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feat, index) => {
              const Icon = feat.icon;
              const isSelected = activeFeatureIndex === index;
              return (
                <div
                  key={feat.id}
                  onClick={() => setActiveFeatureIndex(index)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-br from-emerald-50/80 via-white to-white border-[#22C55E] shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${feat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-gray-900">{feat.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{feat.description}</p>
                  </div>

                  <div className="mt-4 pt-2 flex items-center justify-between text-xs font-semibold text-emerald-600">
                    <span>{isSelected ? 'Active Preview' : 'Click to preview'}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#22C55E]" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feature Live Preview Interactive Stage */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-700/60 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">FEATURE LIVE DEMO</span>
                  <h4 className="font-bold text-lg text-white">{features[activeFeatureIndex].title}</h4>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
              </div>

              <div className="py-2">
                {features[activeFeatureIndex].demoComponent}
              </div>

              <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  Verified Safety & Security Protocol
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
