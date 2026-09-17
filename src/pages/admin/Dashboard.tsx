import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Users, Package, Clock, CheckCircle, Bell, Search, Map as MapIcon, Activity } from 'lucide-react';
import { db } from '../../lib/firebase';
import { Donation, Location, User, Notification } from '../../types';
import LiveMap from '../../components/Map';

const AdminDashboard = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [locations, setLocations] = useState<Location[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'ACTIVITY'>('OVERVIEW');

  useEffect(() => {
    // Fetch Users & Profiles
    let currentUsers: Record<string, any> = {};
    let currentProfiles: Record<string, any> = {};

    const updateUsersState = () => {
      const merged: Record<string, User> = {};
      const allIds = new Set([...Object.keys(currentUsers), ...Object.keys(currentProfiles)]);
      allIds.forEach(id => {
        let rawDate = currentUsers[id]?.created_at || currentProfiles[id]?.created_at || Date.now();
        if (typeof rawDate === 'string') {
          rawDate = new Date(rawDate).getTime();
        }
        
        merged[id] = {
          ...(currentUsers[id] || {}),
          ...(currentProfiles[id] || {}),
          id,
          // ensure name is prioritized
          name: currentUsers[id]?.name || currentProfiles[id]?.full_name || currentProfiles[id]?.fullName || 'Unknown',
          role: currentUsers[id]?.role || (currentProfiles[id]?.role ? currentProfiles[id].role.toUpperCase() : 'DONOR'),
          email: currentUsers[id]?.email || currentProfiles[id]?.email || '',
          created_at: rawDate,
        } as User;
      });
      setUsers(merged);
    };

    const unUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      currentUsers = {};
      snapshot.forEach(doc => {
        currentUsers[doc.id] = doc.data();
      });
      updateUsersState();
    });

    const unProfiles = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      currentProfiles = {};
      snapshot.forEach(doc => {
        currentProfiles[doc.id] = doc.data();
      });
      updateUsersState();
    });

    // Fetch Donations
    const unDonations = onSnapshot(query(collection(db, 'donations'), orderBy('created_at', 'desc')), (snapshot) => {
      setDonations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation)));
      setLoading(false);
    });

    // Fetch Locations
    const unLocations = onSnapshot(collection(db, 'locations'), (snapshot) => {
      const locs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
      setLocations(locs.filter(l => l.sharing_enabled)); // Only show sharing users
    });

    // Fetch Notifications
    const unNotifs = onSnapshot(query(collection(db, 'notifications'), orderBy('created_at', 'desc')), (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    });

    return () => {
      unUsers();
      unProfiles();
      unDonations();
      unLocations();
      unNotifs();
    };
  }, []);

  const stats = {
    donors: Object.values(users).filter(u => u.role === 'DONOR').length,
    volunteers: Object.values(users).filter(u => u.role === 'VOLUNTEER').length,
    active: donations.filter(d => d.status === 'ASSIGNED').length,
    pending: donations.filter(d => d.status === 'PENDING').length,
    picked_up: donations.filter(d => d.status === 'PICKED_UP').length,
    completed: donations.filter(d => d.status === 'COMPLETED').length,
  };

  const filteredDonations = donations.filter(d => 
    d.food_type.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activityEvents = useMemo(() => {
    const events: any[] = [];
    
    // User Joins
    Object.values(users).forEach(u => {
      events.push({
        id: `user_${u.id}`,
        type: 'USER_REGISTRATION',
        title: 'New User Registration',
        message: `${u.name} joined the platform as a ${u.role}.`,
        timestamp: u.created_at,
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      });
    });

    // Notifications (QR scans mostly)
    notifications.forEach(n => {
      events.push({
        id: `notif_${n.id}`,
        type: 'SYSTEM_NOTIFICATION',
        title: 'System Event',
        message: n.message,
        timestamp: n.created_at,
        icon: Bell,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100'
      });
    });

    // Donations Created
    donations.forEach(d => {
      events.push({
        id: `donation_${d.id}_created`,
        type: 'DONATION_CREATED',
        title: 'Donation Created',
        message: `A new donation of ${d.food_type} was listed.`,
        timestamp: d.created_at,
        icon: Package,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      });
      
      if (d.status === 'COMPLETED' && d.scanned_at) {
        events.push({
          id: `donation_${d.id}_completed`,
          type: 'DONATION_COMPLETED',
          title: 'Donation Completed',
          message: `Donation ${d.id.slice(0, 6)} was successfully completed.`,
          timestamp: d.scanned_at,
          icon: CheckCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        });
      }
    });

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }, [users, notifications, donations]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of food donation activities</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['OVERVIEW', 'USERS', 'ACTIVITY'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'OVERVIEW' && 'Overview'}
              {tab === 'USERS' && 'User Management'}
              {tab === 'ACTIVITY' && 'Activity Log'}
            </button>
          ))}
        </nav>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Donors', value: stats.donors, icon: Users, color: 'text-indigo-600' },
          { label: 'Volunteers', value: stats.volunteers, icon: Users, color: 'text-indigo-600' },
          { label: 'Active', value: stats.active, icon: Package, color: 'text-blue-600' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-600' },
          { label: 'Picked Up', value: stats.picked_up, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-gray-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <stat.icon className={`w-6 h-6 mb-2 ${stat.color}`} />
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-8">
            {/* Live Map */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-indigo-600" />
              Live Location Tracking
            </h2>
            <LiveMap locations={locations} users={users} />
          </div>

          {/* Donations Table */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">Donation Management</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search donations..."
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 w-64"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">ID</th>
                    <th className="px-4 py-3">Food & Qty</th>
                    <th className="px-4 py-3">Donor</th>
                    <th className="px-4 py-3">Volunteer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 rounded-r-lg">Scan Time</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center">
                        <div className="flex flex-col gap-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-10 bg-gray-100 rounded-md animate-pulse w-full"></div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : filteredDonations.map(donation => (
                    <tr key={donation.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{donation.id.slice(0, 6)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{donation.food_type}</div>
                        <div className="text-xs">{donation.quantity}</div>
                      </td>
                      <td className="px-4 py-3">{users[donation.donor_id]?.name || 'Unknown'}</td>
                      <td className="px-4 py-3">{donation.volunteer_id ? (users[donation.volunteer_id]?.name || 'Unknown') : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          donation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          donation.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {donation.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {donation.scanned_at ? new Date(donation.scanned_at).toLocaleTimeString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Notifications Panel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            Activity Feed
          </h2>
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              notifications.map(notif => (
                <div key={notif.id} className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100">
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-medium leading-snug">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      )}

      {activeTab === 'USERS' && (
        <div className="space-y-8">
          {/* User Management Table */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">User Management</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Name</th>
                    <th className="px-4 py-3">Email & Username</th>
                    <th className="px-4 py-3">Organization & Location</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center">
                        <div className="flex flex-col gap-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="h-10 bg-gray-100 rounded-md animate-pulse w-full"></div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : Object.values(users).sort((a, b) => b.created_at - a.created_at).map(user => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {user.name}
                        {user.phone && <div className="text-xs text-gray-500 font-normal">{user.phone}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div>{user.email}</div>
                        {user.username && <div className="text-xs text-gray-500">@{user.username}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {user.organization ? <div className="font-medium text-gray-900">{user.organization}</div> : <span className="text-gray-400 italic">No organization</span>}
                        {(user.city || user.state) && (
                          <div className="text-xs text-gray-500">
                            {[user.city, user.state, user.pincode].filter(Boolean).join(', ')}
                          </div>
                        )}
                        {user.address && <div className="text-[10px] text-gray-400 truncate max-w-[200px]" title={user.address}>{user.address}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                          user.role === 'DONOR' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ACTIVITY' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Detailed Activity Log
            </h2>
          </div>
          <div className="p-6">
            <div className="relative border-l-2 border-gray-100 ml-4 space-y-8">
              {activityEvents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No activity recorded yet</div>
              ) : (
                activityEvents.map((event, index) => (
                  <div key={`${event.id}_${index}`} className="relative pl-8">
                    <div className={`absolute -left-[21px] top-1 p-2 rounded-full ${event.bgColor} border-4 border-white shadow-sm`}>
                      <event.icon className={`w-4 h-4 ${event.color}`} />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-gray-900">{event.title}</h4>
                        <time className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                          {new Date(event.timestamp).toLocaleString()}
                        </time>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{event.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
