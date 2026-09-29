import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, User, Lock, Eye, EyeOff, Shield, Users, Building, ArrowRight, CheckCircle2 } from 'lucide-react';
import { authenticateWithUsernameAndPassword } from '../lib/authService';
import { identifyRoleAndRedirectOnLogin, redirectToRoleDashboard } from '../lib/roleHelper';
import { useAuth } from '../contexts/AuthContext';

type LoginRole = 'ADMIN' | 'DONOR' | 'VOLUNTEER';

interface RoleConfig {
  id: LoginRole;
  number: string;
  name: string;
  title: string;
  shortDesc: string;
  badge: string;
  accent: {
    tabActive: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    btnBg: string;
    btnHover: string;
    iconColor: string;
    ring: string;
    cardBg: string;
  };
  placeholder: string;
  demoUser: string;
  demoPass: string;
  demoLabel: string;
}

const ROLE_CONFIGS: Record<LoginRole, RoleConfig> = {
  ADMIN: {
    id: 'ADMIN',
    number: '1',
    name: 'Admin',
    title: 'Admin Portal Login',
    shortDesc: 'System administration, real-time oversight & user management',
    badge: '1. Administrative Access',
    accent: {
      tabActive: 'bg-purple-600 text-white shadow-md shadow-purple-600/20',
      border: 'border-purple-200',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      badgeText: 'text-purple-700',
      btnBg: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 shadow-purple-600/20',
      btnHover: 'hover:bg-purple-700',
      iconColor: 'text-purple-600',
      ring: 'focus:ring-purple-500 focus:border-purple-500',
      cardBg: 'bg-purple-50/50 border-purple-200 hover:bg-purple-100/60',
    },
    placeholder: 'e.g. FoodBridge or admin@foodbridge.org',
    demoUser: 'FoodBridge',
    demoPass: 'Food@12',
    demoLabel: 'System Administrator',
  },
  DONOR: {
    id: 'DONOR',
    number: '2',
    name: 'Donor',
    title: 'Donor Portal Login',
    shortDesc: 'Surplus food listings for restaurants, hotels & caterers',
    badge: '2. Food Donor Access',
    accent: {
      tabActive: 'bg-blue-600 text-white shadow-md shadow-blue-600/20',
      border: 'border-blue-200',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      badgeText: 'text-blue-700',
      btnBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-600/20',
      btnHover: 'hover:bg-blue-700',
      iconColor: 'text-blue-600',
      ring: 'focus:ring-blue-500 focus:border-blue-500',
      cardBg: 'bg-blue-50/50 border-blue-200 hover:bg-blue-100/60',
    },
    placeholder: 'e.g. grand_palace or catering@grandpalace.com',
    demoUser: 'grand_palace',
    demoPass: 'Food@12',
    demoLabel: 'Grand Palace Hotel',
  },
  VOLUNTEER: {
    id: 'VOLUNTEER',
    number: '3',
    name: 'Volunteer',
    title: 'Volunteer Portal Login',
    shortDesc: 'Food rescue pickups, dispatch routes & community deliveries',
    badge: '3. Volunteer Dispatch',
    accent: {
      tabActive: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20',
      border: 'border-emerald-200',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeText: 'text-emerald-700',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-emerald-600/20',
      btnHover: 'hover:bg-emerald-700',
      iconColor: 'text-emerald-600',
      ring: 'focus:ring-emerald-500 focus:border-emerald-500',
      cardBg: 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/60',
    },
    placeholder: 'e.g. john_doe or volunteer@foodbridge.org',
    demoUser: 'john_doe',
    demoPass: 'Food@12',
    demoLabel: 'John Doe Volunteer',
  },
};

const LOGIN_ORDER: LoginRole[] = ['ADMIN', 'DONOR', 'VOLUNTEER'];

