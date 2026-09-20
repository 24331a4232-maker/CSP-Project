import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Heart, LogOut, MapPin, MapPinOff, User as UserIcon, Settings, Edit3 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../hooks/useLocation';
import { UserProfileModal } from './UserProfileModal';

const Navbar = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const { sharing, setSharing } = useLocation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('last_plate_auth_token');
      localStorage.removeItem('last_plate_auth_user');
      localStorage.removeItem('foodbridge_user_role');
      sessionStorage.clear();
      await signOut(auth);
    } catch (e) {
      console.warn('Logout error:', e);
    }
    navigate('/login');
  };

  return (
    <>
      <nav className="bg-white shadow-xs border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link 
                to={currentUser && userData ? `/${userData.role.toLowerCase()}` : '/'} 
                className="flex items-center gap-2 text-indigo-600 font-bold text-xl hover:text-indigo-700 transition-colors"
              >
                <Heart className="w-6 h-6 fill-current text-emerald-600" />
                <span className="font-extrabold text-gray-900">Food<span className="text-emerald-600">Bridge</span></span>
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              {currentUser && userData ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 text-left group cursor-pointer"
                    title="Edit your profile (Saved directly to database)"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden shrink-0">
                      {userData.avatar_url ? (
                        <img 
                          src={userData.avatar_url} 
                          alt={userData.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        (userData.name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="text-xs hidden sm:block">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                        <span>{userData.name}</span>
                        <Edit3 className="w-3 h-3 text-gray-400 group-hover:text-indigo-600" />
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                        <span>{userData.role}</span>
                        {userData.username && <span className="text-indigo-600">(@{userData.username})</span>}
                      </div>
                    </div>
                  </button>
                  
                  {userData.role !== 'ADMIN' && (
                    <button
                      onClick={() => setSharing(!sharing)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        sharing 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={sharing ? "Stop sharing location" : "Share location for pickup"}
                    >
                      {sharing ? <MapPin className="w-3.5 h-3.5" /> : <MapPinOff className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{sharing ? 'Location On' : 'Location Off'}</span>
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <div className="flex gap-4">
                  <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">Login</Link>
                  <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">Register</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Global Profile Editor Modal */}
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </>
  );
};

export default Navbar;
