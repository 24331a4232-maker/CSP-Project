import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, where, onSnapshot, doc, updateDoc, 
  writeBatch, getDocs 
} from 'firebase/firestore';
import { 
  Bell, CheckCircle2, Truck, Package, Clock, Phone, 
  Volume2, VolumeX, Check, Trash2, X, ExternalLink, 
  QrCode, AlertCircle, Sparkles, Filter, Utensils, HeartHandshake, Building
} from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Notification, Donation } from '../types';
import { soundManager } from '../lib/sound';
import toast from 'react-hot-toast';

interface NotificationCenterProps {
  onOpenQRPass?: (donationId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onOpenQRPass }) => {
  const { currentUser, userData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'NEW' | 'ASSIGNED' | 'PICKED_UP'>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);
  const knownNotifIds = useRef<Set<string>>(new Set());

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Real-time listener for user notifications
  useEffect(() => {
    if (!currentUser) return;

    // Query notifications collection
    const notifRef = collection(db, 'notifications');
    const unsubscribe = onSnapshot(notifRef, (snapshot) => {
      const items: Notification[] = [];
      const userRole = (userData?.role || '').toLowerCase();
      const currentUid = currentUser.uid;

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const item: Notification = {
          id: docSnap.id,
          donation_id: data.donation_id,
          donor_id: data.donor_id,
          volunteer_id: data.volunteer_id,
          userId: data.userId,
          targetRole: data.targetRole,
          title: data.title,
          message: data.message || '',
          type: data.type || 'SYSTEM',
          is_read: !!data.is_read,
          created_at: data.created_at || Date.now(),
          volunteer_name: data.volunteer_name,
          volunteer_phone: data.volunteer_phone,
          food_type: data.food_type,
          quantity: data.quantity,
          donor_name: data.donor_name,
        };

        // Determine visibility based on recipient role and user UID
        let shouldInclude = false;

        if (userRole === 'admin') {
          // Admins see everything
          shouldInclude = true;
        } else if (userRole === 'volunteer') {
          // Volunteers see:
          // 1. Newly created food donations broadcasted to volunteers/all
          // 2. Notifications where they are the assigned volunteer
          // 3. Broadcasts with targetRole: 'volunteer' | 'all'
          const isBroadcast = item.targetRole === 'all' || item.targetRole === 'volunteer' || item.targetRole === 'volunteers' || item.type === 'DONATION_CREATED';
          const isMyTask = (item.volunteer_id && item.volunteer_id === currentUid) || (item.userId && item.userId === currentUid);
          shouldInclude = isBroadcast || isMyTask;
        } else if (userRole === 'donor') {
          // Donors see:
          // 1. Updates specifically targeted to their donations or UID
          // 2. Direct volunteer acceptance and pickup notifications
          const isMyDonation = (item.donor_id && item.donor_id === currentUid) || (item.userId && item.userId === currentUid);
          const isDonorBroadcast = item.targetRole === 'donor' && (!item.donor_id || item.donor_id === currentUid);
          shouldInclude = isMyDonation || isDonorBroadcast;
        } else {
          shouldInclude = item.targetRole === 'all';
        }

        if (shouldInclude) {
          items.push(item);
        }
      });

      // Check for incoming new unread notifications to play chime
      if (!initialLoadRef.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as any;
            if (!knownNotifIds.current.has(change.doc.id)) {
              if (data.type === 'DONATION_CREATED' && (userRole === 'volunteer' || userRole === 'admin')) {
                soundManager.playNewDonationChime();
              } else if (data.type === 'DONATION_ASSIGNED' && userRole === 'donor') {
                soundManager.playVolunteerAcceptedChime();
              } else if (data.type === 'DONATION_PICKED_UP' || data.type === 'QR_SCANNED') {
                soundManager.playFoodPickedUpChime();
              }
            }
          }
        });
      }

      // Track known IDs
      const currentIds = new Set<string>();
      snapshot.docs.forEach(d => currentIds.add(d.id));
      knownNotifIds.current = currentIds;
      initialLoadRef.current = false;

      // Sort newest first
      items.sort((a, b) => b.created_at - a.created_at);
      setNotifications(items);
    }, (error) => {
      console.warn('Notifications onSnapshot warning:', error);
    });

    return () => unsubscribe();
  }, [currentUser, userData]);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    soundManager.setEnabled(nextState);
    toast.success(nextState ? 'Notification chimes enabled' : 'Notification chimes muted', { duration: 2500 });
  };

  const handleMarkAsRead = async (notifId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateDoc(doc(db, 'notifications', notifId), {
        is_read: true,
      });
    } catch (err) {
      console.warn('Error marking notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadList = notifications.filter(n => !n.is_read);
      if (unreadList.length === 0) return;

      const batch = writeBatch(db);
      unreadList.forEach(item => {
        batch.update(doc(db, 'notifications', item.id), { is_read: true });
      });
      await batch.commit();
      toast.success('All alerts marked as read');
    } catch (err) {
      console.warn('Error marking all read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredNotifications = notifications.filter(item => {
    if (filter === 'UNREAD') return !item.is_read;
    if (filter === 'NEW') return item.type === 'DONATION_CREATED';
    if (filter === 'ASSIGNED') return item.type === 'DONATION_ASSIGNED' || item.type === 'DONATION_ACCEPTED';
    if (filter === 'PICKED_UP') return item.type === 'DONATION_PICKED_UP' || item.type === 'QR_SCANNED';
    return true;
  });

  const formatRelativeTime = (timestamp: number) => {
    if (!timestamp) return 'Just now';
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getItemBadge = (type: string) => {
    switch (type) {
      case 'DONATION_CREATED':
        return {
          icon: <Utensils className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          title: 'New Food Donation Listed',
        };
      case 'DONATION_ASSIGNED':
      case 'DONATION_ACCEPTED':
        return {
          icon: <Truck className="w-4 h-4 text-indigo-600" />,
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
          title: 'Volunteer Assigned',
        };
      case 'DONATION_PICKED_UP':
      case 'QR_SCANNED':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          title: 'Food Picked Up',
        };
      default:
        return {
          icon: <Package className="w-4 h-4 text-gray-600" />,
          bg: 'bg-gray-50 border-gray-200 text-gray-800',
          title: 'Donation Alert',
        };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        title="Live Rescue Notifications & Alerts"
        aria-label="Notifications"
      >
        <Bell className={`w-5 h-5 transition-transform ${unreadCount > 0 ? 'text-indigo-600 animate-bounce-subtle' : ''}`} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header */}
          <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  {unreadCount > 0 ? `${unreadCount} unread update${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleSound}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 pt-2.5 pb-2 flex items-center gap-1.5 overflow-x-auto border-b border-gray-50 text-xs font-semibold">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filter === 'ALL' 
                  ? 'bg-gray-900 text-white shadow-xs' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filter === 'UNREAD' 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('NEW')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filter === 'NEW' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              New Food
            </button>
            <button
              onClick={() => setFilter('ASSIGNED')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filter === 'ASSIGNED' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setFilter('PICKED_UP')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filter === 'PICKED_UP' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Picked Up
            </button>
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-2">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-gray-800">No alerts in this view</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Real-time alerts for donations, pickups, and dispatches appear here instantly.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const badge = getItemBadge(notif.type);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id)}
                    className={`p-3.5 transition-colors cursor-pointer relative hover:bg-gray-50/80 ${
                      !notif.is_read ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    {!notif.is_read && (
                      <span className="absolute top-4 right-3 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-indigo-100" />
                    )}

                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${badge.bg}`}>
                        {badge.icon}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-gray-900 truncate">
                            {notif.title || badge.title}
                          </h4>
                          <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                            {formatRelativeTime(notif.created_at)}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Details & Actions */}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                          {notif.donor_name && (
                            <div className="inline-flex items-center gap-1 font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                              <Building className="w-3 h-3 text-gray-500" />
                              <span>Donor: {notif.donor_name}</span>
                            </div>
                          )}

                          {notif.volunteer_name && (
                            <div className="inline-flex items-center gap-1 font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                              <Truck className="w-3 h-3 text-indigo-600" />
                              <span>Volunteer: {notif.volunteer_name}</span>
                            </div>
                          )}

                          {notif.volunteer_phone && (
                            <a
                              href={`tel:${notif.volunteer_phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </a>
                          )}

                          {notif.donation_id && onOpenQRPass && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenQRPass(notif.donation_id!);
                                setIsOpen(false);
                              }}
                              className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-colors"
                            >
                              <QrCode className="w-3 h-3" />
                              <span>Show Pass</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 pt-2.5 pb-1 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Live push connected
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                }}
                className="hover:text-gray-900 font-semibold"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
