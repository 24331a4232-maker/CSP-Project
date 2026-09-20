import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  limit
} from 'firebase/firestore';
import { auth, db } from './firebase';

export interface ResolvedAccount {
  email: string;
  username: string;
  fullName?: string;
  role: 'ADMIN' | 'VOLUNTEER' | 'DONOR';
  matchedDoc?: any;
  docId?: string;
  isEmail: boolean;
}

export const PRESET_ACCOUNTS: Record<string, { email: string; username: string; role: 'ADMIN' | 'VOLUNTEER' | 'DONOR'; name: string; defaultPassword?: string }> = {
  foodbridge: {
    username: 'FoodBridge',
    email: 'srikar.srikar0906@gmail.com',
    role: 'ADMIN',
    name: 'FoodBridge Administrator',
    defaultPassword: 'Food@12'
  },
  admin: {
    username: 'FoodBridge',
    email: 'admin@foodbridge.org',
    role: 'ADMIN',
    name: 'FoodBridge Administrator',
    defaultPassword: 'Food@12'
  },
  john_doe: {
    username: 'john_doe',
    email: 'john.volunteer@foodbridge.org',
    role: 'VOLUNTEER',
    name: 'John Doe Volunteer',
    defaultPassword: 'Food@12'
  },
  volunteer: {
    username: 'john_doe',
    email: 'john.volunteer@foodbridge.org',
    role: 'VOLUNTEER',
    name: 'John Doe Volunteer',
    defaultPassword: 'Food@12'
  },
  grand_palace: {
    username: 'grand_palace',
    email: 'catering@grandpalace.com',
    role: 'DONOR',
    name: 'Grand Palace Hotel & Suites',
    defaultPassword: 'Food@12'
  },
  donor: {
    username: 'grand_palace',
    email: 'catering@grandpalace.com',
    role: 'DONOR',
    name: 'Grand Palace Hotel & Suites',
    defaultPassword: 'Food@12'
  },
  lumiere_bistro: {
    username: 'lumiere_bistro',
    email: 'contact@lumiere.com',
    role: 'DONOR',
    name: 'Lumière French Bakery',
    defaultPassword: 'Food@12'
  },
  city_shelter: {
    username: 'city_shelter',
    email: 'contact@cityshelter.org',
    role: 'DONOR',
    name: 'City Food Shelter',
    defaultPassword: 'Food@12'
  }
};

/**
 * Resolves a username or email string to a full account profile and target email
 */
