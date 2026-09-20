import React, { useState, useMemo } from 'react';
import { 
  Database, Search, Filter, Shield, HeartHandshake, Building, Users, 
  Eye, Edit, Trash2, Download, RefreshCw, Copy, Check, ExternalLink,
  ChevronDown, ChevronUp, MapPin, Phone, Mail, Clock, Calendar, 
  CheckCircle2, XCircle, AlertTriangle, Code, UserCheck, Smartphone, 
  Truck, Award, ShieldAlert, Sparkles, X, Info
} from 'lucide-react';
import { User, AdminUser, VolunteerUser, DonorUser, Donation } from '../types';
import toast from 'react-hot-toast';

interface AdminDatabaseViewProps {
  users: Record<string, User>;
  adminsList: AdminUser[];
  volunteersList: VolunteerUser[];
  donorsList: DonorUser[];
  donations: Donation[];
  loginLogsList: any[];
  onEditUser: (user: User) => void;
  onDeleteUser: (user: { id: string; name: string; email?: string; role: string }) => void;
  onSyncTables: () => Promise<void>;
  syncingTables: boolean;
}

export const AdminDatabaseView: React.FC<AdminDatabaseViewProps> = ({
  users,
  adminsList,
  volunteersList,
  donorsList,
  donations,
  loginLogsList,
  onEditUser,
  onDeleteUser,
  onSyncTables,
  syncingTables
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'VOLUNTEER' | 'DONOR'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'NAME' | 'LAST_LOGIN'>('NEWEST');
  const [selectedUserDoc, setSelectedUserDoc] = useState<User | null>(null);
  const [docModalTab, setDocModalTab] = useState<'OVERVIEW' | 'RAW_JSON' | 'OPERATIONS' | 'AUDIT'>('OVERVIEW');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Convert users dictionary to enriched array
  const allUsersList = useMemo(() => {
    return (Object.values(users) as User[]).map(u => {
      const uDonations = donations.filter(d => d.donor_id === u.id);
      const uLogs = loginLogsList.filter(l => l.user_id === u.id || l.email === u.email || l.username === u.username);
      return {
        ...u,
        totalDonationsCount: uDonations.length,
        totalMealsProvided: uDonations.reduce((acc, d) => acc + (d.meals || 0), 0),
        recentLogsCount: uLogs.length,
      };
    });
  }, [users, donations, loginLogsList]);

  // Filtered and Sorted Users
  const filteredUsers = useMemo(() => {
    return allUsersList.filter(u => {
      // Role filter
      if (roleFilter !== 'ALL' && (u.role || '').toUpperCase() !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'ACTIVE' && u.is_active === false) return false;
      if (statusFilter === 'INACTIVE' && u.is_active !== false) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const name = (u.name || (u as any).full_name || '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        const org = (u.organization || (u as any).organization_name || '').toLowerCase();
        const city = (u.city || '').toLowerCase();
        const state = (u.state || '').toLowerCase();
        const pincode = (u.pincode || '').toLowerCase();
        const address = (u.address || '').toLowerCase();
        const uid = (u.id || (u as any).uid || '').toLowerCase();
        const role = (u.role || '').toLowerCase();

        const match = 
          name.includes(term) ||
          username.includes(term) ||
          email.includes(term) ||
          phone.includes(term) ||
          org.includes(term) ||
          city.includes(term) ||
          state.includes(term) ||
          pincode.includes(term) ||
          address.includes(term) ||
          uid.includes(term) ||
          role.includes(term);

        if (!match) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'NEWEST') {
        const timeA = typeof a.created_at === 'number' ? a.created_at : new Date(a.created_at || 0).getTime();
        const timeB = typeof b.created_at === 'number' ? b.created_at : new Date(b.created_at || 0).getTime();
        return timeB - timeA;
      }
      if (sortBy === 'OLDEST') {
        const timeA = typeof a.created_at === 'number' ? a.created_at : new Date(a.created_at || 0).getTime();
        const timeB = typeof b.created_at === 'number' ? b.created_at : new Date(b.created_at || 0).getTime();
        return timeA - timeB;
      }
      if (sortBy === 'NAME') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'LAST_LOGIN') {
        const timeA = a.last_login ? new Date(a.last_login).getTime() : 0;
        const timeB = b.last_login ? new Date(b.last_login).getTime() : 0;
        return timeB - timeA;
      }
      return 0;
    });
  }, [allUsersList, roleFilter, statusFilter, searchTerm, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = allUsersList.length;
    const admins = allUsersList.filter(u => u.role === 'ADMIN').length;
    const volunteers = allUsersList.filter(u => u.role === 'VOLUNTEER').length;
    const donors = allUsersList.filter(u => u.role === 'DONOR').length;
    const active = allUsersList.filter(u => u.is_active !== false).length;
    const inactive = allUsersList.filter(u => u.is_active === false).length;
    const online = allUsersList.filter(u => {
      if (!u.last_login) return false;
      const lastLoginTime = new Date(u.last_login).getTime();
      return (Date.now() - lastLoginTime) < 15 * 60 * 1000;
    }).length;

    return { total, admins, volunteers, donors, active, inactive, online };
  }, [allUsersList]);

  // Copy UID helper
  const handleCopyUid = (uid: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    toast.success(`Copied User UID to clipboard: ${uid}`);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  // Copy raw JSON helper
  const handleCopyRawJson = (data: any) => {
    const jsonStr = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    toast.success('Raw Firestore JSON document copied to clipboard!');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Export all users as JSON
  const handleExportJson = () => {
    const dataStr = JSON.stringify(filteredUsers, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `foodbridge_users_database_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredUsers.length} user records to JSON.`);
  };

  // Export all users as CSV
  const handleExportCsv = () => {
    const headers = [
      'UID (Doc ID)', 'Full Name', 'Username', 'Email', 'Role', 'Phone', 
      'Organization', 'Address', 'City', 'State', 'Pincode', 'Status', 
      'Created Date', 'Last Login', 'Vehicle Type', 'Availability', 'Bio'
    ];
    const rows = filteredUsers.map(u => [
      `"${u.id || ''}"`,
      `"${u.name || (u as any).full_name || ''}"`,
      `"${u.username || ''}"`,
      `"${u.email || ''}"`,
      `"${u.role || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.organization || (u as any).organization_name || ''}"`,
      `"${(u.address || '').replace(/"/g, '""')}"`,
      `"${u.city || ''}"`,
      `"${u.state || ''}"`,
      `"${u.pincode || ''}"`,
      `"${u.is_active !== false ? 'ACTIVE' : 'INACTIVE'}"`,
      `"${typeof u.created_at === 'number' ? new Date(u.created_at).toISOString() : String(u.created_at || '')}"`,
      `"${u.last_login || ''}"`,
      `"${(u as any).vehicle_type || (u as any).vehicleType || ''}"`,
      `"${(u as any).availability || (u as any).availability_status || ''}"`,
      `"${(u.bio || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `foodbridge_users_database_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredUsers.length} user records to CSV.`);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP DATABASE SYSTEM HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-200/80 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-gray-900">Firestore Users Database Explorer</h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Database Connected
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Collection: <span className="font-bold text-indigo-600">users</span> &bull; Partition Views: <span className="text-rose-600">admins</span>, <span className="text-emerald-600">volunteers</span>, <span className="text-indigo-600">donors</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onSyncTables}
            disabled={syncingTables}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-all border border-indigo-200 cursor-pointer"
            title="Re-fetch and synchronize Firestore documents"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingTables ? 'animate-spin' : ''}`} />
            <span>{syncingTables ? 'Syncing...' : 'Sync Firestore'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 cursor-pointer"
            title="Export filtered records as JSON"
          >
            <Code className="w-3.5 h-3.5 text-gray-600" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold transition-all border border-gray-200 cursor-pointer"
            title="Export filtered records as CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div 
          onClick={() => { setRoleFilter('ALL'); setStatusFilter('ALL'); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            roleFilter === 'ALL' && statusFilter === 'ALL'
              ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200 shadow-xs'
              : 'bg-white border-gray-100 hover:border-gray-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <span>Total Stored</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">In users collection</div>
        </div>

        <div 
          onClick={() => { setRoleFilter('ADMIN'); setStatusFilter('ALL'); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            roleFilter === 'ADMIN'
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-200 shadow-xs'
              : 'bg-white border-gray-100 hover:border-gray-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <span>Admins</span>
            <Shield className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{stats.admins}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Root access users</div>
        </div>

        <div 
          onClick={() => { setRoleFilter('VOLUNTEER'); setStatusFilter('ALL'); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            roleFilter === 'VOLUNTEER'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-200 shadow-xs'
              : 'bg-white border-gray-100 hover:border-gray-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <span>Volunteers</span>
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{stats.volunteers}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Field rescue drivers</div>
        </div>

        <div 
          onClick={() => { setRoleFilter('DONOR'); setStatusFilter('ALL'); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            roleFilter === 'DONOR'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-200 shadow-xs'
              : 'bg-white border-gray-100 hover:border-gray-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <span>Donors & NGOs</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-2">{stats.donors}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Food listing partners</div>
        </div>

        <div 
          onClick={() => { setStatusFilter('ACTIVE'); }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'ACTIVE'
              ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-200 shadow-xs'
              : 'bg-white border-gray-100 hover:border-gray-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <span>Active Status</span>
            <UserCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700 mt-2">{stats.active}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{stats.inactive} inactive</div>
        </div>

        <div 
          className="p-4 rounded-xl border bg-white border-gray-100 shadow-xs"
        >
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
            <span>Online Now</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{stats.online}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Active in last 15m</div>
        </div>
      </div>

      {/* 3. SEARCH, ROLE FILTERS, STATUS & SORT BAR */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200/80 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search across all user fields: Name, Username, Email, Phone, Organization, Address, City, State, UID..."
              className="w-full pl-10 pr-9 py-2.5 text-xs bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 whitespace-nowrap font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-gray-50/80 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="NEWEST">Newest Registered</option>
              <option value="OLDEST">Oldest Registered</option>
              <option value="NAME">Name (A &rarr; Z)</option>
              <option value="LAST_LOGIN">Recently Active</option>
            </select>
          </div>
        </div>

        {/* Role & Status Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium mr-1">Role:</span>
            {[
              { id: 'ALL', label: `All Roles (${stats.total})` },
              { id: 'ADMIN', label: `Admins (${stats.admins})` },
              { id: 'VOLUNTEER', label: `Volunteers (${stats.volunteers})` },
              { id: 'DONOR', label: `Donors (${stats.donors})` },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRoleFilter(r.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  roleFilter === r.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium mr-1">Status:</span>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ACTIVE', label: `Active (${stats.active})` },
              { id: 'INACTIVE', label: `Inactive (${stats.inactive})` },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === s.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}

            {(searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline ml-2 cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. MAIN USERS DATABASE TABLE */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Registered User Documents</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                {filteredUsers.length} records matching
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Direct live representation of documents stored in Firestore <code className="font-mono text-indigo-600 bg-gray-100 px-1 py-0.5 rounded">users/{'{uid}'}</code>
            </p>
          </div>

          <div className="text-xs text-gray-400 font-mono">
            Database: ai-studio-thelastplateproj-58436527-a7a3-49ec-b11b-e3171cf3e0cc
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3.5">User Identity & UID</th>
                <th className="px-4 py-3.5">Username & Email</th>
                <th className="px-4 py-3.5">Role & Access</th>
                <th className="px-4 py-3.5">Organization & Location</th>
                <th className="px-4 py-3.5">Operational Details</th>
                <th className="px-4 py-3.5">Account Status</th>
                <th className="px-4 py-3.5">Registration & Login</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <Database className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium text-gray-600">No user records match your search or filter criteria.</p>
                    <p className="text-xs text-gray-400 mt-1">Try clearing filters or changing the search keyword.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isOnline = user.last_login ? (Date.now() - new Date(user.last_login).getTime()) < 15 * 60 * 1000 : false;
                  const isExpanded = expandedRowId === user.id;
                  const isCopied = copiedUid === user.id;
                  const roleUpper = (user.role || 'DONOR').toUpperCase();

                  return (
                    <React.Fragment key={user.id}>
                      <tr 
                        onClick={() => setExpandedRowId(isExpanded ? null : user.id)}
                        className={`hover:bg-indigo-50/30 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-indigo-50/20' : ''
                        }`}
                      >
                        {/* 1. Identity & UID */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-xs ${
                                roleUpper === 'ADMIN' ? 'bg-rose-600' :
                                roleUpper === 'VOLUNTEER' ? 'bg-emerald-600' :
                                'bg-indigo-600'
                              }`}>
                                {user.avatar_url ? (
                                  <img 
                                    src={user.avatar_url} 
                                    alt={user.name} 
                                    className="w-full h-full object-cover rounded-xl"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  (user.name || 'U').charAt(0).toUpperCase()
                                )}
                              </div>
                              <span 
                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                                  isOnline ? 'bg-emerald-500' : user.is_active !== false ? 'bg-gray-300' : 'bg-rose-400'
                                }`}
                                title={isOnline ? 'Active right now' : user.is_active !== false ? 'Registered user' : 'Inactive'}
                              />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 leading-snug">{user.name || (user as any).full_name || 'User'}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200/60 max-w-[130px] truncate" title={user.id}>
                                  {user.id}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyUid(user.id, e)}
                                  className="text-gray-400 hover:text-indigo-600 p-0.5"
                                  title="Copy Document UID"
                                >
                                  {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Username & Email */}
                        <td className="px-4 py-3.5">
                          <div className="text-gray-900 font-medium text-xs">{user.email}</div>
                          {user.username && (
                            <div className="text-[11px] font-mono font-semibold text-indigo-600 mt-0.5">
                              @{user.username}
                            </div>
                          )}
                          {user.phone && (
                            <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </td>

                        {/* 3. Role & Access */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            roleUpper === 'ADMIN' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                            roleUpper === 'VOLUNTEER' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}>
                            {roleUpper === 'ADMIN' && <Shield className="w-3 h-3" />}
                            {roleUpper === 'VOLUNTEER' && <HeartHandshake className="w-3 h-3" />}
                            {roleUpper === 'DONOR' && <Building className="w-3 h-3" />}
                            <span>{roleUpper}</span>
                          </span>
                        </td>

                        {/* 4. Organization & Location */}
                        <td className="px-4 py-3.5">
                          {user.organization ? (
                            <div className="font-semibold text-xs text-gray-900">{user.organization}</div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Individual User</span>
                          )}
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {[user.city, user.state, user.pincode].filter(Boolean).join(', ') || user.address || 'Local Hub'}
                            </span>
                          </div>
                        </td>

                        {/* 5. Operational Details */}
                        <td className="px-4 py-3.5 text-xs">
                          {roleUpper === 'VOLUNTEER' && (
                            <div className="space-y-0.5">
                              <div className="text-gray-800 font-medium flex items-center gap-1">
                                <Truck className="w-3 h-3 text-emerald-600" />
                                <span>{(user as any).vehicle_type || (user as any).vehicleType || 'Motorcycle'}</span>
                              </div>
                              <div className="text-[11px] text-emerald-700 font-medium">
                                Status: {(user as any).availability || (user as any).availability_status || 'Available'}
                              </div>
                            </div>
                          )}

                          {roleUpper === 'DONOR' && (
                            <div className="space-y-0.5">
                              <div className="text-gray-800 font-medium">
                                {user.totalDonationsCount} listings posted
                              </div>
                              {user.totalMealsProvided > 0 && (
                                <div className="text-[11px] text-amber-700 font-medium">
                                  ~{user.totalMealsProvided} meals donated
                                </div>
                              )}
                            </div>
                          )}

                          {roleUpper === 'ADMIN' && (
                            <div className="text-rose-700 font-medium text-[11px]">
                              Full Root Permissions
                            </div>
                          )}
                        </td>

                        {/* 6. Account Status */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                            user.is_active !== false 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {user.is_active !== false ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                <span>Inactive</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* 7. Registration & Login */}
                        <td className="px-4 py-3.5 text-xs text-gray-500">
                          <div>
                            <span className="text-gray-400">Joined: </span>
                            <span className="text-gray-700 font-medium">
                              {typeof user.created_at === 'number' 
                                ? new Date(user.created_at).toLocaleDateString()
                                : String(user.created_at || '').slice(0, 10)}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            {user.last_login 
                              ? `Active ${new Date(user.last_login).toLocaleDateString()}` 
                              : 'No login recorded'}
                          </div>
                        </td>

                        {/* 8. Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUserDoc(user);
                                setDocModalTab('OVERVIEW');
                              }}
                              className="p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-600 transition-colors"
                              title="Inspect Full Firestore Document & Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditUser(user);
                              }}
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
                              title="Edit User in Firestore users/{uid}"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteUser({
                                  id: user.id,
                                  name: user.name || (user as any).full_name || 'User',
                                  email: user.email,
                                  role: user.role
                                });
                              }}
                              className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-600 transition-colors"
                              title="Permanently Delete User from Database"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRowId(isExpanded ? null : user.id);
                              }}
                              className="p-1 hover:bg-gray-100 rounded text-gray-400"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Accordion with Complete In-line Document Information */}
                      {isExpanded && (
                        <tr className="bg-gray-50/70 border-b border-gray-200">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                              {/* Card 1: Identity & Credentials */}
                              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2">
                                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-1.5 flex items-center justify-between">
                                  <span>Identity & Keys</span>
                                  <span className="font-mono text-indigo-600">{user.role}</span>
                                </h4>
                                <div><span className="text-gray-400">UID:</span> <span className="font-mono font-bold text-gray-800 break-all">{user.id}</span></div>
                                <div><span className="text-gray-400">Full Name:</span> <span className="text-gray-900 font-semibold">{user.name}</span></div>
                                <div><span className="text-gray-400">Username:</span> <span className="font-mono font-bold text-indigo-700">@{user.username || 'user'}</span></div>
                                <div><span className="text-gray-400">Email:</span> <span className="text-gray-800 break-all">{user.email}</span></div>
                                <div><span className="text-gray-400">Phone:</span> <span className="text-gray-800">{user.phone || 'N/A'}</span></div>
                              </div>

                              {/* Card 2: Organization & Location */}
                              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2">
                                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-1.5">
                                  Organization & Address
                                </h4>
                                <div><span className="text-gray-400">Entity:</span> <span className="text-gray-800 font-semibold">{user.organization || 'Independent'}</span></div>
                                <div><span className="text-gray-400">Street Address:</span> <span className="text-gray-800">{user.address || 'N/A'}</span></div>
                                <div><span className="text-gray-400">City / State:</span> <span className="text-gray-800">{[user.city, user.state].filter(Boolean).join(', ') || 'Vizianagaram'}</span></div>
                                <div><span className="text-gray-400">Pincode:</span> <span className="font-mono text-gray-800">{user.pincode || '535003'}</span></div>
                                {user.bio && <div><span className="text-gray-400">Bio:</span> <span className="text-gray-700 italic">{user.bio}</span></div>}
                              </div>

                              {/* Card 3: Role-Specific Operational Attributes */}
                              <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2">
                                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-1.5">
                                  Role Metadata
                                </h4>
                                {roleUpper === 'VOLUNTEER' && (
                                  <>
                                    <div><span className="text-gray-400">Vehicle:</span> <span className="text-emerald-800 font-semibold">{(user as any).vehicle_type || 'Motorcycle'}</span></div>
                                    <div><span className="text-gray-400">Availability:</span> <span className="text-gray-800">{(user as any).availability || 'Available'}</span></div>
                                    <div><span className="text-gray-400">Total Deliveries:</span> <span className="font-bold text-gray-800">{(user as any).total_deliveries || 0}</span></div>
                                    <div><span className="text-gray-400">Hours Served:</span> <span className="font-bold text-gray-800">{(user as any).hours_served || 0} hrs</span></div>
                                  </>
                                )}

                                {roleUpper === 'DONOR' && (
                                  <>
                                    <div><span className="text-gray-400">Donations Posted:</span> <span className="font-bold text-indigo-700">{user.totalDonationsCount}</span></div>
                                    <div><span className="text-gray-400">Total Meals:</span> <span className="font-bold text-amber-700">~{user.totalMealsProvided}</span></div>
                                    <div><span className="text-gray-400">Donor Category:</span> <span className="text-gray-800">{user.organization ? 'Business / Partner' : 'Individual'}</span></div>
                                  </>
                                )}

                                {roleUpper === 'ADMIN' && (
                                  <>
                                    <div><span className="text-gray-400">Security Access:</span> <span className="text-rose-700 font-bold">Full Admin Console</span></div>
                                    <div><span className="text-gray-400">Audit Privilege:</span> <span className="text-gray-800">Enabled</span></div>
                                    <div><span className="text-gray-400">User Management:</span> <span className="text-gray-800">Read / Write / Delete</span></div>
                                  </>
                                )}
                              </div>

                              {/* Card 4: Database Actions */}
                              <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
                                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] border-b pb-1.5">
                                  Quick Controls
                                </h4>
                                <div className="space-y-2 my-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedUserDoc(user);
                                      setDocModalTab('RAW_JSON');
                                    }}
                                    className="w-full py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                                  >
                                    <Code className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>View Raw Firestore JSON</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onEditUser(user)}
                                    className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-indigo-200"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>Edit User Attributes</span>
                                  </button>
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono text-center">
                                  Path: users/{user.id}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. FULL USER DOCUMENT INSPECTOR MODAL */}
      {selectedUserDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-gray-200 overflow-hidden animate-fadeIn my-8">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-gray-900 via-slate-900 to-indigo-950 text-white flex justify-between items-start">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md ${
                  selectedUserDoc.role === 'ADMIN' ? 'bg-rose-600' :
                  selectedUserDoc.role === 'VOLUNTEER' ? 'bg-emerald-600' :
                  'bg-indigo-600'
                }`}>
                  {selectedUserDoc.avatar_url ? (
                    <img 
                      src={selectedUserDoc.avatar_url} 
                      alt={selectedUserDoc.name} 
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    (selectedUserDoc.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{selectedUserDoc.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      selectedUserDoc.role === 'ADMIN' ? 'bg-rose-500/30 text-rose-300 border border-rose-400/40' :
                      selectedUserDoc.role === 'VOLUNTEER' ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40' :
                      'bg-indigo-500/30 text-indigo-300 border border-indigo-400/40'
                    }`}>
                      {selectedUserDoc.role}
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 flex items-center gap-2 mt-1">
                    <span>{selectedUserDoc.email}</span>
                    {selectedUserDoc.username && <span className="font-mono text-indigo-300">@{selectedUserDoc.username}</span>}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserDoc(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="border-b border-gray-200 bg-gray-50/80 px-6 flex space-x-6">
              {[
                { id: 'OVERVIEW', label: 'User Overview', icon: Users },
                { id: 'RAW_JSON', label: 'Firestore Document (Raw JSON)', icon: Code },
                { id: 'OPERATIONS', label: 'Role & Operations', icon: Truck },
              ].map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setDocModalTab(t.id as any)}
                    className={`py-3.5 font-medium text-xs border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                      docModalTab === t.id
                        ? 'border-indigo-600 text-indigo-600 font-bold'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {docModalTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  {/* Document Location Banner */}
                  <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-indigo-900">Firestore Document Location</div>
                      <div className="text-xs font-mono text-indigo-700 mt-0.5">
                        ai-studio-thelastplateproj-58436527-a7a3-49ec-b11b-e3171cf3e0cc / users / {selectedUserDoc.id}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyUid(selectedUserDoc.id)}
                      className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                    >
                      {copiedUid === selectedUserDoc.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUid === selectedUserDoc.id ? 'Copied!' : 'Copy UID'}</span>
                    </button>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2.5">
                      <div className="font-bold text-gray-900 border-b pb-1">Personal & Account Details</div>
                      <div><span className="text-gray-500">Document ID:</span> <span className="font-mono font-semibold text-gray-800">{selectedUserDoc.id}</span></div>
                      <div><span className="text-gray-500">Full Name:</span> <span className="font-semibold text-gray-800">{selectedUserDoc.name}</span></div>
                      <div><span className="text-gray-500">Username:</span> <span className="font-mono text-indigo-600">@{selectedUserDoc.username || 'user'}</span></div>
                      <div><span className="text-gray-500">Email:</span> <span className="text-gray-800">{selectedUserDoc.email}</span></div>
                      <div><span className="text-gray-500">Phone:</span> <span className="text-gray-800">{selectedUserDoc.phone || 'None'}</span></div>
                      <div><span className="text-gray-500">Account Status:</span> <span className="font-bold text-emerald-700">{selectedUserDoc.is_active !== false ? 'ACTIVE' : 'INACTIVE'}</span></div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl space-y-2.5">
                      <div className="font-bold text-gray-900 border-b pb-1">Address & Organization</div>
                      <div><span className="text-gray-500">Organization:</span> <span className="font-semibold text-gray-800">{selectedUserDoc.organization || 'Independent'}</span></div>
                      <div><span className="text-gray-500">Street Address:</span> <span className="text-gray-800">{selectedUserDoc.address || 'N/A'}</span></div>
                      <div><span className="text-gray-500">City:</span> <span className="text-gray-800">{selectedUserDoc.city || 'Vizianagaram'}</span></div>
                      <div><span className="text-gray-500">State:</span> <span className="text-gray-800">{selectedUserDoc.state || 'Andhra Pradesh'}</span></div>
                      <div><span className="text-gray-500">Pincode:</span> <span className="font-mono text-gray-800">{selectedUserDoc.pincode || '535003'}</span></div>
                      {selectedUserDoc.bio && <div><span className="text-gray-500">Bio:</span> <span className="text-gray-700">{selectedUserDoc.bio}</span></div>}
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="bg-gray-50 p-4 rounded-xl text-xs space-y-2">
                    <div className="font-bold text-gray-900 border-b pb-1">Timestamps & Audit Markers</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-500">Account Created:</span>{' '}
                        <span className="font-medium text-gray-800">
                          {typeof selectedUserDoc.created_at === 'number' 
                            ? new Date(selectedUserDoc.created_at).toLocaleString() 
                            : String(selectedUserDoc.created_at || 'N/A')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Last Login:</span>{' '}
                        <span className="font-medium text-gray-800">
                          {selectedUserDoc.last_login 
                            ? new Date(selectedUserDoc.last_login).toLocaleString() 
                            : 'None recorded'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {docModalTab === 'RAW_JSON' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-gray-900 text-gray-300 px-4 py-2 rounded-t-xl text-xs font-mono">
                    <span>users/{selectedUserDoc.id}.json</span>
                    <button
                      onClick={() => handleCopyRawJson(selectedUserDoc)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedJson ? 'Copied JSON!' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  <pre className="bg-gray-950 text-emerald-400 p-4 rounded-b-xl text-xs font-mono overflow-x-auto border border-gray-900 max-h-96 leading-relaxed">
                    {JSON.stringify(selectedUserDoc, null, 2)}
                  </pre>
                </div>
              )}

              {docModalTab === 'OPERATIONS' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                    <h4 className="font-bold text-gray-900 text-sm">Role-Specific Data Schema</h4>
                    {selectedUserDoc.role === 'VOLUNTEER' && (
                      <div className="space-y-2">
                        <p className="text-gray-600">Assigned partition table: <code className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">volunteers/{selectedUserDoc.id}</code></p>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="p-3 bg-white rounded-lg border">
                            <span className="text-gray-400 block">Vehicle Type</span>
                            <span className="font-bold text-gray-900">{(selectedUserDoc as any).vehicle_type || 'Motorcycle'}</span>
                          </div>
                          <div className="p-3 bg-white rounded-lg border">
                            <span className="text-gray-400 block">Availability</span>
                            <span className="font-bold text-emerald-700">{(selectedUserDoc as any).availability || 'Available'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedUserDoc.role === 'DONOR' && (
                      <div className="space-y-2">
                        <p className="text-gray-600">Assigned partition table: <code className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">donors/{selectedUserDoc.id}</code></p>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="p-3 bg-white rounded-lg border">
                            <span className="text-gray-400 block">Donation Items</span>
                            <span className="font-bold text-indigo-700">{donations.filter(d => d.donor_id === selectedUserDoc.id).length} items listed</span>
                          </div>
                          <div className="p-3 bg-white rounded-lg border">
                            <span className="text-gray-400 block">Impact Total</span>
                            <span className="font-bold text-amber-700">~{donations.filter(d => d.donor_id === selectedUserDoc.id).reduce((acc, d) => acc + (d.meals || 0), 0)} meals</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedUserDoc.role === 'ADMIN' && (
                      <div className="space-y-2">
                        <p className="text-gray-600">Assigned partition table: <code className="font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">admins/{selectedUserDoc.id}</code></p>
                        <div className="p-3 bg-white rounded-lg border">
                          <span className="text-gray-400 block mb-1">Granted Privileges</span>
                          <div className="flex flex-wrap gap-1">
                            {['system_admin', 'manage_donations', 'manage_volunteers', 'manage_donors', 'view_analytics', 'access_audit_logs'].map((p, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-50 text-rose-800 border border-rose-100">
                                ✓ {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <div className="text-xs text-gray-500 font-mono">
                UID: {selectedUserDoc.id}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const u = selectedUserDoc;
                    setSelectedUserDoc(null);
                    onEditUser(u);
                  }}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors border border-indigo-200"
                >
                  Edit Profile
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedUserDoc(null)}
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
