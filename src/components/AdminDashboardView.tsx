import React, { useState } from 'react';
import { DonationItem, DashboardMetrics, PickupStatus, UserRoleType } from '../types';
import { ShieldAlert, Users, Utensils, CheckCircle2, AlertTriangle, Search, Download, Trash2, Edit, Eye, Sparkles, Building2, Bike, BarChart2, X, Filter, User, Phone, MapPin, Building, Save, ShieldCheck, Check, Copy } from 'lucide-react';

export interface AdminPersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  organization: string;
  roleTitle: string;
}

const DEFAULT_ADMIN_PROFILE: AdminPersonalInfo = {
  fullName: 'FoodBridge Administrator',
  email: 'admin@foodbridge.org',
  phone: '7780447031',
  address: 'MVGR College Of Engineering',
  city: 'Vizianagaram',
  state: 'Andhra Pradesh',
  pincode: '535003',
  organization: 'MVGR College Of Engineering / FoodBridge HQ',
  roleTitle: 'Chief System Administrator'
};

interface AdminDashboardViewProps {
  donations: DonationItem[];
  metrics: DashboardMetrics;
  onUpdateStatus: (id: string, newStatus: PickupStatus, proofPhoto?: string, adminNotes?: string) => void;
  onOpenDonateModal: () => void;
  showAdminOnlyRealtime?: boolean;
  onToggleAdminOnly?: (val: boolean) => void;
  realtimeConnected?: boolean;
  lastSyncTime?: string;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  donations,
  metrics,
  onUpdateStatus,
  onOpenDonateModal,
  showAdminOnlyRealtime = true,
  onToggleAdminOnly,
  realtimeConnected = true,
  lastSyncTime = '',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'donations' | 'users' | 'profile'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [localAdminOnly, setLocalAdminOnly] = useState<boolean>(showAdminOnlyRealtime);

  // Admin personal profile state with persistent local storage
  const [adminProfile, setAdminProfile] = useState<AdminPersonalInfo>(() => {
    try {
      const saved = localStorage.getItem('last_plate_admin_personal_info');
      if (saved) {
        return { ...DEFAULT_ADMIN_PROFILE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not read admin profile from localStorage:', e);
    }
    return DEFAULT_ADMIN_PROFILE;
  });

  const [editForm, setEditForm] = useState<AdminPersonalInfo>(adminProfile);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminProfile(editForm);
    try {
      localStorage.setItem('last_plate_admin_personal_info', JSON.stringify(editForm));
    } catch (e) {
      console.warn('Could not write to localStorage:', e);
    }
    setSaveSuccessMessage('Admin Personal Information saved successfully!');
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isItemAdminUpdated = (d: DonationItem) => {
    return (
      d.updatedBy === 'admin' ||
      d.updatedByRole === 'admin' ||
      d.adminVerified === true ||
      (typeof d.updatedByName === 'string' && d.updatedByName.toLowerCase().includes('admin')) ||
      Boolean(d.adminNotes)
    );
  };

  const filteredDonations = donations.filter((d) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      d.title.toLowerCase().includes(q) ||
      d.organizationName.toLowerCase().includes(q)
    );
    const matchesStatus = filterStatus === 'All' || d.status === filterStatus;
    const matchesAdminOnly = !localAdminOnly || isItemAdminUpdated(d);
    return matchesSearch && matchesStatus && matchesAdminOnly;
  });