export async function resolveAccountByIdentifier(rawIdentifier: string): Promise<ResolvedAccount | null> {
  const cleanId = rawIdentifier.trim();
  if (!cleanId) return null;
  const cleanLower = cleanId.toLowerCase();

  // 1. Check preset accounts dictionary first for fast lookup (by username or email)
  if (PRESET_ACCOUNTS[cleanLower]) {
    const preset = PRESET_ACCOUNTS[cleanLower];
    return {
      email: preset.email,
      username: preset.username,
      fullName: preset.name,
      role: preset.role,
      matchedDoc: { password: preset.defaultPassword, ...preset },
      isEmail: false
    };
  }

  const presetByEmail = Object.values(PRESET_ACCOUNTS).find(p => p.email.toLowerCase() === cleanLower);
  if (presetByEmail) {
    return {
      email: presetByEmail.email,
      username: presetByEmail.username,
      fullName: presetByEmail.name,
      role: presetByEmail.role,
      matchedDoc: { password: presetByEmail.defaultPassword, ...presetByEmail },
      isEmail: true
    };
  }

  // If user entered a direct email
  if (cleanId.includes('@')) {
    // Check if we have an existing profile or user doc with this email to get their username & role
    try {
      const collectionsToCheck = ['profiles', 'users', 'admins', 'volunteers', 'donors'];
      for (const col of collectionsToCheck) {
        const q = query(collection(db, col), where('email', '==', cleanLower), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const data = docSnap.data();
          const roleUpper = normalizeRole(data.role || (col === 'admins' ? 'ADMIN' : col === 'volunteers' ? 'VOLUNTEER' : 'DONOR'));
          return {
            email: cleanLower,
            username: data.username || cleanLower.split('@')[0],
            fullName: data.full_name || data.name,
            role: roleUpper,
            matchedDoc: data,
            docId: docSnap.id,
            isEmail: true
          };
        }
      }

      // Broad scan if indexed query is empty
      for (const col of collectionsToCheck) {
        const colSnap = await getDocs(collection(db, col));
        const found = colSnap.docs.find(d => String(d.data()?.email || '').trim().toLowerCase() === cleanLower);
        if (found) {
          const data = found.data();
          const roleUpper = normalizeRole(data.role || (col === 'admins' ? 'ADMIN' : col === 'volunteers' ? 'VOLUNTEER' : 'DONOR'));
          return {
            email: cleanLower,
            username: data.username || cleanLower.split('@')[0],
            fullName: data.full_name || data.name,
            role: roleUpper,
            matchedDoc: data,
            docId: found.id,
            isEmail: true
          };
        }
      }
    } catch (e) {
      console.warn('Lookup by email query error:', e);
    }

    // Default fallback if not found in database yet
    const isAdminEmail = cleanLower === 'srikar.srikar0906@gmail.com' || cleanLower === 'admin@foodbridge.org';
    return {
      email: cleanLower,
      username: cleanLower.split('@')[0],
      role: isAdminEmail ? 'ADMIN' : 'DONOR',
      isEmail: true
    };
  }

  // Check preset accounts dictionary first for fast lookup
  if (PRESET_ACCOUNTS[cleanLower]) {
    const preset = PRESET_ACCOUNTS[cleanLower];
    return {
      email: preset.email,
      username: preset.username,
      fullName: preset.name,
      role: preset.role,
      matchedDoc: { password: preset.defaultPassword, ...preset },
      isEmail: false
    };
  }

  // Search across Firestore collections for username
  const collectionsToCheck = ['profiles', 'users', 'admins', 'volunteers', 'donors'];
  for (const col of collectionsToCheck) {
    try {
      // 1. Direct equality check
      const q = query(collection(db, col), where('username', '==', cleanId), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        const roleUpper = normalizeRole(data.role || (col === 'admins' ? 'ADMIN' : col === 'volunteers' ? 'VOLUNTEER' : 'DONOR'));
        return {
          email: data.email || `${cleanLower}@foodbridge.app`,
          username: data.username || cleanId,
          fullName: data.full_name || data.name,
          role: roleUpper,
          matchedDoc: data,
          docId: docSnap.id,
          isEmail: false
        };
      }

      // 2. Case-insensitive lowercase check
      const qLower = query(collection(db, col), where('username', '==', cleanLower), limit(1));
      const snapLower = await getDocs(qLower);
      if (!snapLower.empty) {
        const docSnap = snapLower.docs[0];
        const data = docSnap.data();
        const roleUpper = normalizeRole(data.role || (col === 'admins' ? 'ADMIN' : col === 'volunteers' ? 'VOLUNTEER' : 'DONOR'));
        return {
          email: data.email || `${cleanLower}@foodbridge.app`,
          username: data.username || cleanId,
          fullName: data.full_name || data.name,
          role: roleUpper,
          matchedDoc: data,
          docId: docSnap.id,
          isEmail: false
        };
      }
    } catch (err) {
      console.warn(`Error querying ${col} for username:`, err);
    }
  }

  // Broad collection scan if indexed query is empty
  try {
    const profilesSnap = await getDocs(collection(db, 'profiles'));
    for (const d of profilesSnap.docs) {
      const data = d.data();
      const u = String(data.username || '').trim().toLowerCase();
      if (u === cleanLower) {
        return {
          email: data.email || `${cleanLower}@foodbridge.app`,
          username: data.username || cleanId,
          fullName: data.full_name || data.name,
          role: normalizeRole(data.role),
          matchedDoc: data,
          docId: d.id,
          isEmail: false
        };
      }
    }
  } catch (err) {
    console.warn('Broad profile scan error:', err);
  }

  return null;
}

export function normalizeRole(role: any): 'ADMIN' | 'VOLUNTEER' | 'DONOR' {
  const r = String(role || '').toUpperCase();
  if (r === 'ADMIN') return 'ADMIN';
  if (r === 'VOLUNTEER') return 'VOLUNTEER';
  return 'DONOR';
}

/**
 * Records an entry into the Firestore `login_activity` audit table
 */
