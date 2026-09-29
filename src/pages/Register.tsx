import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { auth, db } from '../lib/firebase';
import { Heart, User, AtSign, Mail, Lock, Eye, EyeOff, Shield, Building, Users } from 'lucide-react';
import { recordLoginActivity, PRESET_ACCOUNTS } from '../lib/authService';
import { identifyRoleAndRedirectOnLogin, getDashboardPathForRole } from '../lib/roleHelper';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const initialRoleParam = (searchParams.get('role') || '').toUpperCase();
  const defaultRole: 'ADMIN' | 'DONOR' | 'VOLUNTEER' = 
    initialRoleParam === 'ADMIN' ? 'ADMIN' :
    initialRoleParam === 'DONOR' ? 'DONOR' :
    initialRoleParam === 'VOLUNTEER' ? 'VOLUNTEER' : 'DONOR';

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'ADMIN' | 'DONOR' | 'VOLUNTEER'>(defaultRole);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // If user is already authenticated, route them directly to their registered dashboard
  useEffect(() => {
    if (currentUser && !authLoading) {
      identifyRoleAndRedirectOnLogin({
        user: currentUser,
        userData,
        navigate,
        options: { replace: true }
      });
    }
  }, [currentUser, userData, authLoading, navigate]);

  useEffect(() => {
    if (initialRoleParam === 'ADMIN' || initialRoleParam === 'DONOR' || initialRoleParam === 'VOLUNTEER') {
      setRole(initialRoleParam as 'ADMIN' | 'DONOR' | 'VOLUNTEER');
    }
  }, [initialRoleParam]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const rawUsername = username.trim() || cleanEmail.split('@')[0];
    const cleanUsername = rawUsername.replace(/\s+/g, '_').toLowerCase();

    if (!cleanName) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!cleanEmail) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      // 1. Comprehensive Email Uniqueness Check across all roles and presets
      const presetEmails = [
        'srikar.srikar0906@gmail.com',
        'admin@foodbridge.org',
        'john.volunteer@foodbridge.org',
        'catering@grandpalace.com',
        'contact@lumiere.com',
        'contact@cityshelter.org'
      ];
      if (presetEmails.includes(cleanEmail) || Object.values(PRESET_ACCOUNTS).some(p => p.email.toLowerCase() === cleanEmail)) {
        toast.error('This email is already registered with another account. The same email cannot register a second account with another role.');
        setLoading(false);
        return;
      }

      // Check server check-email endpoint
      try {
        const checkRes = await fetch(`/api/auth/check-email?email=${encodeURIComponent(cleanEmail)}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.exists) {
            toast.error('This email is already registered with another account. The same email cannot register a second account with another role.');
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Server check-email query error:', err);
      }

      // Check Firestore users collection for email (single source of truth)
      try {
        const emailSnap = await getDocs(query(collection(db, 'users'), where('email', '==', cleanEmail)));
        if (!emailSnap.empty) {
          toast.error('This email is already registered with another account. The same email cannot register a second account with another role.');
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Query users for email uniqueness failed:', e);
      }

      // 2. Check if username is already taken in preset accounts or Firestore users collection
      if (PRESET_ACCOUNTS[cleanUsername]) {
        toast.error(`The username "${cleanUsername}" is reserved. Please choose another username.`);
        setLoading(false);
        return;
      }

      try {
        const userSnap = await getDocs(query(collection(db, 'users'), where('username', '==', cleanUsername)));
        if (!userSnap.empty) {
          toast.error(`The username "${cleanUsername}" is already in use. Please select a different username.`);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Query users for username uniqueness failed:', e);
      }

      // Set in-flight registration role so AuthContext assigns the correct role immediately
      sessionStorage.setItem('pending_reg_role', role);
      localStorage.setItem('foodbridge_user_role', role);

      // 3. Create user with Firebase Auth
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      } catch (authErr: any) {
        sessionStorage.removeItem('pending_reg_role');
        if (authErr.code === 'auth/email-already-in-use') {
          toast.error('This email is already registered with another account. The same email cannot register a second account with another role.');
          setLoading(false);
          return;
        }
        throw authErr;
      }
      
      const uid = userCredential.user.uid;
      const nowMs = Date.now();
      const nowIso = new Date().toISOString();
      const baseUserData = {
        id: uid,
        uid: uid,
        name: cleanName,
        full_name: cleanName,
        email: cleanEmail,
        username: cleanUsername,
        username_lower: cleanUsername.toLowerCase(),
        user_name: cleanUsername,
        role,
        is_active: true,
        created_at: nowMs,
        last_login: nowIso
      };

      // Firestore "users" is the single source of truth for every registered user
      await setDoc(doc(db, 'users', uid), baseUserData);

      // Also create role-partitioned document for high-performance direct queries
      if (role === 'DONOR') {
        await setDoc(doc(db, 'donors', uid), baseUserData, { merge: true }).catch(() => {});
      } else if (role === 'VOLUNTEER') {
        await setDoc(doc(db, 'volunteers', uid), baseUserData, { merge: true }).catch(() => {});
      } else if (role === 'ADMIN') {
        await setDoc(doc(db, 'admins', uid), baseUserData, { merge: true }).catch(() => {});
      }

      // Record audit registration activity
      await recordLoginActivity({
        userId: uid,
        username: cleanUsername,
        fullName: cleanName,
        email: cleanEmail,
        role,
        status: 'SUCCESS',
        action: 'ACCOUNT_REGISTRATION'
      });

      // Synchronize with server-side profile endpoint in background
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanName,
          username: cleanUsername,
          email: cleanEmail,
          password,
          role: role.toLowerCase()
        })
      }).catch(() => {});
      
      sessionStorage.removeItem('pending_reg_role');
      toast.success(`Account created! Welcome, ${cleanUsername}.`);
      navigate(getDashboardPathForRole(role), { replace: true });
    } catch (error: any) {
      sessionStorage.removeItem('pending_reg_role');
      if (error?.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered with another account. The same email cannot register a second account with another role.');
      } else {
        toast.error(error.message || 'Failed to register');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-4 sm:py-8 px-4 w-full">
      <div className="w-full max-w-md bg-white py-8 px-8 sm:px-10 shadow-xl rounded-2xl border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-indigo-600 fill-current" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Create an Account</h2>
        <p className="text-center text-xs text-gray-500 mb-6">
          Join The Last Plate Project to bridge surplus food with communities in need
        </p>
        
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="e.g. John Alexander"
                className="block w-full pl-10 pr-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Username <span className="text-gray-400 font-normal lowercase">(used to log in)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <AtSign className="w-4 h-4" />
              </div>
              <input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="e.g. foodhero or captain_alex"
                className="block w-full pl-10 pr-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              You can log into your account using this username.
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="block w-full pl-10 pr-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Select Account Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="register-role-admin"
                onClick={() => setRole('ADMIN')}
                className={`py-2 px-2 border rounded-xl text-xs font-semibold cursor-pointer transition-all flex flex-col items-center gap-1 ${
                  role === 'ADMIN'
                    ? 'bg-purple-50 border-purple-600 text-purple-700 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold opacity-75">1.</span>
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <span>Admin</span>
              </button>

              <button
                type="button"
                id="register-role-donor"
                onClick={() => setRole('DONOR')}
                className={`py-2 px-2 border rounded-xl text-xs font-semibold cursor-pointer transition-all flex flex-col items-center gap-1 ${
                  role === 'DONOR'
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold opacity-75">2.</span>
                  <Building className="w-3.5 h-3.5" />
                </div>
                <span>Donor</span>
              </button>

              <button
                type="button"
                id="register-role-volunteer"
                onClick={() => setRole('VOLUNTEER')}
                className={`py-2 px-2 border rounded-xl text-xs font-semibold cursor-pointer transition-all flex flex-col items-center gap-1 ${
                  role === 'VOLUNTEER'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold opacity-75">3.</span>
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span>Volunteer</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 mt-5 shadow-sm cursor-pointer transition-all"
          >
            {loading ? 'Creating account...' : 'Create Account with Username'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign in with your username
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
