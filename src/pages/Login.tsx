import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, User, Lock, Eye, EyeOff, Shield, Users, Building, ArrowRight } from 'lucide-react';
import { authenticateWithUsernameAndPassword } from '../lib/authService';

const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRoleParam = (searchParams.get('role') || '').toUpperCase();
  const defaultRole: 'DONOR' | 'VOLUNTEER' | 'ADMIN' = 
    initialRoleParam === 'VOLUNTEER' ? 'VOLUNTEER' :
    initialRoleParam === 'ADMIN' ? 'ADMIN' : 'DONOR';

  const [selectedRole, setSelectedRole] = useState<'DONOR' | 'VOLUNTEER' | 'ADMIN'>(defaultRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialRoleParam === 'VOLUNTEER' || initialRoleParam === 'DONOR' || initialRoleParam === 'ADMIN') {
      setSelectedRole(initialRoleParam);
    }
  }, [initialRoleParam]);

  const handleRoleChange = (role: 'DONOR' | 'VOLUNTEER' | 'ADMIN') => {
    setSelectedRole(role);
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      toast.error('Please enter your username or email address.');
      return;
    }
    if (!password) {
      toast.error('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const result = await authenticateWithUsernameAndPassword(cleanId, password, selectedRole);
      toast.success(`Welcome back, ${result.username}! Signed in as ${result.role}.`);
      navigate(`/${result.role.toLowerCase()}`);
    } catch (error: any) {
      const msg = error.message || 'Failed to sign in. Please verify your credentials.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (user: string, pass: string, role: 'DONOR' | 'VOLUNTEER' | 'ADMIN') => {
    setSelectedRole(role);
    setIdentifier(user);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-md mx-auto mt-10 mb-16 px-4">
      <div className="bg-white py-8 px-8 sm:px-10 shadow-xl rounded-2xl border border-gray-100">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center shadow-xs mb-3">
            <Heart className="w-7 h-7 text-indigo-600 fill-indigo-600/20" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="text-sm text-gray-500 mt-1">
            Choose your portal and sign in with your credentials
          </p>
        </div>

        {/* Portal / Role Tabs */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 text-center">
            Select Login Portal
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100/80 rounded-xl">
            <button
              type="button"
              id="login-tab-donor"
              onClick={() => handleRoleChange('DONOR')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedRole === 'DONOR'
                  ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <Building className="w-3.5 h-3.5 shrink-0" />
              <span>Donor</span>
            </button>
            <button
              type="button"
              id="login-tab-volunteer"
              onClick={() => handleRoleChange('VOLUNTEER')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedRole === 'VOLUNTEER'
                  ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Volunteer</span>
            </button>
            <button
              type="button"
              id="login-tab-admin"
              onClick={() => handleRoleChange('ADMIN')}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedRole === 'ADMIN'
                  ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>Admin</span>
            </button>
          </div>
          <div className="text-[11px] text-gray-400 text-center mt-1.5">
            Role isolation is enforced: credentials must match the selected portal.
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs leading-relaxed flex items-start gap-2.5">
            <span className="shrink-0 font-bold text-rose-600 mt-0.5">!</span>
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Username or Email Field */}
          <div>
            <label 
              htmlFor="login-identifier" 
              className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5"
            >
              Username or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="login-identifier"
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="e.g. FoodBridge or user@example.com"
                className="block w-full pl-10 pr-3.5 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <span className="text-[11px] text-gray-500 mt-1 block">
              You can log in directly using your registered username.
            </span>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label 
                htmlFor="login-password" 
                className="block text-xs font-bold uppercase tracking-wider text-gray-700"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                className="block w-full pl-10 pr-10 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer transition-all mt-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign in with Credentials</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5 text-center">
            Quick Test Demo Accounts
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('FoodBridge', 'Food@12', 'ADMIN')}
              className="p-2 border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 rounded-xl text-left transition-colors flex flex-col items-center text-center cursor-pointer"
            >
              <Shield className="w-4 h-4 text-purple-700 mb-1" />
              <span className="text-xs font-bold text-purple-900 font-mono">FoodBridge</span>
              <span className="text-[10px] text-purple-600 font-semibold uppercase">Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('john_doe', 'Food@12', 'VOLUNTEER')}
              className="p-2 border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 rounded-xl text-left transition-colors flex flex-col items-center text-center cursor-pointer"
            >
              <Users className="w-4 h-4 text-emerald-700 mb-1" />
              <span className="text-xs font-bold text-emerald-900 font-mono">john_doe</span>
              <span className="text-[10px] text-emerald-600 font-semibold uppercase">Volunteer</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('grand_palace', 'Food@12', 'DONOR')}
              className="p-2 border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 rounded-xl text-left transition-colors flex flex-col items-center text-center cursor-pointer"
            >
              <Building className="w-4 h-4 text-blue-700 mb-1" />
              <span className="text-xs font-bold text-blue-900 font-mono">grand_palace</span>
              <span className="text-[10px] text-blue-600 font-semibold uppercase">Donor</span>
            </button>
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-2">
            Click any demo card to prefill username & password (<code className="text-gray-600 font-mono">Food@12</code>)
          </p>
        </div>
        
        {/* Register Redirection */}
        <div className="mt-6 text-center text-xs text-gray-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Create an account with your username
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

