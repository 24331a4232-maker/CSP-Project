import React, { useState } from 'react';
import { Upload, HandHeart, Bike, HeartHandshake, ArrowRight, CheckCircle2, Building, ShieldAlert, Sparkles } from 'lucide-react';

interface HowItWorksSectionProps {
  onOpenDonateModal: () => void;
  onOpenVolunteerSection: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({
  onOpenDonateModal,
  onOpenVolunteerSection,
}) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: 'Step 1',
      title: 'Hotel or Event Uploads Surplus Food',
      shortDesc: 'Kitchens list excess gourmet dishes, catering trays, or bakery goods in under 2 minutes.',
      details: [
        'Input quantity, food type, dietary tags, and safe temperature window.',
        'Use built-in AI Food Estimator to auto-calculate shelf life & meal counts.',
        'Specify dock / pickup location details for easy volunteer access.'
      ],
      icon: Upload,
      color: 'bg-emerald-500 text-white',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      ctaText: 'List Surplus Food',
      action: onOpenDonateModal,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    },
    {
      number: 'Step 2',
      title: 'Nearby Volunteer Accepts Request',
      shortDesc: 'Registered community volunteers receive instant geo-notifications on their live dashboard.',
      details: [
        'View distance, urgency level, and estimated meal counts on interactive map.',
        'Accept task with a single tap to lock in pickup time.',
        'Get turn-by-turn route directions directly to hotel loading dock.'
      ],
      icon: HandHeart,
      color: 'bg-orange-500 text-white',
      badgeColor: 'bg-orange-100 text-orange-800',
      ctaText: 'View Volunteer Map',
      action: onOpenVolunteerSection,
      image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80',
    },
    {
      number: 'Step 3',
      title: 'Volunteer Collects Food Safely',
      shortDesc: 'Volunteer arrives with insulated thermal carriers and verifies food temp & packaging.',
      details: [
        'Perform quick food safety checklist (containers sealed, temperature safe).',
        'Scan QR code or confirm pickup with hotel duty manager.',
        'Load insulated thermal transport bags into vehicle or bike cargo.'
      ],
      icon: Bike,
      color: 'bg-teal-600 text-white',
      badgeColor: 'bg-teal-100 text-teal-800',
      ctaText: 'Check Safety Protocols',
      action: onOpenVolunteerSection,
      image: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?auto=format&fit=crop&w=800&q=80',
    },
    {
      number: 'Step 4',
      title: 'Food Reaches Needy People Directly',
      shortDesc: 'Warm meals are delivered to accredited shelters, community kitchens, and family centers.',
      details: [
        'Direct handoff to shelter coordinator or meal hall supervisor.',
        'Upload Proof of Delivery photo on dashboard for donor transparency.',
        'Donor hotel receives real-time impact report showing lives nourished!'
      ],
      icon: HeartHandshake,
      color: 'bg-emerald-700 text-white',
      badgeColor: 'bg-emerald-100 text-emerald-900',
      ctaText: 'See Live Proof Logs',
      action: onOpenDonateModal,
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gray-50/70 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
            SEAMLESS 4-STEP LOGISTICS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            How The Last Plate Project Works
          </h2>
          <p className="text-gray-600 text-base">
            A tech-enabled bridge uniting hospitality leaders, passionate volunteers, and community shelters to eradicate food insecurity in real time.
          </p>
        </div>

        {/* Stepper Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={s.number}
                onClick={() => setActiveStep(idx)}
                className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-[#22C55E] shadow-lg ring-2 ring-emerald-500/20'
                    : 'bg-white/80 border-gray-200 hover:bg-white hover:border-emerald-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${s.badgeColor}`}>
                      {s.number}
                    </span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-1">{s.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{s.shortDesc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>{isSelected ? 'Viewing Step' : 'Click to inspect'}</span>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-1' : ''}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Active Step Focus Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-gray-200/80 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold">
              <span>{steps[activeStep].number} Detail Breakdown</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {steps[activeStep].title}
            </h3>

            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {steps[activeStep].shortDesc}
            </p>

            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Key Execution Checklist</p>
              {steps[activeStep].details.map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-700">{point}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={steps[activeStep].action}
                className="inline-flex items-center gap-2 bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>{steps[activeStep].ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-100 aspect-4/3">
              <img
                src={steps[activeStep].image}
                alt={steps[activeStep].title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3.5 rounded-xl border border-white/60 text-xs font-medium text-gray-800 shadow-md">
                <span className="font-bold text-emerald-700">Verified Process:</span> 100% compliant with local food safety & health department guidelines.
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
