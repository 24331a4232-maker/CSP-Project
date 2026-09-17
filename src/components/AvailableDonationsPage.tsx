import React, { useState, useMemo } from 'react';
import { DonationItem, FoodCategory, UrgencyLevel, PickupStatus } from '../types';
import { Search, Filter, Clock, MapPin, Phone, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles, Utensils, ArrowRight, HeartHandshake } from 'lucide-react';

interface AvailableDonationsPageProps {
  donations: DonationItem[];
  onClaimPickup: (id: string, volunteerName: string) => void;
  onOpenDonateModal: () => void;
  showAdminOnlyRealtime?: boolean;
  onToggleAdminOnly?: (val: boolean) => void;
}

export const AvailableDonationsPage: React.FC<AvailableDonationsPageProps> = ({
  donations,
  onClaimPickup,
  onOpenDonateModal,
  showAdminOnlyRealtime = true,
  onToggleAdminOnly,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('Available');
  const [adminOnlyFilter, setAdminOnlyFilter] = useState<boolean>(showAdminOnlyRealtime);
  const [volunteerNameInput, setVolunteerNameInput] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const categories = ['All', 'Cooked Catering', 'Bakery & Pastries', 'Fresh Produce', 'Dairy & Beverage', 'Packaged & Frozen'];
  const urgencies = ['All', 'High', 'Medium', 'Low'];
  const statuses = ['All', 'Available', 'Assigned', 'Delivered'];

  const isItemAdminUpdated = (d: DonationItem) => {
    return (
      d.updatedBy === 'admin' ||
      d.updatedByRole === 'admin' ||
      d.adminVerified === true ||
      (typeof d.updatedByName === 'string' && d.updatedByName.toLowerCase().includes('admin')) ||
      Boolean(d.adminNotes)
    );
  };

  const filteredDonations = useMemo(() => {
    return donations.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesUrgency = selectedUrgency === 'All' || item.urgency === selectedUrgency;
      const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
      const matchesAdminOnly = !adminOnlyFilter || isItemAdminUpdated(item);

      return matchesSearch && matchesCategory && matchesUrgency && matchesStatus && matchesAdminOnly;
    });
  }, [donations, searchQuery, selectedCategory, selectedUrgency, selectedStatus, adminOnlyFilter]);

  const handleClaimSubmit = (e: React.FormEvent, donationId: string) => {
    e.preventDefault();
    if (!volunteerNameInput.trim()) return;
    onClaimPickup(donationId, volunteerNameInput.trim());
    setClaimingId(null);
    setVolunteerNameInput('');
  };

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
            Live Rescue Dispatch
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Available Food <span className="text-[#22C55E]">Donations</span>
          </h1>
          <p className="text-gray-600 text-sm max-w-2xl font-medium">
            Surplus food listed by hotels and caterers requiring immediate rescue. Volunteer heroes can claim routes below.
          </p>
        </div>

        <button
          onClick={onOpenDonateModal}
          className="bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-green-200 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Utensils className="w-4 h-4" />
          <span>Post Surplus Food</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card-subtle p-5 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by hotel name, food item, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#22C55E]/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status:</span>
            <div className="flex gap-1 bg-white/80 p-1 rounded-xl border border-gray-200">
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedStatus === st
                      ? 'bg-[#1F2937] text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Real-Time Filter Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const newVal = !adminOnlyFilter;
                setAdminOnlyFilter(newVal);
                if (onToggleAdminOnly) onToggleAdminOnly(newVal);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                adminOnlyFilter
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                  : 'bg-white/90 text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin-Updated Real-Time Only: {adminOnlyFilter ? 'ON' : 'OFF'}</span>
            </button>
          </div>

        </div>

        {/* Category Pills & Urgency Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-200/60">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#22C55E] text-white shadow-xs'
                    : 'bg-white/80 text-gray-600 hover:bg-gray-200/60 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Urgency:</span>
            {urgencies.map((urg) => (
              <button
                key={urg}
                onClick={() => setSelectedUrgency(urg)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedUrgency === urg
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/80 text-gray-600 border border-gray-200'
                }`}
              >
                {urg}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Donations Grid */}
      {filteredDonations.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <Utensils className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">No Food Donations Found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Try adjusting your search criteria or category filter, or post a new surplus food batch from a partner kitchen!
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedUrgency('All');
              setSelectedStatus('All');
            }}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonations.map((item) => (
            <div
              key={item.id}
              className="glass-card rounded-3xl p-6 border border-white/80 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
            >
              {/* Top Row Badges */}
              <div className="flex items-start justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {item.category}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                      item.urgency === 'High'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                        : item.urgency === 'Medium'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {item.urgency} Urgency
                  </span>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                      item.status === 'Available'
                        ? 'bg-[#22C55E] text-white'
                        : item.status === 'Assigned'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Title & Organization */}
              <div>
                <h3 className="text-base font-extrabold text-gray-900 group-hover:text-[#22C55E] transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs font-semibold text-gray-500 mt-1 flex items-center gap-1">
                  <span>{item.organizationName}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-emerald-700">{item.organizationType}</span>
                </p>
              </div>

              {/* Admin Updated Indicator */}
              {isItemAdminUpdated(item) && (
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                      Updated by Admin ({item.updatedByName || 'FoodBridge Admin'})
                    </span>
                    {item.updatedAt && (
                      <span className="text-[10px] text-emerald-700 font-medium">
                        {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {item.adminNotes && (
                    <p className="text-[11px] text-emerald-800 font-medium">
                      <span className="font-bold">Admin Dispatch Note:</span> {item.adminNotes}
                    </p>
                  )}
                </div>
              )}

              {/* Specs & Metrics */}
              <div className="bg-white/60 p-3.5 rounded-2xl border border-white/80 space-y-2 text-xs text-gray-700">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-gray-500">Quantity:</span>
                  <span className="text-gray-900">{item.quantity}</span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-gray-500">Est. Meals Served:</span>
                  <span className="text-[#22C55E] font-extrabold">{item.estimatedMeals} Meals</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-500" /> Safe Window:
                  </span>
                  <span className="font-bold text-orange-600">{item.expiryHours} hours left</span>
                </div>
                <div className="flex items-center justify-between font-medium">
                  <span className="text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> Location:
                  </span>
                  <span className="font-semibold text-gray-800 truncate max-w-[160px]">{item.address}</span>
                </div>
              </div>

              {/* Dietary Tags */}
              {item.dietaryTags && item.dietaryTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.dietaryTags.map((tag, idx) => (
                    <span key={idx} className="bg-emerald-50 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-emerald-100">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Button / Claim Inline Form */}
              <div className="pt-2 border-t border-gray-100">
                {item.status === 'Available' ? (
                  claimingId === item.id ? (
                    <form onSubmit={(e) => handleClaimSubmit(e, item.id)} className="space-y-2 animate-in fade-in duration-200">
                      <input
                        type="text"
                        placeholder="Enter your Volunteer Captain Name..."
                        value={volunteerNameInput}
                        onChange={(e) => setVolunteerNameInput(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-emerald-400 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-[#22C55E] hover:bg-emerald-600 text-white text-xs font-bold py-2 rounded-xl shadow-sm"
                        >
                          Confirm Claim
                        </button>
                        <button
                          type="button"
                          onClick={() => setClaimingId(null)}
                          className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setClaimingId(item.id)}
                      className="w-full bg-[#1F2937] hover:bg-emerald-600 text-white font-bold text-xs py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <HeartHandshake className="w-4 h-4 text-emerald-400" />
                      <span>Accept Pickup Route</span>
                    </button>
                  )
                ) : (
                  <div className="bg-emerald-50/80 p-2.5 rounded-2xl border border-emerald-200/80 text-center">
                    <p className="text-xs font-bold text-emerald-900">
                      Claimed by: {item.claimedByVolunteer || 'Assigned Volunteer'}
                    </p>
                    <p className="text-[10px] text-emerald-700 font-medium">Status: {item.status}</p>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
