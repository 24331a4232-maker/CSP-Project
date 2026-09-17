import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, Clock, Globe, Navigation } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Partnership');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <MessageSquare className="w-3.5 h-3.5 text-[#22C55E]" />
            GET IN TOUCH
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Contact The Last Plate Project
          </h2>
          <p className="text-gray-600 text-base">
            Have questions about onboarding your hotel, establishing an NGO shelter link, or corporate volunteering? Our dedicated team responds within 2 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-gray-200 shadow-xl space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Send Us a Message</h3>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-6 rounded-2xl text-center space-y-3 animate-in fade-in">
                <div className="w-12 h-12 bg-[#22C55E] text-white rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold">Message Received!</h4>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Thank you for reaching out, {name}. A Last Plate rescue coordinator will review your note and contact you at {email}.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                  className="text-xs font-bold text-emerald-700 underline pt-2"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Jenkins"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@hotel.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Inquiry Topic</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Partnership">Hotel / Restaurant Food Donation Partnership</option>
                    <option value="Volunteer">Volunteer Captain & Chapter Leadership</option>
                    <option value="Shelter">Community Shelter / NGO Food Onboarding</option>
                    <option value="Press">Press & Corporate ESG Reporting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Your Message *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about your organization, location, or questions..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Google Maps Interactive Placeholder & Contact Details */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Contact Details Card */}
            <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-5">
              <h3 className="text-xl font-bold text-white">Central Operations HQ</h3>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-white">The Last Plate Project HQ</p>
                    <p className="text-gray-300">500 Sustainability Way, Suite 400</p>
                    <p className="text-gray-400">Metropolis, CA 94103</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-gray-200">contact@thelastplateproject.org</span>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-gray-200">+1 (800) 555-PLATE (24/7 Hotline)</span>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-gray-800 text-xs text-emerald-300">
                  <Clock className="w-4 h-4" />
                  <span>Live Dispatch Hotline: Available 24/7 365 Days</span>
                </div>
              </div>
            </div>

            {/* Google Maps Visual Interactive Container Placeholder */}
            <div className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-md relative group">
              <div className="relative h-64 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80"
                  alt="City Map Route Placeholder"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent" />

                {/* Map Pins overlay */}
                <div className="absolute top-1/3 left-1/3 bg-[#22C55E] text-white text-[10px] font-extrabold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                  <MapPin className="w-3 h-3" /> HQ Metropolis
                </div>

                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl text-xs font-semibold text-gray-800 shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-emerald-600" />
                    <span>Active Hubs: 42 Metros Nationwide</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Interactive Map</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
