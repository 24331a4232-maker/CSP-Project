import React from 'react';
import { ShieldCheck, Heart, Sparkles, Building2, Truck, Users, Award, CheckCircle2, ArrowRight } from 'lucide-react';

interface AboutSectionProps {
  onOpenDonateModal: () => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onOpenDonateModal, onOpenAuthModal }) => {
  return (
    <div className="py-12 sm:py-16 space-y-16">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto px-4 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold tracking-wide uppercase shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
          About The Last Plate Project
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
          Pioneering Real-Time <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22C55E] via-emerald-600 to-[#F97316]">
            Food Rescue Technology
          </span>
        </h1>
        <p className="text-base sm:text-lg text-gray-600 font-medium leading-relaxed">
          We bridge high-end commercial hospitality surplus with local food shelters through smart logistics, community volunteer captains, and rigid food safety protocols.
        </p>
      </div>

      {/* 3 Core Pillars (Frosted Glass Cards) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/80 shadow-xl shadow-emerald-950/5 relative overflow-hidden group hover:bg-white/80 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#22C55E] to-emerald-700 text-white flex items-center justify-center mb-6 shadow-lg shadow-green-200">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-3">1. Commercial Donor Network</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Hotels, convention centers, and wedding banquet hosts list untouched surplus meals in under 90 seconds. Our AI algorithm estimates shelf life and packaging requirements.
          </p>
          <ul className="space-y-2 text-xs font-semibold text-emerald-800">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Zero liability donor protections</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Tax deductibility reporting</li>
          </ul>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/80 shadow-xl shadow-emerald-950/5 relative overflow-hidden group hover:bg-white/80 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F97316] to-amber-600 text-white flex items-center justify-center mb-6 shadow-lg shadow-orange-200">
            <Truck className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-3">2. Express Volunteer Fleet</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Neighborhood volunteer captains receive instant geo-targeted push alerts when food is ready. Equipped with insulated thermal containers, they deliver in under 60 minutes.
          </p>
          <ul className="space-y-2 text-xs font-semibold text-orange-800">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#F97316]" /> Real-time route optimization</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#F97316]" /> Digital Proof of Delivery verification</li>
          </ul>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/80 shadow-xl shadow-emerald-950/5 relative overflow-hidden group hover:bg-white/80 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white flex items-center justify-center mb-6 shadow-lg shadow-slate-200">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-3">3. Dignified Community Shelters</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Partnered shelters, women's refuges, and evening soup kitchens receive warm, hotel-quality nutritional food to nourish families with warmth and dignity.
          </p>
          <ul className="space-y-2 text-xs font-semibold text-emerald-900">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-700" /> Direct recipient matching</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-700" /> Allergen & dietary compliance</li>
          </ul>
        </div>

      </div>

      {/* Safety Charter & Standards Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-gray-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Rigid Food Safety Charter
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight text-white">
                How We Guarantee 100% Safe, Hygienic Food Transport
              </h2>
              <p className="text-emerald-100/90 text-sm leading-relaxed">
                Food safety is our absolute non-negotiable priority. Every partner hotel and volunteer follows HACCP-compliant thermal hold guidelines, tamper-evident seals, and mandatory temperature logging.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
                  <h4 className="font-bold text-emerald-300 text-sm mb-1">Strict Thermal Window</h4>
                  <p className="text-xs text-gray-200">Cooked foods kept above 60°C or chilled below 5°C with rapid delivery within 3 hours.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
                  <h4 className="font-bold text-orange-300 text-sm mb-1">Visual Proof Logs</h4>
                  <p className="text-xs text-gray-200">Volunteers upload high-resolution photo proof upon drop-off for audit tracking.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center justify-center text-center p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 space-y-4">
              <Award className="w-16 h-16 text-yellow-400 animate-bounce" />
              <h3 className="text-xl font-bold text-white">Certified Zero-Waste Partner</h3>
              <p className="text-xs text-emerald-200">
                Recognized by Sustainable Food Alliance for saving over 148,000+ high-quality meals from landfills in 2025-2026.
              </p>
              <div className="flex gap-3 pt-2 w-full">
                <button
                  onClick={onOpenDonateModal}
                  className="flex-1 bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Partner With Us
                </button>
                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white font-bold text-xs py-3 rounded-xl border border-white/30 transition-all cursor-pointer"
                >
                  Join Volunteers
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
