import React from 'react';
import { PlusCircle, HeartHandshake, ShieldCheck, ArrowRight, Sparkles, MapPin, Clock, Utensils, Users } from 'lucide-react';
import { DonationItem } from '../types';

interface HeroSectionProps {
  onOpenDonateModal: () => void;
  onOpenVolunteerSection: () => void;
  activeDonations: DonationItem[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenDonateModal,
  onOpenVolunteerSection,
  activeDonations,
}) => {
  const latestDonation = activeDonations[0] || {
    organizationName: 'Grand Palace Hotel & Suites',
    quantity: '60 Servings (8 Heated Trays)',
    urgency: 'High',
    address: 'Downtown, Metropolis',
  };

  return (
    <section id="home" className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 bg-gradient-to-b from-emerald-50/60 via-white to-white">
      {/* Decorative Ambient Background Glows */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Action Buttons */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 bg-emerald-100/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-300/60 text-emerald-900 text-xs sm:text-sm font-semibold shadow-xs">
              <Sparkles className="w-4 h-4 text-[#22C55E]" />
              <span>The Social Impact Movement for Food Dignity</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.12]">
              Don't Waste Food.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22C55E] via-emerald-600 to-[#F97316]">
                Share Hope.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 font-normal max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Connect surplus food from hotels, restaurants, and events with dedicated volunteers who deliver wholesome meals to people in need — eliminating hunger while rescuing our environment.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onOpenDonateModal}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-base px-7 py-4 rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 transition-all transform active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Donate Food Now</span>
              </button>

              <button
                onClick={onOpenVolunteerSection}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#F97316] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-base px-7 py-4 rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all transform active:scale-95 cursor-pointer"
              >
                <HeartHandshake className="w-5 h-5" />
                <span>Become a Volunteer</span>
              </button>
            </div>

            {/* Trust Markers */}
            <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm text-gray-500 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                <span>100% Food Safety Standard</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F97316]" />
                <span>&lt; 60 Min Local Pickup</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Verified NGO Network</span>
              </div>
            </div>

          </div>

          {/* Right Column: Glassmorphism Visual Showcase & Live Transfer Card */}
          <div className="lg:col-span-5 relative">
            
            {/* Main Visual Image Card with Glassmorphism Overlay */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/60 bg-white/40 backdrop-blur-md p-3 group">
              <div className="relative h-[340px] sm:h-[400px] rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=80"
                  alt="Volunteers sharing food with community"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent" />
                
                {/* Badge on Image */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-gray-800 flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
                  <span>LIVE SURPLUS RESCUE</span>
                </div>
              </div>

              {/* Floating Glassmorphism Rescue Activity Card */}
              <div className="absolute -bottom-6 left-4 right-4 sm:left-8 sm:right-8 bg-white/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#22C55E] flex items-center justify-center font-bold text-xs">
                      HOTEL
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{latestDonation.organizationName}</h4>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {latestDonation.address}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-red-100 text-red-700 uppercase tracking-wider">
                    {latestDonation.urgency} URGENCY
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                    <Utensils className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>{latestDonation.quantity}</span>
                  </div>
                  <div className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                    <span>Volunteer en route</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

            </div>

            {/* Extra Floating Metric Bubble */}
            <div className="hidden sm:flex absolute -top-4 -right-4 bg-gradient-to-br from-[#22C55E] to-emerald-700 text-white p-4 rounded-2xl shadow-xl border border-white/40 flex-col items-center justify-center text-center backdrop-blur-sm animate-bounce duration-1000">
              <span className="text-2xl font-black">148K+</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-emerald-100">Meals Served</span>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
