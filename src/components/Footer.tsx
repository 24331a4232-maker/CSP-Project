import React, { useState } from 'react';
import { UtensilsCrossed, Heart, Mail, Phone, MapPin, Send, Check, ShieldCheck, Github, Twitter, Linkedin, Instagram, Facebook } from 'lucide-react';

interface FooterProps {
  onNavClick: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavClick }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) setSubscribed(true);
  };

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Top Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#22C55E] flex items-center justify-center text-white font-bold">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                The Last Plate <span className="text-[#22C55E]">Project</span>
              </span>
            </div>

            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Connecting hotels, banquet halls, and event hosts who have surplus food with dedicated volunteers who deliver wholesome meals directly to shelters in need.
            </p>

            <div className="flex items-center gap-3 text-gray-400 pt-1">
              <a href="#" className="p-2 bg-gray-800 hover:bg-[#22C55E] hover:text-white rounded-lg transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-gray-800 hover:bg-[#22C55E] hover:text-white rounded-lg transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-gray-800 hover:bg-[#22C55E] hover:text-white rounded-lg transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-gray-800 hover:bg-[#22C55E] hover:text-white rounded-lg transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3 text-xs sm:text-sm">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 font-medium">
              <li><button onClick={() => onNavClick('home')} className="hover:text-emerald-400 transition-colors">Home</button></li>
              <li><button onClick={() => onNavClick('how-it-works')} className="hover:text-emerald-400 transition-colors">How It Works</button></li>
              <li><button onClick={() => onNavClick('features')} className="hover:text-emerald-400 transition-colors">Features</button></li>
              <li><button onClick={() => onNavClick('dashboard')} className="hover:text-emerald-400 transition-colors">Live Dashboard</button></li>
              <li><button onClick={() => onNavClick('calculator')} className="hover:text-emerald-400 transition-colors">Impact Calculator</button></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-3 space-y-3 text-xs sm:text-sm">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Contact & Hotline</h4>
            <ul className="space-y-2.5 text-gray-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span>contact@thelastplateproject.org</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span>+1 (800) 555-PLATE (7528)</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                <span>500 Sustainability Way, Metropolis CA 94103</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-3 space-y-3 text-xs sm:text-sm">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Stay Impact Updated</h4>
            <p className="text-gray-400 text-xs">
              Receive monthly food rescue reports, volunteer spotlights, and sustainability stories.
            </p>

            {subscribed ? (
              <div className="bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Subscribed successfully! Thank you.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 px-3 bg-[#22C55E] text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                  >
                    Join
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>

        {/* Bottom Copyright & Badges */}
        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} The Last Plate Project. All rights reserved. Zero Food Waste • Zero Hunger.</p>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> 501(c)(3) Non-Profit Certified
            </span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
