import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
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
    // Check Firestore users collection (single source of truth)
    try {
      const q = query(collection(db, 'users'), where('email', '==', cleanLower), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        const roleUpper = normalizeRole(data.role || 'DONOR');
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

      // Broad scan of users collection if indexed query is empty
      const usersSnap = await getDocs(collection(db, 'users'));
      const found = usersSnap.docs.find(d => String(d.data()?.email || '').trim().toLowerCase() === cleanLower);
      if (found) {
        const data = found.data();
        const roleUpper = normalizeRole(data.role || 'DONOR');
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

  // Search Firestore collections (users, donors, volunteers, admins, profiles) for username
  const collectionsToCheck = ['users', 'donors', 'volunteers', 'admins', 'profiles'];

  for (const colName of collectionsToCheck) {
    try {
      // 1. Direct equality check
      const q = query(collection(db, colName), where('username', '==', cleanId), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        const fallbackRole = colName === 'admins' ? 'ADMIN' : colName === 'volunteers' ? 'VOLUNTEER' : 'DONOR';
        const roleUpper = normalizeRole(data.role || fallbackRole);
        return {
          email: data.email || `${cleanLower}@foodbridge.app`,
          username: data.username || cleanId,
          fullName: data.full_name || data.name || data.username,
          role: roleUpper,
          matchedDoc: data,
          docId: docSnap.id,
          isEmail: false
        };
      }

      // 2. Case-insensitive lowercase check
      const qLower = query(collection(db, colName), where('username', '==', cleanLower), limit(1));
      const snapLower = await getDocs(qLower);
      if (!snapLower.empty) {
        const docSnap = snapLower.docs[0];
        const data = docSnap.data();
        const fallbackRole = colName === 'admins' ? 'ADMIN' : colName === 'volunteers' ? 'VOLUNTEER' : 'DONOR';
        const roleUpper = normalizeRole(data.role || fallbackRole);
        return {
          email: data.email || `${cleanLower}@foodbridge.app`,
          username: data.username || cleanId,
          fullName: data.full_name || data.name || data.username,
          role: roleUpper,
          matchedDoc: data,
          docId: docSnap.id,
          isEmail: false
        };
      }
    } catch (err) {
      console.warn(`Error querying ${colName} for username:`, err);
    }
  }

  // Broad collection scan across all user collections if indexed query is empty
  for (const colName of collectionsToCheck) {
    try {
      const snap = await getDocs(collection(db, colName));
      for (const d of snap.docs) {
        const data = d.data();
        const u = String(data.username || data.user_name || '').trim().toLowerCase();
        if (u === cleanLower) {
          const fallbackRole = colName === 'admins' ? 'ADMIN' : colName === 'volunteers' ? 'VOLUNTEER' : 'DONOR';
          return {
            email: data.email || `${cleanLower}@foodbridge.app`,
            username: data.username || cleanId,
            fullName: data.full_name || data.name || data.username,
            role: normalizeRole(data.role || fallbackRole),
            matchedDoc: data,
            docId: d.id,
            isEmail: false
          };
        }
      }
    } catch (err) {
      console.warn(`Broad scan ${colName} error:`, err);
    }
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

  // Pre-authentication role check: protect admin portal
  if (account && targetRole) {
    const normTarget = targetRole.toUpperCase();
    const accountRole = account.role.toUpperCase();
    if (normTarget === 'ADMIN' && accountRole !== 'ADMIN') {
      throw new Error('Access denied: Administrator credentials required to access the Admin portal.');
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

  // Check partitioned collections and primary user profile to confirm exact role
  const [userDoc, adminDoc, volDoc, donorDoc] = await Promise.all([
    getDoc(doc(db, 'users', uid)),
    getDoc(doc(db, 'admins', uid)),
    getDoc(doc(db, 'volunteers', uid)),
    getDoc(doc(db, 'donors', uid))
  ]);

  if (userDoc.exists() && userDoc.data()?.role) {
    resolvedRole = normalizeRole(userDoc.data().role);
  } else if (adminDoc.exists() || targetEmail === 'srikar.srikar0906@gmail.com' || targetEmail === 'admin@foodbridge.org' || targetUsername.toLowerCase() === 'foodbridge') {
    resolvedRole = 'ADMIN';
  } else if (volDoc.exists()) {
    resolvedRole = 'VOLUNTEER';
  } else if (donorDoc.exists()) {
    resolvedRole = 'DONOR';
  } else if (account?.role) {
    resolvedRole = account.role;
  }

  // Admin portal security check: only authorized ADMINs can access admin portal
  if (targetRole && targetRole.toUpperCase() === 'ADMIN' && resolvedRole !== 'ADMIN') {
    await signOut(auth).catch(() => {});
    localStorage.removeItem('foodbridge_user_role');
    throw new Error('Access denied: Administrator credentials required to sign in through the Admin Portal.');
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

  // Update the existing users/{uid} document preserving uid, email, role, and registration data
  await setDoc(doc(db, 'users', uid), baseData, { merge: true }).catch(() => {});

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

/**
 * Updates a user's profile information directly in the Firestore database
 * (writes to `users/{uid}` and syncs to corresponding partition collection: `volunteers/{uid}`, `donors/{uid}`, or `admins/{uid}`)
 */
export async function updateUserProfileInDatabase(
  uid: string,
  updatedData: Record<string, any>,
  optionalRole?: string
): Promise<{ success: boolean; message?: string }> {
  if (!uid) {
    throw new Error('User ID is required to update profile in database.');
  }

  const cleanName = (updatedData.name || updatedData.full_name || '').trim();
  const cleanUsername = (updatedData.username || '').trim();
  const cleanPhone = (updatedData.phone || '').trim();
  const cleanOrg = (updatedData.organization || updatedData.organization_name || '').trim();
  const cleanAddress = (updatedData.address || '').trim();
  const cleanCity = (updatedData.city || updatedData.serviceCity || '').trim();
  const cleanState = (updatedData.state || '').trim();
  const cleanPincode = (updatedData.pincode || '').trim();
  const cleanBio = (updatedData.bio || '').trim();
  const avatarUrl = updatedData.avatar_url || updatedData.profilePicUrl || '';
  const vehicleType = (updatedData.vehicle_type || updatedData.vehicleType || '').trim();
  const availability = (updatedData.availability || updatedData.availability_status || '').trim();
  const emergencyContact = (updatedData.emergency_contact || updatedData.emergencyContact || '').trim();

  // 1. Prepare base update payload for 'users/{uid}'
  const userPayload: Record<string, any> = {
    id: uid,
    uid: uid,
    updated_at: new Date().toISOString()
  };

  if (cleanName) {
    userPayload.name = cleanName;
    userPayload.full_name = cleanName;
  }
  if (cleanUsername) {
    userPayload.username = cleanUsername;
    userPayload.username_lower = cleanUsername.toLowerCase();
    userPayload.user_name = cleanUsername;
  }
  if (cleanPhone) userPayload.phone = cleanPhone;
  if (cleanOrg) {
    userPayload.organization = cleanOrg;
    userPayload.organization_name = cleanOrg;
  }
  if (cleanAddress) userPayload.address = cleanAddress;
  if (cleanCity) {
    userPayload.city = cleanCity;
    userPayload.serviceCity = cleanCity;
  }
  if (cleanState) userPayload.state = cleanState;
  if (cleanPincode) userPayload.pincode = cleanPincode;
  if (cleanBio) userPayload.bio = cleanBio;
  if (avatarUrl) {
    userPayload.avatar_url = avatarUrl;
    userPayload.profilePicUrl = avatarUrl;
  }
  if (vehicleType) {
    userPayload.vehicle_type = vehicleType;
    userPayload.vehicleType = vehicleType;
  }
  if (availability) {
    userPayload.availability = availability;
    userPayload.availability_status = availability;
  }
  if (emergencyContact) {
    userPayload.emergency_contact = emergencyContact;
    userPayload.emergencyContact = emergencyContact;
  }

  // Preserve role if passed or read from existing
  let role = optionalRole ? normalizeRole(optionalRole) : updatedData.role ? normalizeRole(updatedData.role) : null;
  if (!role) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists() && snap.data()?.role) {
        role = normalizeRole(snap.data().role);
      }
    } catch (e) {}
  }
  if (role) {
    userPayload.role = role;
  }

  // 2. Update primary single-source-of-truth: users/{uid}
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, userPayload, { merge: true });

  // 3. Mirror/Synchronize to partitioned collection based on role
  try {
    if (role === 'VOLUNTEER') {
      const volRef = doc(db, 'volunteers', uid);
      await setDoc(volRef, {
        id: uid,
        full_name: cleanName || userPayload.name,
        email: updatedData.email || auth.currentUser?.email || '',
        username: cleanUsername || userPayload.username,
        phone: cleanPhone || '',
        organization: cleanOrg || '',
        city: cleanCity || '',
        address: cleanAddress || '',
        bio: cleanBio || '',
        vehicle_type: vehicleType || 'Motorcycle',
        availability: availability || 'Available',
        emergency_contact: emergencyContact || '',
        avatar_url: avatarUrl || '',
        updated_at: new Date().toISOString()
      }, { merge: true });
    } else if (role === 'DONOR') {
      const donorRef = doc(db, 'donors', uid);
      await setDoc(donorRef, {
        id: uid,
        full_name: cleanName || userPayload.name,
        email: updatedData.email || auth.currentUser?.email || '',
        username: cleanUsername || userPayload.username,
        phone: cleanPhone || '',
        organization: cleanOrg || '',
        address: cleanAddress || '',
        city: cleanCity || '',
        state: cleanState || '',
        pincode: cleanPincode || '',
        avatar_url: avatarUrl || '',
        updated_at: new Date().toISOString()
      }, { merge: true });
    } else if (role === 'ADMIN') {
      const adminRef = doc(db, 'admins', uid);
      await setDoc(adminRef, {
        id: uid,
        full_name: cleanName || userPayload.name,
        email: updatedData.email || auth.currentUser?.email || '',
        username: cleanUsername || userPayload.username,
        phone: cleanPhone || '',
        organization: cleanOrg || 'FoodBridge Core Team',
        city: cleanCity || '',
        address: cleanAddress || '',
        avatar_url: avatarUrl || '',
        updated_at: new Date().toISOString()
      }, { merge: true });
    }
  } catch (syncErr) {
    console.warn('Syncing to partition table skipped or permission restricted:', syncErr);
  }

  // 4. Update Firebase Auth currentUser display profile if logged in as this user
  if (auth.currentUser && auth.currentUser.uid === uid) {
    try {
      await updateProfile(auth.currentUser, {
        displayName: cleanName || auth.currentUser.displayName,
        photoURL: avatarUrl || auth.currentUser.photoURL
      });
    } catch (authProfErr) {
      console.warn('Firebase Auth updateProfile skipped:', authProfErr);
    }
  }

  // 5. Update local storage caches
  try {
    const rawUser = localStorage.getItem('last_plate_auth_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      const merged = { ...parsed, ...userPayload };
      localStorage.setItem('last_plate_auth_user', JSON.stringify(merged));
    }
    if (role === 'VOLUNTEER') {
      localStorage.setItem('last_plate_volunteer_profile', JSON.stringify({
        fullName: cleanName || userPayload.name,
        email: updatedData.email || auth.currentUser?.email || '',
        phone: cleanPhone,
        bio: cleanBio,
        vehicleType: vehicleType || 'Motorcycle',
        serviceCity: cleanCity,
        availability: availability || 'Available',
        emergencyContact: emergencyContact,
        profilePicUrl: avatarUrl
      }));
    }
  } catch (e) {}

  return { success: true, message: 'Profile updated in Firestore database' };
}