export async function recordLoginActivity(params: {
  userId: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  status: 'SUCCESS' | 'FAILED';
  action?: string;
  failureReason?: string;
  authMethod?: string;
}) {
  try {
    const logId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const roleUpper = (params.role || 'USER').toUpperCase();
    
    // Inspect browser agent and device platform
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Web Browser';
    let deviceDesc = 'Web Browser';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) deviceDesc = 'iOS Mobile (Safari)';
    else if (userAgent.includes('Android')) deviceDesc = 'Android Mobile (Chrome)';
    else if (userAgent.includes('Macintosh')) deviceDesc = 'macOS Desktop (Chrome)';
    else if (userAgent.includes('Windows')) deviceDesc = 'Windows PC (Chrome)';
    else if (userAgent.includes('Linux')) deviceDesc = 'Linux Workstation';

    const action = params.action || (params.status === 'SUCCESS' 
      ? (roleUpper === 'ADMIN' ? 'ADMIN_SESSION_INIT' : `${roleUpper}_LOGIN_SUCCESS`) 
      : 'FAILED_LOGIN_ATTEMPT');

    await setDoc(doc(db, 'login_activity', logId), {
      id: logId,
      user_id: params.userId || 'unknown',
      username: params.username,
      full_name: params.fullName || params.username,
      email: params.email || '',
      role: roleUpper,
      action,
      ip: '127.0.0.1 (Direct Gateway)',
      ip_address: '127.0.0.1',
      user_agent: userAgent,
      device: deviceDesc,
      status: params.status,
      failure_reason: params.failureReason || (params.status === 'SUCCESS' ? '' : 'Invalid credentials'),
      organization: roleUpper === 'ADMIN' ? 'FoodBridge Foundation' : 'Community Partner',
      city: 'Vizianagaram',
      state: 'Andhra Pradesh',
      auth_method: params.authMethod || 'Username / Password',
      login_time: nowIso,
      timestamp: nowIso
    });
  } catch (err) {
    console.warn('Could not record login_activity:', err);
  }
}

/**
 * Authenticates user by username or email and password
 */