  // Export CSV mock handler
  const handleExportCSV = () => {
    const headers = 'ID,Title,Organization,Type,Meals,Status,CreatedAt\n';
    const rows = donations
      .map(
        (d) =>
          `"${d.id}","${d.title.replace(/"/g, '""')}","${d.organizationName}","${d.category}",${d.estimatedMeals},"${d.status}","${d.createdAt}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LastPlate_Donations_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const sampleUsers = [
    {
      name: adminProfile.fullName,
      email: adminProfile.email,
      role: 'Super Administrator',
      status: 'Active (MVGR Vizianagaram)',
      phone: adminProfile.phone,
      address: `${adminProfile.address}, ${adminProfile.city}, ${adminProfile.state} - ${adminProfile.pincode}`,
      totalDonations: 154
    },
    { name: 'Grand Palace Hotel', email: 'kitchen@grandpalace.com', role: 'Hotel Donor', status: 'Verified', totalDonations: 42 },
    { name: 'Lumière French Bakery', email: 'contact@lumiere.com', role: 'Bakery Donor', status: 'Verified', totalDonations: 18 },
    { name: 'Sarah Jenkins', email: 'sarah.j@volunteers.org', role: 'Volunteer Captain', status: 'ID Verified', totalDonations: 34 },
    { name: 'David Miller', email: 'dmiller@rescue.org', role: 'Volunteer Driver', status: 'ID Verified', totalDonations: 29 },
    { name: 'St. Jude Shelter', email: 'director@stjude.org', role: 'NGO Recipient', status: 'Verified', totalDonations: 82 },
  ];

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header Glass Banner */}
      <div className="glass-card p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            System Administration Panel
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Admin <span className="text-[#22C55E]">Platform Control</span>
          </h1>
          <p className="text-gray-600 text-sm max-w-2xl font-medium">
            Monitor real-time food rescue analytics, audit donor submissions, manage volunteer access, and configure administrator details.
          </p>

          {/* Quick Admin Profile Strip */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold shadow-2xs">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Phone: <strong className="font-bold">{adminProfile.phone}</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/90 text-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 font-medium shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>{adminProfile.address}, {adminProfile.city}, {adminProfile.state} - {adminProfile.pincode}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('profile');
                setEditForm(adminProfile);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline ml-1 cursor-pointer"
            >
              <User className="w-3 h-3" />
              View / Edit Personal Information &rarr;
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportCSV}
            className="bg-[#1F2937] hover:bg-gray-800 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV Audit Log</span>
          </button>
          <button
            onClick={onOpenDonateModal}
            className="bg-[#22C55E] hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-md transition-all cursor-pointer"
          >
            + Add Manual Entry
          </button>
        </div>
      </div>

      {/* Admin Navigation Sub-Tabs & Global Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex gap-2 bg-white/60 p-1.5 rounded-2xl border border-white/80 max-w-xl flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-[#1F2937] text-white shadow-xs' : 'text-gray-600 hover:bg-white/80'
            }`}
          >
            Analytics & KPIs
          </button>
          <button
            onClick={() => setActiveTab('donations')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'donations' ? 'bg-[#1F2937] text-white shadow-xs' : 'text-gray-600 hover:bg-white/80'
            }`}
          >
            Manage Food Batches
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users' ? 'bg-[#1F2937] text-white shadow-xs' : 'text-gray-600 hover:bg-white/80'
            }`}
          >
            Partners & Users
          </button>
          <button
            onClick={() => {
              setActiveTab('profile');
              setEditForm(adminProfile);
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'profile' ? 'bg-[#1F2937] text-white shadow-xs' : 'text-gray-600 hover:bg-white/80'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal Information</span>
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
          <input
            id="admin-search-bar"
            type="text"
            placeholder="Search by donor name or donation title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 p-0.5 rounded cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Overview & KPI Analytics */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-3xl space-y-2 border-l-4 border-l-[#22C55E]">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Meals Saved</span>
              <div className="text-3xl font-extrabold text-gray-900">{metrics.mealsSaved.toLocaleString()}</div>
              <p className="text-[11px] text-emerald-700 font-semibold">+14% increase from last week</p>
            </div>

            <div className="glass-card p-6 rounded-3xl space-y-2 border-l-4 border-l-orange-500">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Rescue Requests</span>
              <div className="text-3xl font-extrabold text-orange-500">{metrics.availablePickups}</div>
              <p className="text-[11px] text-orange-700 font-semibold">Requires volunteer dispatch</p>
            </div>

            <div className="glass-card p-6 rounded-3xl space-y-2 border-l-4 border-l-blue-500">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Verified Donors</span>
              <div className="text-3xl font-extrabold text-gray-900">842 Hotels & Caterers</div>
              <p className="text-[11px] text-blue-700 font-semibold">100% Zero-Liability certified</p>
            </div>

            <div className="glass-card p-6 rounded-3xl space-y-2 border-l-4 border-l-emerald-600">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Est. CO2 Offsets</span>
              <div className="text-3xl font-extrabold text-[#22C55E]">74.2 Tons</div>
              <p className="text-[11px] text-emerald-700 font-semibold">Methane landfill reduction</p>
            </div>
          </div>

          {/* Activity Logs Bar */}
          <div className="glass-card p-8 rounded-3xl space-y-6">
            <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#22C55E]" />
              System Status Summary
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 p-5 rounded-2xl border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>Available Pickups</span>
                  <span className="text-emerald-600">{donations.filter((d) => d.status === 'Available').length}</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#22C55E] h-full" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div className="bg-white/80 p-5 rounded-2xl border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>In-Transit Routes</span>
                  <span className="text-orange-600">{donations.filter((d) => d.status === 'Assigned' || d.status === 'Collected').length}</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full" style={{ width: '30%' }}></div>
                </div>
              </div>

              <div className="bg-white/80 p-5 rounded-2xl border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span>Delivered & Verified</span>
                  <span className="text-gray-900">{donations.filter((d) => d.status === 'Delivered').length}</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-gray-800 h-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Donation Lookup in Overview */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-[#22C55E]" />
                  <span>Donation Entries & Quick Lookup</span>
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {searchQuery
                    ? `Showing search results matching "${searchQuery}" by donor name or donation title`
                    : 'Recent visible donation entries across the platform'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('donations')}
                  className="text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-2 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Open Full Batch Manager</span>
                  <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-full text-[10px]">
                    {filteredDonations.length}
                  </span>
                </button>
              </div>
            </div>

            {searchQuery && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-2 rounded-xl text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-600" />
                  Filtered by: <strong>"{searchQuery}"</strong> ({filteredDonations.length} matching {filteredDonations.length === 1 ? 'entry' : 'entries'})
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  Clear filter
                </button>
              </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white/70">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-extrabold uppercase">
                  <tr>
                    <th className="p-3">Donation Title</th>
                    <th className="p-3">Donor Partner</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Urgency</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDonations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">
                        {searchQuery ? (
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-700">No donations matching "{searchQuery}"</p>
                            <p className="text-[11px] text-gray-400">Search by donor name or donation title</p>
                          </div>
                        ) : (
                          'No donations available.'
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredDonations.slice(0, searchQuery ? 10 : 5).map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-3 font-bold text-gray-900">
                          {d.title}
                          {d.adminVerified && (
                            <span className="ml-2 inline-flex items-center text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Admin Verified
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-gray-600 font-medium">{d.organizationName}</td>
                        <td className="p-3 font-extrabold text-emerald-600">{d.quantity}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.urgency === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {d.urgency}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-gray-100 text-gray-800">
                            {d.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('donations');
                            }}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                          >
                            Manage Entry &rarr;
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!searchQuery && filteredDonations.length > 5 && (
              <p className="text-[11px] text-gray-400 text-center font-medium">
                Showing first 5 entries. Use the search bar above to filter by donor or title, or switch to Manage Food Batches.
              </p>
            )}
          </div>

        </div>
      )}

      {/* Tab 2: Manage Food Batches */}
      {activeTab === 'donations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Real-time sync & filter bar */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Firestore Real-Time Stream
                </p>
                <p className="text-[11px] text-gray-300">
                  {realtimeConnected ? 'Connected & listening for instant document updates' : 'Reconnecting to database...'}
                  {lastSyncTime && ` • Last event: ${lastSyncTime}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300 font-medium">Data View:</span>
              <button
                type="button"
                onClick={() => {
                  const newVal = !localAdminOnly;
                  setLocalAdminOnly(newVal);
                  if (onToggleAdminOnly) onToggleAdminOnly(newVal);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  localAdminOnly
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Show Real-Time Data Only Updated by Admin: {localAdminOnly ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400 pointer-events-none" />
              <input
                id="admin-donations-search"
                type="text"
                placeholder="Search by donor name or donation title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs text-gray-500 font-medium">
                Showing <strong className="text-gray-900">{filteredDonations.length}</strong> of {donations.length} donations
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  <option value="All">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Collected">Collected</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>
          </div>

          {searchQuery && (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-2 rounded-xl text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                Filtered by: <strong>"{searchQuery}"</strong> ({filteredDonations.length} matching {filteredDonations.length === 1 ? 'donation' : 'donations'})
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
              >
                Clear filter
              </button>
            </div>
          )}

          <div className="glass-card rounded-3xl overflow-hidden border border-white/80 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-900 text-white font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Donation Title</th>
                    <th className="p-4">Donor Partner</th>
                    <th className="p-4">Quantity / Meals</th>
                    <th className="p-4">Urgency</th>
                    <th className="p-4">Current Status</th>
                    <th className="p-4">Admin Audit Status</th>
                    <th className="p-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white/70">
                  {filteredDonations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        <div className="max-w-sm mx-auto space-y-2">
                          <p className="font-bold text-gray-700">
                            {searchQuery
                              ? `No donations found matching "${searchQuery}".`
                              : 'No food donation records match the selected real-time criteria.'}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Try searching for another donor name (e.g., "Grand Palace Hotel") or donation title.
                          </p>
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reset Search Query</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDonations.map((d) => {
                      const adminUpdated = isItemAdminUpdated(d);
                      return (
                        <tr key={d.id} className="hover:bg-white/90 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{d.title}</div>
                            {d.adminNotes && (
                              <div className="mt-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                                <span className="font-bold">Admin Note:</span> {d.adminNotes}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-gray-600 font-medium">{d.organizationName}</td>
                          <td className="p-4 font-extrabold text-[#22C55E]">{d.quantity} ({d.estimatedMeals} meals)</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.urgency === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {d.urgency}
                            </span>
                          </td>
                          <td className="p-4 font-bold">
                            <select
                              value={d.status}
                              onChange={(e) => onUpdateStatus(d.id, e.target.value as PickupStatus, undefined, 'Status updated via Admin Console')}
                              className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold"
                            >
                              <option value="Available">Available</option>
                              <option value="Assigned">Assigned</option>
                              <option value="Collected">Collected</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </td>
                          <td className="p-4">
                            {adminUpdated ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Updated by Admin
                                </span>
                                <div className="text-[10px] text-gray-500 font-medium">
                                  {d.updatedByName || 'FoodBridge Admin'}
                                  {d.updatedAt && ` • ${new Date(d.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                Partner Submitted
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => onUpdateStatus(d.id, d.status, undefined, `Verified & dispatched by Admin at ${new Date().toLocaleTimeString()}`)}
                              className="text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>{adminUpdated ? 'Re-Verify' : 'Verify as Admin'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Users & Partners */}
      {activeTab === 'users' && (
        <div className="glass-card rounded-3xl p-6 border border-white/80 shadow-lg space-y-4 animate-in fade-in duration-200">
          <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#22C55E]" />
            Registered Platform Stakeholders
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-700 font-extrabold uppercase">
                <tr>
                  <th className="p-3">Organization / User</th>
                  <th className="p-3">Email Contact</th>
                  <th className="p-3">Stakeholder Role</th>
                  <th className="p-3">Phone & Location</th>
                  <th className="p-3">Compliance Status</th>
                  <th className="p-3 text-right">Total Rescues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white/80">
                {sampleUsers.map((u, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-900">{u.name}</td>
                    <td className="p-3 text-gray-500">{u.email}</td>
                    <td className="p-3 font-semibold text-emerald-800">{u.role}</td>
                    <td className="p-3 text-gray-600">
                      <div className="font-semibold text-gray-900">{u.phone}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{u.address}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-extrabold text-gray-900">{u.totalDonations} Batches</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Admin Personal Information */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Notification Toast */}
          {saveSuccessMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{saveSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-extrabold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Phone */}
            <div className="glass-card p-5 rounded-2xl border border-white/80 shadow-xs relative overflow-hidden group">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  Phone Number
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(adminProfile.phone, 'phone')}
                  className="text-[10px] font-bold text-gray-400 hover:text-emerald-600 flex items-center gap-1"
                  title="Copy Phone"
                >
                  {copiedField === 'phone' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedField === 'phone' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="text-lg font-extrabold text-gray-900 tracking-tight">
                {adminProfile.phone}
              </div>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Primary Administrative Hotline
              </p>
            </div>

            {/* Address */}
            <div className="glass-card p-5 rounded-2xl border border-white/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                <span className="flex items-center gap-1.5 text-red-600">
                  <MapPin className="w-4 h-4 text-red-500" />
                  Campus Address
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(adminProfile.address, 'address')}
                  className="text-[10px] font-bold text-gray-400 hover:text-emerald-600 flex items-center gap-1"
                  title="Copy Address"
                >
                  {copiedField === 'address' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedField === 'address' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="text-base font-extrabold text-gray-900 leading-tight">
                {adminProfile.address}
              </div>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Institutional Operations Hub
              </p>
            </div>

            {/* City & State */}
            <div className="glass-card p-5 rounded-2xl border border-white/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <Building className="w-4 h-4 text-blue-500" />
                  City & State
                </span>
              </div>
              <div className="text-lg font-extrabold text-gray-900">
                {adminProfile.city}
              </div>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">
                {adminProfile.state}
              </p>
            </div>

            {/* Pincode */}
            <div className="glass-card p-5 rounded-2xl border border-white/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-1">
                <span className="flex items-center gap-1.5 text-amber-600">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  Postal Code
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(adminProfile.pincode, 'pincode')}
                  className="text-[10px] font-bold text-gray-400 hover:text-emerald-600 flex items-center gap-1"
                  title="Copy Pincode"
                >
                  {copiedField === 'pincode' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedField === 'pincode' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="text-xl font-black text-gray-900 tracking-wider">
                {adminProfile.pincode}
              </div>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                Vizianagaram District PIN
              </p>
            </div>

          </div>

          {/* Detailed Personal Information Card & Form */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/80 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified System Identity
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mt-1.5">
                  Personal Information
                </h3>
                <p className="text-xs text-gray-500">
                  Official administrator record for food rescue management, emergency contacts, and institutional audit verification.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditForm(DEFAULT_ADMIN_PROFILE);
                    setAdminProfile(DEFAULT_ADMIN_PROFILE);
                    localStorage.setItem('last_plate_admin_personal_info', JSON.stringify(DEFAULT_ADMIN_PROFILE));
                    setSaveSuccessMessage('Reset to official credentials (MVGR College Of Engineering, Vizianagaram).');
                    setTimeout(() => setSaveSuccessMessage(null), 3500);
                  }}
                  className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Reset Defaults
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Phone */}
                <div>
                  <label htmlFor="admin-phone" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    Phone Number <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <input
                      id="admin-phone"
                      type="text"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="e.g. 7780447031"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Direct mobile/hotline for urgent distribution alerts.</p>
                </div>

                {/* Full Name */}
                <div>
                  <label htmlFor="admin-name" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <input
                      id="admin-name"
                      type="text"
                      required
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      placeholder="FoodBridge Administrator"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label htmlFor="admin-address" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    Campus / Street Address <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <input
                      id="admin-address"
                      type="text"
                      required
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="e.g. MVGR College Of Engineering"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Primary physical headquarters for food inspection and relief coordination.</p>
                </div>

                {/* City */}
                <div>
                  <label htmlFor="admin-city" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    City <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                    <input
                      id="admin-city"
                      type="text"
                      required
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder="e.g. Vizianagaram"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* State */}
                <div>
                  <label htmlFor="admin-state" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    State <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    id="admin-state"
                    type="text"
                    required
                    value={editForm.state}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    placeholder="e.g. Andhra Pradesh"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label htmlFor="admin-pincode" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    Pincode / Postal Code <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    id="admin-pincode"
                    type="text"
                    required
                    value={editForm.pincode}
                    onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                    placeholder="e.g. 535003"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="admin-email" className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                    Official Admin Email
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="admin@foodbridge.org"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="bg-[#22C55E] hover:bg-emerald-600 text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Personal Information</span>
                </button>
              </div>

            </form>
          </div>

        </div>
      )}

    </div>
  );
};