const Login: React.FC = () => {
  const { currentUser, userData, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRoleParam = (searchParams.get('role') || '').toUpperCase();
  const defaultRole: LoginRole = 
    initialRoleParam === 'ADMIN' ? 'ADMIN' :
    initialRoleParam === 'DONOR' ? 'DONOR' :
    initialRoleParam === 'VOLUNTEER' ? 'VOLUNTEER' : 'DONOR';

  const [selectedRole, setSelectedRole] = useState<LoginRole>(defaultRole);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // If user is already authenticated, immediately identify their role and route to their specific dashboard
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
      setSelectedRole(initialRoleParam as LoginRole);
    }
  }, [initialRoleParam]);

  const handleRoleChange = (role: LoginRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    setSearchParams({ role: role.toLowerCase() });
  };

  const currentConfig = ROLE_CONFIGS[selectedRole];

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
      toast.success(`Welcome back, ${result.username}! Signed in to your ${result.role} portal.`);

      // Identify user's role on login and immediately redirect them to their specific role dashboard
      await identifyRoleAndRedirectOnLogin({
        user: result.user,
        username: result.username,
        requestedRole: result.role,
        navigate,
        options: { replace: true }
      });
    } catch (error: any) {
      const msg = error.message || 'Failed to sign in. Please verify your credentials.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role: LoginRole) => {
    const config = ROLE_CONFIGS[role];
    setSelectedRole(role);
    setIdentifier(config.demoUser);
    setPassword(config.demoPass);
    setErrorMessage(null);
    setSearchParams({ role: role.toLowerCase() });
  };

  const getRoleIcon = (role: LoginRole, className: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className={className} />;
      case 'DONOR':
        return <Building className={className} />;
      case 'VOLUNTEER':
        return <Users className={className} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-4 sm:py-8 px-4 w-full">
      <div className="w-full max-w-lg bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-gray-100">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center shadow-xs mb-3">
            <Heart className="w-7 h-7 text-indigo-600 fill-indigo-600/20" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign In to SharePlate</h2>
          <p className="text-sm text-gray-500 mt-1">
            Select your login type below to access your dedicated portal
          </p>
        </div>

        {/* 3 Divided Login Types Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Select Login Type
            </label>
            <span className="text-[11px] font-medium text-gray-400">
              3 Portals Available
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 rounded-xl border border-gray-200">
            {LOGIN_ORDER.map((role) => {
              const cfg = ROLE_CONFIGS[role];
              const isActive = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  id={`login-tab-${role.toLowerCase()}`}
                  onClick={() => handleRoleChange(role)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    isActive
                      ? `${cfg.accent.tabActive}`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-700'}`}>
                      {cfg.number}
                    </span>
                    {getRoleIcon(role, 'w-3.5 h-3.5 shrink-0')}
                  </div>
                  <span className="text-xs tracking-tight">{cfg.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Portal Info Banner */}
          <div className={`mt-3 p-3 rounded-xl border flex items-start gap-2.5 transition-colors ${currentConfig.accent.badgeBg}`}>
            <div className="mt-0.5 shrink-0">
              {getRoleIcon(selectedRole, `w-4 h-4 ${currentConfig.accent.iconColor}`)}
            </div>
            <div className="flex-1 text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <span>{currentConfig.number}. {currentConfig.name} Portal</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-white/70 border border-current/20">
                  Active
                </span>
              </div>
              <div className="text-gray-600 mt-0.5 leading-snug">
                {currentConfig.shortDesc}
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs leading-relaxed flex items-start gap-2.5">
            <span className="shrink-0 font-bold text-rose-600 mt-0.5">!</span>
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Username or Email Field */}
          <div>
            <label 
              htmlFor="login-identifier" 
              className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5"
            >
              {currentConfig.name} Username or Email
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
                placeholder={currentConfig.placeholder}
                className={`block w-full pl-10 pr-3.5 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 ${currentConfig.accent.ring} transition-all`}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <span className="text-[11px] text-gray-500 mt-1 block">
              Enter your registered username or email for the {currentConfig.name} account.
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
                className={`block w-full pl-10 pr-10 py-2.5 bg-gray-50/50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 ${currentConfig.accent.ring} transition-all`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
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
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white ${currentConfig.accent.btnBg} shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 cursor-pointer transition-all mt-1`}
          >
            {loading ? (
              <span>Authenticating {currentConfig.name}...</span>
            ) : (
              <>
                <span>Sign in as {currentConfig.name}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 3 Quick Demo Login Types */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              Quick 1-Click Demo Accounts
            </span>
            <span className="text-[10px] text-gray-400">
              Pass: <code className="font-mono text-gray-700 bg-gray-100 px-1 py-0.5 rounded">Food@12</code>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {LOGIN_ORDER.map((role) => {
              const cfg = ROLE_CONFIGS[role];
              const isCurrent = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  id={`demo-login-${role.toLowerCase()}`}
                  onClick={() => setDemoCredentials(role)}
                  className={`p-2.5 border rounded-xl text-left transition-all flex flex-col items-center text-center cursor-pointer relative ${
                    isCurrent ? `${cfg.accent.cardBg} ring-2 ring-offset-1 ring-current/20` : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[10px] font-bold text-gray-500">{cfg.number}.</span>
                    {getRoleIcon(role, `w-3.5 h-3.5 ${cfg.accent.iconColor}`)}
                  </div>
                  <span className="text-xs font-bold text-gray-900 font-mono truncate w-full">{cfg.demoUser}</span>
                  <span className={`text-[10px] font-semibold mt-0.5 ${cfg.accent.badgeText}`}>
                    {cfg.name}
                  </span>
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Register Redirection */}
        <div className="mt-5 text-center text-xs text-gray-500">
          Need a new account?{' '}
          <Link to={`/register?role=${selectedRole.toLowerCase()}`} className="font-semibold text-indigo-600 hover:text-indigo-500">
            Register as {currentConfig.name}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;