export async function authenticateWithUsernameAndPassword(
  identifier: string,
  password: string,
  targetRole?: 'DONOR' | 'VOLUNTEER' | 'ADMIN'
): Promise<{ user: FirebaseUser; role: 'ADMIN' | 'VOLUNTEER' | 'DONOR'; username: string }> {
  const cleanIdentifier = identifier.trim();
  if (!cleanIdentifier) {
    throw new Error('Please enter your username or email.');
  }
  if (!password) {
    throw new Error('Please enter your password.');
  }

  // 1. Resolve identifier to account
  const account = await resolveAccountByIdentifier(cleanIdentifier);

  // If user entered a username that does NOT exist anywhere in database or presets
  if (!account && !cleanIdentifier.includes('@')) {
    await recordLoginActivity({
      userId: 'unknown',
      username: cleanIdentifier,
      fullName: cleanIdentifier,
      email: '',
      role: 'UNKNOWN',
      status: 'FAILED',
      failureReason: `Username "${cleanIdentifier}" not found in system`
    });
    throw new Error(`No account found with username "${cleanIdentifier}". Please check your username or register.`);
  }

  // Pre-authentication role check if account role is already known
  if (account && targetRole) {
    const normTarget = targetRole.toUpperCase();
    const accountRole = account.role.toUpperCase();
    if (normTarget === 'VOLUNTEER' && accountRole === 'DONOR') {
      await recordLoginActivity({
        userId: account.docId || 'unknown',
        username: account.username || cleanIdentifier,
        fullName: account.fullName || cleanIdentifier,
        email: account.email || '',
        role: 'DONOR',
        status: 'FAILED',
        failureReason: 'Donor credentials cannot log in as Volunteer'
      });
      throw new Error('Access denied: Donor credentials cannot log in as Volunteer. Please switch to the Donor portal.');
    }
    if (normTarget === 'DONOR' && accountRole === 'VOLUNTEER') {
      await recordLoginActivity({
        userId: account.docId || 'unknown',
        username: account.username || cleanIdentifier,
        fullName: account.fullName || cleanIdentifier,
        email: account.email || '',
        role: 'VOLUNTEER',
        status: 'FAILED',
        failureReason: 'Volunteer credentials cannot log in as Donor'
      });
      throw new Error('Access denied: Volunteer credentials cannot log in as Donor. Please switch to the Volunteer portal.');
    }
    if (normTarget === 'ADMIN' && accountRole !== 'ADMIN') {
      throw new Error('Access denied: Admin credentials required. You cannot log in as Admin.');
    }
  }

  const targetEmail = account?.email || cleanIdentifier.toLowerCase();
  const targetUsername = account?.username || (cleanIdentifier.includes('@') ? cleanIdentifier.split('@')[0] : cleanIdentifier);
  let resolvedRole: 'ADMIN' | 'VOLUNTEER' | 'DONOR' = account?.role || (targetEmail === 'srikar.srikar0906@gmail.com' || targetEmail === 'admin@foodbridge.org' ? 'ADMIN' : (targetRole || 'DONOR'));

  let firebaseUser: FirebaseUser | null = null;

  try {
    // 2. Try standard Firebase sign-in
    const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
    firebaseUser = userCredential.user;
  } catch (authError: any) {
    const errorCode = authError.code || '';
    
    // Check if user exists in database but not yet in Firebase Auth user pool
    const canAutoProvision = (
      errorCode === 'auth/user-not-found' ||
      errorCode === 'auth/invalid-credential' ||
      errorCode === 'auth/invalid-email'
    );

    if (canAutoProvision && account) {
      // Check stored password or preset password
      const storedPw = account.matchedDoc?.password || (PRESET_ACCOUNTS[cleanIdentifier.toLowerCase()]?.defaultPassword);
      const isKnownValidPassword = storedPw && (storedPw === password || storedPw === 'Food@12');

      if (isKnownValidPassword) {
        try {
          // Provision in Firebase Auth
          const newCredential = await createUserWithEmailAndPassword(auth, targetEmail, password);
          firebaseUser = newCredential.user;
        } catch (createErr: any) {
          // If already exists in Firebase Auth, then the password entered was actually wrong
          if (createErr.code === 'auth/email-already-in-use') {
            await recordLoginActivity({
              userId: account.docId || 'unknown',
              username: targetUsername,
              fullName: account.fullName || targetUsername,
              email: targetEmail,
              role: resolvedRole,
              status: 'FAILED',
              failureReason: 'Incorrect password provided'
            });
            throw new Error('Incorrect password. Please verify your password and try again.');
          }
          throw createErr;
        }
      } else {
        await recordLoginActivity({
          userId: account.docId || 'unknown',
          username: targetUsername,
          fullName: account.fullName || targetUsername,
          email: targetEmail,
          role: resolvedRole,
          status: 'FAILED',
          failureReason: 'Invalid credentials provided'
        });
        throw new Error('Invalid username or password. Please verify your credentials.');
      }
    } else {
      // Record failed login
      await recordLoginActivity({
        userId: 'unknown',
        username: targetUsername,
        fullName: targetUsername,
        email: targetEmail,
        role: resolvedRole,
        status: 'FAILED',
        failureReason: authError.message || 'Authentication error'
      });
      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
        throw new Error('Invalid username or password. Please verify your credentials.');
      }
      throw new Error(authError.message || 'Failed to sign in. Please try again.');
    }
  }

  if (!firebaseUser) {
    throw new Error('Authentication could not be completed.');
  }

  // 3. Post-authentication synchronization and role confirmation
  const uid = firebaseUser.uid;
  const nowIso = new Date().toISOString();

  // Check partitioned collections to confirm exact role
  const [adminDoc, volDoc, donorDoc, userDoc] = await Promise.all([
    getDoc(doc(db, 'admins', uid)),
    getDoc(doc(db, 'volunteers', uid)),
    getDoc(doc(db, 'donors', uid)),
    getDoc(doc(db, 'users', uid))
  ]);

  if (adminDoc.exists() || targetEmail === 'srikar.srikar0906@gmail.com' || targetEmail === 'admin@foodbridge.org' || targetUsername.toLowerCase() === 'foodbridge') {
    resolvedRole = 'ADMIN';
  } else if (volDoc.exists()) {
    resolvedRole = 'VOLUNTEER';
  } else if (donorDoc.exists()) {
    resolvedRole = 'DONOR';
  } else if (userDoc.exists()) {
    resolvedRole = normalizeRole(userDoc.data().role);
  } else if (account?.role) {
    resolvedRole = account.role;
  }

  // Post-auth strict role isolation enforcement
  if (targetRole) {
    const normTarget = targetRole.toUpperCase();
    const actualRole = resolvedRole.toUpperCase();

    if (normTarget === 'VOLUNTEER' && actualRole === 'DONOR') {
      await signOut(auth).catch(() => {});
      localStorage.removeItem('foodbridge_user_role');
      await recordLoginActivity({
        userId: uid,
        username: targetUsername,
        fullName: account?.fullName || targetUsername,
        email: targetEmail,
        role: 'DONOR',
        status: 'FAILED',
        failureReason: 'Donor credentials cannot log in as Volunteer'
      });
      throw new Error('Access denied: Donor credentials cannot log in as Volunteer. Please switch to the Donor portal.');
    }

    if (normTarget === 'DONOR' && actualRole === 'VOLUNTEER') {
      await signOut(auth).catch(() => {});
      localStorage.removeItem('foodbridge_user_role');
      await recordLoginActivity({
        userId: uid,
        username: targetUsername,
        fullName: account?.fullName || targetUsername,
        email: targetEmail,
        role: 'VOLUNTEER',
        status: 'FAILED',
        failureReason: 'Volunteer credentials cannot log in as Donor'
      });
      throw new Error('Access denied: Volunteer credentials cannot log in as Donor. Please switch to the Volunteer portal.');
    }

    if (normTarget === 'ADMIN' && actualRole !== 'ADMIN') {
      await signOut(auth).catch(() => {});
      localStorage.removeItem('foodbridge_user_role');
      throw new Error('Access denied: Admin credentials required. You cannot log in as Admin.');
    }
  }

  // Remember role in localStorage for session resilience
  localStorage.setItem('foodbridge_user_role', resolvedRole);

  const baseData = {
    id: uid,
    name: account?.fullName || userDoc.data()?.name || targetUsername,
    full_name: account?.fullName || userDoc.data()?.full_name || targetUsername,
    email: targetEmail,
    username: targetUsername,
    role: resolvedRole,
    is_active: true,
    last_login: nowIso
  };

  // Sync to users and profiles
  await Promise.all([
    setDoc(doc(db, 'users', uid), baseData, { merge: true }).catch(() => {}),
    setDoc(doc(db, 'profiles', uid), baseData, { merge: true }).catch(() => {})
  ]);

  // Sync role partition table
  if (resolvedRole === 'ADMIN') {
    await setDoc(doc(db, 'admins', uid), {
      ...baseData,
      role: 'admin',
      permissions: ['system_admin', 'manage_donations', 'manage_volunteers', 'manage_donors', 'view_analytics', 'access_audit_logs'],
      organization: 'FoodBridge Foundation',
      city: 'Vizianagaram',
      state: 'Andhra Pradesh'
    }, { merge: true }).catch(() => {});
  } else if (resolvedRole === 'VOLUNTEER') {
    await setDoc(doc(db, 'volunteers', uid), {
      ...baseData,
      role: 'volunteer',
      vehicle_type: 'Motorcycle / Scooter',
      availability_status: 'Available',
      assigned_zones: ['Vizianagaram Core Zone'],
      rating: 5.0,
      is_verified: true
    }, { merge: true }).catch(() => {});
  } else if (resolvedRole === 'DONOR') {
    await setDoc(doc(db, 'donors', uid), {
      ...baseData,
      role: 'donor',
      donor_type: 'Restaurant / Catering',
      organization_name: baseData.name || 'Community Donor',
      badges: ['FoodBridge Donor']
    }, { merge: true }).catch(() => {});
  }

  // 4. Record successful login event in login_activity table
  await recordLoginActivity({
    userId: uid,
    username: targetUsername,
    fullName: baseData.name,
    email: targetEmail,
    role: resolvedRole,
    status: 'SUCCESS',
    authMethod: 'Username / Password'
  });

  // 5. Also notify server-side session in background for JWT & API synchronization
  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: targetUsername, password, targetRole: resolvedRole })
  }).then(async (res) => {
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('last_plate_auth_token', data.token);
        localStorage.setItem('last_plate_auth_user', JSON.stringify(data.user));
      }
    }
  }).catch(() => {});

  return {
    user: firebaseUser,
    role: resolvedRole,
    username: targetUsername
  };
}
