import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Heart, LogOut, MapPin, MapPinOff } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../hooks/useLocation';

const Navbar = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const { sharing, setSharing } = useLocation();

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
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
              <Heart className="w-6 h-6 fill-current" />
              <span>SharePlate</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {currentUser && userData ? (
              <>
                <div className="text-sm hidden sm:block">
                  <span className="text-gray-500">Welcome, </span>
                  <span className="font-medium">{userData.name}</span>
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {userData.role}
                  </span>
                </div>
                
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
                    {sharing ? 'Location On' : 'Location Off'}
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
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
  );
};

export default Navbar;
