import React, { useState } from 'react';
import { Package, Truck, CheckCircle, Utensils, Search, Filter, MapPin, Clock, AlertTriangle, Sparkles, Check, ChevronRight, Phone, ShieldCheck } from 'lucide-react';
import { DonationItem, DashboardMetrics, PickupStatus, UrgencyLevel, UserRoleType } from '../types';

interface DashboardPreviewProps {
  metrics: DashboardMetrics;
  donations: DonationItem[];
  onClaimPickup: (id: string, volunteerName: string) => void;
  onUpdateStatus: (id: string, newStatus: PickupStatus, proofPhoto?: string) => void;
  onOpenDonateModal: () => void;
  userRole: UserRoleType;
}

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({
  metrics,
  donations,
  onClaimPickup,
  onUpdateStatus,
  onOpenDonateModal,
  userRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [selectedItemForModal, setSelectedItemForModal] = useState<DonationItem | null>(null);

  const filteredDonations = donations.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === 'All' || d.status === selectedStatusFilter;

    const matchesCategory =
      selectedCategoryFilter === 'All' || d.category === selectedCategoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getUrgencyBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'High':
        return <span className="bg-red-100 text-red-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-red-200">HIGH URGENCY</span>;
      case 'Medium':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-amber-200">MED URGENCY</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200">LOW URGENCY</span>;
    }
  };

  const getStatusBadge = (status: PickupStatus) => {
    switch (status) {
      case 'Available':
        return <span className="bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs animate-pulse">● AVAILABLE</span>;
      case 'Assigned':
        return <span className="bg-orange-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs">IN TRANSIT</span>;
      case 'Collected':
        return <span className="bg-blue-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs">COLLECTED</span>;
      case 'Delivered':
        return <span className="bg-gray-800 text-gray-100 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs">✓ DELIVERED</span>;
    }
  };

  return (
    <section id="dashboard" className="py-20 bg-gray-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
              LIVE DISPATCH COMMAND CENTER
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Real-time Impact & Pickup Dashboard
            </h2>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl">
              Monitor surplus food listings, manage volunteer routes, and verify real-time meal deliveries across all partner hotels and shelters.
            </p>
          </div>

          <button
            onClick={onOpenDonateModal}
            className="self-start md:self-auto bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span>Post New Food Listing</span>
          </button>
        </div>

        {/* 5 Key Metric Glassmorphism Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-xs font-semibold">Total Donations</span>
              <Package className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{metrics.totalDonations.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-600 font-bold">+18 today</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-1 ring-1 ring-emerald-400/20">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-xs font-semibold">Available Pickups</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] animate-ping" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">{metrics.availablePickups}</p>
            <p className="text-[10px] text-gray-500 font-semibold">Urgent rescue ready</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-xs font-semibold">In Transit</span>
              <Truck className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-orange-600">
              {donations.filter((d) => d.status === 'Assigned' || d.status === 'Collected').length}
            </p>
            <p className="text-[10px] text-gray-500 font-semibold">Volunteers en route</p>
          </div>

          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-gray-500 mb-1">
              <span className="text-xs font-semibold">Delivered</span>
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{metrics.deliveredCount.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-600 font-bold">100% Verified POD</p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-[#22C55E] to-emerald-700 text-white p-5 rounded-2xl shadow-md space-y-1">
            <div className="flex items-center justify-between text-emerald-100 mb-1">
              <span className="text-xs font-semibold">Meals Saved</span>
              <Utensils className="w-4 h-4" />
            </div>
            <p className="text-2xl sm:text-3xl font-black">{metrics.mealsSaved.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-200 font-bold">Zero landfill waste</p>
          </div>

        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search hotel, title, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-emerald-600" /> Filter Status:
            </span>
            {['All', 'Available', 'Assigned', 'Collected', 'Delivered'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                  selectedStatusFilter === st
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

        </div>

        {/* Donations Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonations.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500 font-medium">No food listings match your search criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatusFilter('All');
                }}
                className="mt-3 text-xs text-emerald-600 font-bold underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredDonations.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4 relative group"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700">
                      {item.organizationType}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>

                  <h3 className="font-bold text-base text-gray-900 group-hover:text-emerald-700 transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-gray-600 font-semibold flex items-center gap-1">
                    <span className="text-emerald-700 font-extrabold">{item.organizationName}</span>
                  </p>

                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{item.address}, {item.city}</span>
                  </p>

                  {/* Admin verified badge */}
                  {(item.updatedBy === 'admin' || item.adminVerified) && (
                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2 space-y-1 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          Updated by Admin ({item.updatedByName || 'FoodBridge Admin'})
                        </span>
                        {item.updatedAt && (
                          <span className="text-[9px] text-emerald-700 font-semibold">
                            {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      {item.adminNotes && (
                        <p className="text-[10px] text-emerald-800 font-medium">
                          <span className="font-bold">Admin Dispatch Note:</span> {item.adminNotes}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Details Box */}
                <div className="bg-gray-50 p-3 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Quantity:</span>
                    <span className="font-bold text-gray-800">{item.quantity}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Est. Meals Served:</span>
                    <span className="font-extrabold text-emerald-700">~{item.estimatedMeals} Meals</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Urgency Level:</span>
                    {getUrgencyBadge(item.urgency)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-orange-500" /> Safe Window:
                    </span>
                    <span className="font-semibold text-gray-700">Within {item.expiryHours} hours</span>
                  </div>
                </div>

                {/* Dietary Tags */}
                <div className="flex flex-wrap gap-1">
                  {item.dietaryTags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedItemForModal(item)}
                    className="text-xs font-bold text-gray-600 hover:text-emerald-700 px-3 py-2 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    View Details
                  </button>

                  {item.status === 'Available' && (
                    <button
                      onClick={() => onClaimPickup(item.id, 'Volunteer Hero')}
                      className="bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95"
                    >
                      Accept Pickup
                    </button>
                  )}

                  {item.status === 'Assigned' && (
                    <button
                      onClick={() => onUpdateStatus(item.id, 'Collected')}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all"
                    >
                      Mark Collected
                    </button>
                  )}

                  {item.status === 'Collected' && (
                    <button
                      onClick={() =>
                        onUpdateStatus(
                          item.id,
                          'Delivered',
                          'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
                        )
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all"
                    >
                      Upload POD & Complete
                    </button>
                  )}

                  {item.status === 'Delivered' && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Delivered & Verified
                    </span>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

        {/* Modal Detail Inspect Dialog */}
        {selectedItemForModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold p-1"
              >
                ✕
              </button>

              <div className="space-y-1">
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">
                  {selectedItemForModal.category}
                </span>
                <h3 className="text-xl font-extrabold text-gray-900">{selectedItemForModal.title}</h3>
                <p className="text-xs text-gray-500">{selectedItemForModal.organizationName} • {selectedItemForModal.address}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl space-y-2 text-xs">
                <p><strong>Storage Needs:</strong> {selectedItemForModal.storageRequirement}</p>
                <p><strong>Contact Phone:</strong> {selectedItemForModal.contactPhone}</p>
                <p><strong>Preparation Time:</strong> {selectedItemForModal.preparationTime}</p>
                {selectedItemForModal.claimedByVolunteer && (
                  <p className="text-orange-600 font-bold">Assigned Volunteer: {selectedItemForModal.claimedByVolunteer}</p>
                )}
              </div>

              {selectedItemForModal.aiGuidance && (
                <div className="bg-gradient-to-br from-emerald-900 to-gray-900 text-white p-4 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <span>AI Safety & Logistics Guidance</span>
                  </div>
                  <p className="text-emerald-100">{selectedItemForModal.aiGuidance.logisticsTip}</p>
                  <p className="text-[11px] text-emerald-300">
                    Recommended Storage: {selectedItemForModal.aiGuidance.storageType}
                  </p>
                </div>
              )}

              {selectedItemForModal.proofPhotoUrl && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-700">Proof of Delivery Photo:</p>
                  <img
                    src={selectedItemForModal.proofPhotoUrl}
                    alt="Proof of Delivery"
                    className="w-full h-32 object-cover rounded-xl border"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedItemForModal(null)}
                  className="bg-gray-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
