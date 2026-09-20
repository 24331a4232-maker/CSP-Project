import React, { useState, useEffect } from 'react';
import { X, User, Lock, Mail, Phone, Building, ShieldCheck, CheckCircle2, HeartHandshake, AlertCircle, Loader2 } from 'lucide-react';
import { UserRoleType } from '../types';
import { authenticateWithUsernameAndPassword } from '../lib/authService';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccessLogin: (role: UserRoleType, name: string, user?: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccessLogin,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRoleType>('hotel');
  
  // Registration form fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');

  // Login form fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleQuickDemoFill = (type: 'admin' | 'hotel' | 'volunteer' | 'ngo') => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setMode('login');
    if (type === 'admin') {
      setLoginIdentifier('FoodBridge');
      setLoginPassword('Food@12');
      setSelectedRole('admin');
    } else if (type === 'hotel') {
      setLoginIdentifier('grand_palace');
      setLoginPassword('Food@12');
      setSelectedRole('hotel');
    } else if (type === 'volunteer') {
      setLoginIdentifier('john_doe');
      setLoginPassword('Food@12');
      setSelectedRole('volunteer');
    } else {
      setLoginIdentifier('city_shelter');
      setLoginPassword('Food@12');
      setSelectedRole('ngo');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side validations
    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!username.trim()) {
      setErrorMessage('Username is required.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Email is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Phone number is required.');
      return;
    }
    const cleanPhoneDigits = phone.replace(/\D/g, '');
    if (cleanPhoneDigits.length < 7) {
      setErrorMessage('Please enter a valid phone number.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Password is required.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      // Check email uniqueness first
      try {
        const checkRes = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.exists) {
            setErrorMessage('This email is already registered with another account. The same email cannot register a second account with another role.');
            setIsLoading(false);
            return;
          }
        }
      } catch (checkErr) {
        console.warn('Check email error:', checkErr);
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          role: selectedRole === 'hotel' ? 'donor' : selectedRole,
          organization: orgName.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Registration failed. Please check your details.');
        setIsLoading(false);
        return;
      }

      // Success: notify user and allow login
      setSuccessMessage('Registration successful! You can now log in with your credentials.');
      setMode('login');
      setLoginIdentifier(username.trim() || email.trim());
      setLoginPassword('');
      setPassword('');
      setIsLoading(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Database network error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage('Invalid username or password.');
      return;
    }

    setIsLoading(true);

    const targetRoleUpper: 'DONOR' | 'VOLUNTEER' | 'ADMIN' =
      selectedRole === 'hotel' || selectedRole === 'ngo' ? 'DONOR' :
      selectedRole === 'volunteer' ? 'VOLUNTEER' : 'ADMIN';

    try {
      // Synchronize Firebase Auth client state with username and role check
      try {
        await authenticateWithUsernameAndPassword(loginIdentifier.trim(), loginPassword, targetRoleUpper);
      } catch (clientAuthErr: any) {
        if (clientAuthErr?.message && clientAuthErr.message.includes('Access denied')) {
          setErrorMessage(clientAuthErr.message);
          setIsLoading(false);
          return;
        }
        console.warn('Firebase client auth step noted:', clientAuthErr);
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword,
          targetRole: targetRoleUpper
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Invalid username or password.');
        setIsLoading(false);
        return;
      }

      if (data.token) {
        try {
          localStorage.setItem('last_plate_auth_token', data.token);
          localStorage.setItem('last_plate_auth_user', JSON.stringify(data.user));
          localStorage.setItem('foodbridge_user_role', targetRoleUpper);
        } catch {}
      }

      setIsLoading(false);
      const userRole = (data.user?.role === 'donor' ? 'hotel' : data.user?.role) as UserRoleType;
      onSuccessLogin(userRole || selectedRole, data.user?.fullName || data.user?.username || 'Partner User', data.user);
      onClose();
    } catch (err: any) {
      setErrorMessage('Database network error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-emerald-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="flex border-b border-gray-100 mb-5">
          <button
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`pb-3 text-sm font-bold flex-1 text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'login'
                ? 'border-[#22C55E] text-[#22C55E]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Partner Login
          </button>
          <button
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`pb-3 text-sm font-bold flex-1 text-center border-b-2 transition-colors cursor-pointer ${
              mode === 'register'
                ? 'border-[#22C55E] text-[#22C55E]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ===================== REGISTRATION FORM ===================== */}
        {mode === 'register' ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            
            {/* Role Picker */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Select Account Role:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'hotel', label: 'Hotel / Donor', icon: Building },
                  { id: 'volunteer', label: 'Volunteer', icon: HeartHandshake },
                  { id: 'admin', label: 'System Admin', icon: ShieldCheck },
                ].map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id as UserRoleType)}
                      className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-[#22C55E] text-emerald-800 shadow-2xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-600" />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Username *</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. sarah_foodrescue"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Work / Personal Email *</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="user@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 7780447031 or +1 555-0192"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Organization (Optional) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Organization / Entity (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Grand Horizon Hotel / MVGR College"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#22C55E] hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Creating Account...' : 'Register & Create Account'}</span>
            </button>

            <p className="text-center text-[11px] text-gray-500 mt-2">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className="text-[#22C55E] font-bold hover:underline cursor-pointer"
              >
                Sign in here
              </button>
            </p>
          </form>
        ) : (
          /* ===================== LOGIN FORM ===================== */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Role Portal Picker */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Select Login Portal:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'hotel', label: 'Donor Portal', icon: Building },
                  { id: 'volunteer', label: 'Volunteer', icon: HeartHandshake },
                  { id: 'admin', label: 'Admin', icon: ShieldCheck },
                ].map((r) => {
                  const Icon = r.icon;
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setSelectedRole(r.id as UserRoleType);
                        setErrorMessage(null);
                      }}
                      className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-[#22C55E] text-emerald-800 shadow-2xs'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Identifier: Username or Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Username or Email *</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="FoodBridge or admin@foodbridge.org"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quick Pre-fill Demo Links */}
            <div className="pt-1 pb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Quick Demo Login Pre-fills:
              </span>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('admin')}
                  className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg font-bold hover:bg-purple-200 cursor-pointer transition-colors"
                >
                  ⚡ Admin (FoodBridge)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('hotel')}
                  className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg font-bold hover:bg-emerald-200 cursor-pointer transition-colors"
                >
                  ⚡ Hotel (grand_palace)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoFill('volunteer')}
                  className="bg-orange-100 text-orange-800 px-2.5 py-1 rounded-lg font-bold hover:bg-orange-200 cursor-pointer transition-colors"
                >
                  ⚡ Volunteer (john_doe)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#22C55E] hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Verifying...' : 'Sign In to Portal'}</span>
            </button>

            <p className="text-center text-[11px] text-gray-500 mt-2">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
                className="text-[#22C55E] font-bold hover:underline cursor-pointer"
              >
                Register now
              </button>
            </p>

          </form>
        )}

      </div>
    </div>
  );
};
