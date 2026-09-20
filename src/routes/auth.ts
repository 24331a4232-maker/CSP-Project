import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { collection, doc, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'last_plate_jwt_secret_key_2026';

// Helper to normalize phone numbers for duplicate detection
function getCleanPhoneDigits(phone: string): string {
  return String(phone || '').replace(/\D/g, '');
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { fullName, username, email, phone, password, role, organization, city, state, pincode, address } = req.body;

    // 1. Validate required fields
    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!username || !String(username).trim()) {
      return res.status(400).json({ error: 'Username is required.' });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }
    const cleanPhoneDigits = getCleanPhoneDigits(phone);
    if (cleanPhoneDigits.length < 7) {
      return res.status(400).json({ error: 'Please enter a valid phone number.' });
    }
    if (!password || !String(password).trim()) {
      return res.status(400).json({ error: 'Password is required.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // 2. Fetch existing records to check email and username uniqueness across all collections
    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = String(email).trim().toLowerCase();

    // Check 1: Preset accounts email & username
    const presetEmails = ['srikar.srikar0906@gmail.com', 'admin@foodbridge.org', 'john.volunteer@foodbridge.org', 'catering@grandpalace.com', 'contact@lumiere.com', 'contact@cityshelter.org'];
    const isPresetEmail = presetEmails.includes(cleanEmail);
    if (isPresetEmail) {
      return res.status(400).json({
        error: 'This email is already registered with another account. The same email cannot register a second account with another role.'
      });
    }

    const presetUsernames = ['foodbridge', 'admin', 'john_doe', 'grand_palace', 'lumiere_bistro', 'city_shelter'];
    if (presetUsernames.includes(cleanUsername)) {
      return res.status(400).json({
        error: 'Username already exists. Please choose another username.'
      });
    }

    // Check 2: Check email and username across all partitioned collections (profiles, users, donors, volunteers, admins)
    const collectionsToCheck = ['profiles', 'users', 'donors', 'volunteers', 'admins'];
    for (const col of collectionsToCheck) {
      try {
        const colSnap = await getDocs(collection(db, col));
        for (const d of colSnap.docs) {
          const data = d.data();
          const existingEmail = String(data.email || '').trim().toLowerCase();
          const existingUsername = String(data.username || '').trim().toLowerCase();

          if (existingEmail === cleanEmail) {
            return res.status(400).json({
              error: 'This email is already registered with another account. The same email cannot register a second account with another role.'
            });
          }

          if (existingUsername === cleanUsername) {
            return res.status(400).json({
              error: 'Username already exists. Please choose another username.'
            });
          }
        }
      } catch (err) {
        console.warn(`Error checking uniqueness in ${col}:`, err);
      }
    }

    // Check 3: Phone number uniqueness
    const profilesSnapshot = await getDocs(collection(db, 'profiles'));
    const phoneExists = profilesSnapshot.docs.some((d) => {
      const p = d.data().phone;
      if (!p) return false;
      const pDigits = getCleanPhoneDigits(p);
      if (!pDigits) return false;
      if (pDigits === cleanPhoneDigits) return true;
      // Also match last 10 digits if numbers have country code (e.g. +91 7780447031 vs 7780447031)
      if (pDigits.length >= 10 && cleanPhoneDigits.length >= 10) {
        return pDigits.slice(-10) === cleanPhoneDigits.slice(-10);
      }
      return false;
    });
    if (phoneExists) {
      return res.status(400).json({
        error: 'Phone number already registered.'
      });
    }

    // 3. Hash password securely with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Save new profile directly to Firestore database
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newProfile = {
      id: userId,
      full_name: String(fullName).trim(),
      username: String(username).trim(),
      email: cleanEmail,
      phone: String(phone).trim(),
      role: role || 'donor',
      organization: String(organization || '').trim(),
      city: String(city || '').trim(),
      state: String(state || '').trim(),
      pincode: String(pincode || '').trim(),
      address: String(address || '').trim(),
      passwordHash: hashedPassword,
      is_active: true,
      created_at: nowIso,
      last_login: nowIso,
      updated_at: nowIso
    };

    await setDoc(doc(db, 'users', userId), newProfile, { merge: true });

    // Record initial registration audit activity
    const userAgent = String(req.headers['user-agent'] || 'Web Browser');
    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1 (Direct Secure)');
    let deviceDesc = 'Web Browser';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) deviceDesc = 'iOS Mobile';
    else if (userAgent.includes('Android')) deviceDesc = 'Android Mobile';
    else if (userAgent.includes('Macintosh')) deviceDesc = 'macOS Desktop';
    else if (userAgent.includes('Windows')) deviceDesc = 'Windows PC';
    else if (userAgent.includes('Linux')) deviceDesc = 'Linux Workstation';

    const regLogId = `log-reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    try {
      await setDoc(doc(db, 'login_activity', regLogId), {
        id: regLogId,
        user_id: userId,
        username: String(username).trim(),
        full_name: String(fullName).trim(),
        email: cleanEmail,
        role: String(role || 'donor').toUpperCase(),
        action: 'USER_REGISTRATION',
        ip: clientIp,
        ip_address: clientIp,
        user_agent: userAgent,
        device: deviceDesc,
        status: 'SUCCESS',
        organization: String(organization || '').trim(),
        city: String(city || '').trim(),
        state: String(state || '').trim(),
        auth_method: 'Self Registration (bcrypt)',
        login_time: nowIso,
        timestamp: nowIso
      });
    } catch (e) {
      console.warn('Could not record registration audit activity:', e);
    }

    // Save to distinct divided role collections in Firestore
    const normalizedRole = (role || 'donor').toLowerCase();
    if (normalizedRole === 'admin') {
      const adminRecord = {
        ...newProfile,
        role: 'admin',
        permissions: ['system_admin', 'manage_donations', 'manage_volunteers', 'manage_donors', 'view_analytics', 'access_audit_logs']
      };
      await setDoc(doc(db, 'admins', userId), adminRecord);
    } else if (normalizedRole === 'volunteer') {
      const volunteerRecord = {
        ...newProfile,
        role: 'volunteer',
        vehicle_type: req.body.vehicleType || req.body.vehicle || 'Standard Transport',
        availability_status: 'Available',
        assigned_zones: [city ? `${city} Zone` : 'General Zone'],
        total_deliveries: 0,
        hours_served: 0,
        rating: 5.0,
        is_verified: true
      };
      await setDoc(doc(db, 'volunteers', userId), volunteerRecord);
    } else {
      // donor
      const donorRecord = {
        ...newProfile,
        role: 'donor',
        donor_type: organization ? 'Restaurant / Catering' : 'Individual',
        organization_name: organization || 'Community Donor',
        total_donations: 0,
        food_donated_kg: 0,
        meals_provided: 0,
        badges: ['Food Donor Pioneer']
      };
      await setDoc(doc(db, 'donors', userId), donorRecord);
    }

    // 5. Generate token
    const token = jwt.sign(
      { userId, role: newProfile.role, email: newProfile.email, username: newProfile.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful! You can now log in with your credentials.',
      token,
      user: {
        id: userId,
        fullName: newProfile.full_name,
        username: newProfile.username,
        email: newProfile.email,
        phone: newProfile.phone,
        role: newProfile.role,
        organization: newProfile.organization
      }
    });
  } catch (error: any) {
    console.error('Registration error in Firestore:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred during registration. Please try again.'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const rawIdentifier = req.body.identifier || req.body.usernameOrEmail || req.body.username || req.body.email;
    const password = req.body.password;

    if (!rawIdentifier || !String(rawIdentifier).trim() || !password) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const cleanIdentifier = String(rawIdentifier).trim().toLowerCase();

    // Query Firestore collections (profiles, users, admins, volunteers, donors)
    let matchedDocId: string | null = null;
    let matchedProfile: any = null;

    const collectionsToSearch = ['profiles', 'users', 'admins', 'volunteers', 'donors'];
    for (const col of collectionsToSearch) {
      if (matchedProfile) break;
      try {
        const snap = await getDocs(collection(db, col));
        for (const d of snap.docs) {
          const data = d.data();
          const uName = data.username ? String(data.username).trim().toLowerCase() : '';
          const uEmail = data.email ? String(data.email).trim().toLowerCase() : '';
          if (uName === cleanIdentifier || uEmail === cleanIdentifier) {
            matchedDocId = d.id;
            matchedProfile = {
              ...data,
              role: data.role || (col === 'admins' ? 'admin' : col === 'volunteers' ? 'volunteer' : 'donor')
            };
            break;
          }
        }
      } catch (err) {
        console.warn(`Error scanning ${col} collection:`, err);
      }
    }

    // Built-in preset fallback accounts for standard usernames
    if (!matchedProfile) {
      const presets: Record<string, any> = {
        foodbridge: { id: 'usr-admin-01', username: 'FoodBridge', email: 'srikar.srikar0906@gmail.com', role: 'admin', full_name: 'FoodBridge Administrator', password: 'Food@12' },
        admin: { id: 'usr-admin-01', username: 'FoodBridge', email: 'admin@foodbridge.org', role: 'admin', full_name: 'FoodBridge Administrator', password: 'Food@12' },
        john_doe: { id: 'usr-vol-01', username: 'john_doe', email: 'john.volunteer@foodbridge.org', role: 'volunteer', full_name: 'John Doe Volunteer', password: 'Food@12' },
        grand_palace: { id: 'usr-donor-01', username: 'grand_palace', email: 'catering@grandpalace.com', role: 'donor', full_name: 'Grand Palace Hotel & Suites', password: 'Food@12' },
        lumiere_bistro: { id: 'usr-donor-02', username: 'lumiere_bistro', email: 'contact@lumiere.com', role: 'donor', full_name: 'Lumière French Bakery', password: 'Food@12' },
        city_shelter: { id: 'usr-ngo-01', username: 'city_shelter', email: 'contact@cityshelter.org', role: 'donor', full_name: 'City Food Shelter', password: 'Food@12' }
      };
      if (presets[cleanIdentifier]) {
        matchedDocId = presets[cleanIdentifier].id;
        matchedProfile = presets[cleanIdentifier];
      }
    }

    const userAgent = String(req.headers['user-agent'] || 'Web Browser');
    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1 (Direct Secure)');
    let deviceDesc = 'Web Browser';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) deviceDesc = 'iOS Mobile';
    else if (userAgent.includes('Android')) deviceDesc = 'Android Mobile';
    else if (userAgent.includes('Macintosh')) deviceDesc = 'macOS Desktop';
    else if (userAgent.includes('Windows')) deviceDesc = 'Windows PC';
    else if (userAgent.includes('Linux')) deviceDesc = 'Linux Workstation';

    if (!matchedProfile || !matchedDocId) {
      // Record failed login attempt
      const failLogId = `log-fail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const failTime = new Date().toISOString();
      try {
        await setDoc(doc(db, 'login_activity', failLogId), {
          id: failLogId,
          user_id: 'unknown',
          username: cleanIdentifier,
          full_name: cleanIdentifier,
          email: cleanIdentifier.includes('@') ? cleanIdentifier : '',
          role: 'UNKNOWN',
          action: 'FAILED_LOGIN_ATTEMPT',
          ip: clientIp,
          ip_address: clientIp,
          user_agent: userAgent,
          device: deviceDesc,
          status: 'FAILED',
          failure_reason: 'Account identifier not found',
          login_time: failTime,
          timestamp: failTime
        });
      } catch (e) {
        console.warn('Could not record failed audit entry:', e);
      }
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Verify password securely
    let isValidPassword = false;
    if (matchedProfile.passwordHash) {
      isValidPassword = await bcrypt.compare(password, matchedProfile.passwordHash);
    } else if (matchedProfile.password) {
      // Handle legacy or initial seed passwords (e.g. Food@12)
      isValidPassword = (matchedProfile.password === password);
      if (isValidPassword) {
        // Auto-upgrade legacy password to secure bcrypt hash
        const newHash = await bcrypt.hash(password, 10);
        await setDoc(doc(db, 'profiles', matchedDocId), { passwordHash: newHash }, { merge: true });
      }
    }

    if (!isValidPassword) {
      // Record failed password attempt
      const failLogId = `log-fail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const failTime = new Date().toISOString();
      try {
        await setDoc(doc(db, 'login_activity', failLogId), {
          id: failLogId,
          user_id: matchedProfile.id || matchedDocId,
          username: matchedProfile.username || cleanIdentifier,
          full_name: matchedProfile.full_name || cleanIdentifier,
          email: matchedProfile.email || '',
          role: String(matchedProfile.role || 'USER').toUpperCase(),
          action: 'FAILED_LOGIN_ATTEMPT',
          ip: clientIp,
          ip_address: clientIp,
          user_agent: userAgent,
          device: deviceDesc,
          status: 'FAILED',
          failure_reason: 'Incorrect password entered',
          login_time: failTime,
          timestamp: failTime
        });
      } catch (e) {
        console.warn('Could not record failed password audit entry:', e);
      }
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Role Isolation Check: Donor credentials cannot log in as Volunteer, Volunteer credentials cannot log in as Donor
    const requestedRole = String(req.body.targetRole || req.body.role || req.body.portal || '').trim().toLowerCase();
    const accountRole = String(matchedProfile.role || '').trim().toLowerCase();
    const normTarget = requestedRole === 'hotel' ? 'donor' : requestedRole;
    const normAccount = accountRole === 'hotel' ? 'donor' : accountRole;

    if (normTarget) {
      if (normTarget === 'volunteer' && normAccount === 'donor') {
        const failLogId = `log-fail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const failTime = new Date().toISOString();
        try {
          await setDoc(doc(db, 'login_activity', failLogId), {
            id: failLogId,
            user_id: matchedProfile.id || matchedDocId,
            username: matchedProfile.username || cleanIdentifier,
            full_name: matchedProfile.full_name || cleanIdentifier,
            email: matchedProfile.email || '',
            role: 'DONOR',
            action: 'ROLE_MISMATCH_BLOCKED',
            ip: clientIp,
            status: 'FAILED',
            failure_reason: 'Donor credentials cannot log in as Volunteer',
            login_time: failTime
          });
        } catch {}
        return res.status(403).json({
          error: 'Access denied: Donor credentials cannot log in as Volunteer. Please switch to the Donor portal.'
        });
      }

      if (normTarget === 'donor' && normAccount === 'volunteer') {
        const failLogId = `log-fail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const failTime = new Date().toISOString();
        try {
          await setDoc(doc(db, 'login_activity', failLogId), {
            id: failLogId,
            user_id: matchedProfile.id || matchedDocId,
            username: matchedProfile.username || cleanIdentifier,
            full_name: matchedProfile.full_name || cleanIdentifier,
            email: matchedProfile.email || '',
            role: 'VOLUNTEER',
            action: 'ROLE_MISMATCH_BLOCKED',
            ip: clientIp,
            status: 'FAILED',
            failure_reason: 'Volunteer credentials cannot log in as Donor',
            login_time: failTime
          });
        } catch {}
        return res.status(403).json({
          error: 'Access denied: Volunteer credentials cannot log in as Donor. Please switch to the Volunteer portal.'
        });
      }

      if (normTarget === 'admin' && normAccount !== 'admin') {
        return res.status(403).json({
          error: 'Access denied: Admin credentials required.'
        });
      }
    }

    // Update last_login timestamp in Firestore profiles and role-specific collection
    const nowIso = new Date().toISOString();
    await setDoc(doc(db, 'profiles', matchedDocId), { last_login: nowIso }, { merge: true });
    const matchedRole = (matchedProfile.role || '').toLowerCase();
    if (matchedRole === 'admin') {
      await setDoc(doc(db, 'admins', matchedDocId), { last_login: nowIso }, { merge: true });
    } else if (matchedRole === 'volunteer') {
      await setDoc(doc(db, 'volunteers', matchedDocId), { last_login: nowIso }, { merge: true });
    } else if (matchedRole === 'donor') {
      await setDoc(doc(db, 'donors', matchedDocId), { last_login: nowIso }, { merge: true });
    }

    // Record successful login in login_activity audit table
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const roleUpper = (matchedProfile.role || 'USER').toUpperCase();
    const loginRecord = {
      id: logId,
      user_id: matchedProfile.id || matchedDocId,
      username: matchedProfile.username || matchedProfile.full_name || 'User',
      full_name: matchedProfile.full_name || matchedProfile.username || 'User',
      email: matchedProfile.email || '',
      role: roleUpper,
      action: roleUpper === 'ADMIN' ? 'ADMIN_SESSION_INIT' : `${roleUpper}_LOGIN_SUCCESS`,
      ip: clientIp,
      ip_address: clientIp,
      user_agent: userAgent,
      device: deviceDesc,
      status: 'SUCCESS',
      organization: matchedProfile.organization || '',
      city: matchedProfile.city || 'Vizianagaram',
      state: matchedProfile.state || 'Andhra Pradesh',
      auth_method: matchedProfile.passwordHash ? 'Password (bcrypt)' : 'Password (direct)',
      login_time: nowIso,
      timestamp: nowIso
    };

    try {
      await setDoc(doc(db, 'login_activity', logId), loginRecord);
    } catch (auditErr) {
      console.warn('Could not write login_activity record:', auditErr);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: matchedProfile.id || matchedDocId,
        role: matchedProfile.role,
        email: matchedProfile.email,
        username: matchedProfile.username
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      auditLogId: logId,
      user: {
        id: matchedProfile.id || matchedDocId,
        fullName: matchedProfile.full_name || matchedProfile.username,
        username: matchedProfile.username,
        email: matchedProfile.email,
        phone: matchedProfile.phone,
        role: matchedProfile.role,
        organization: matchedProfile.organization || '',
        city: matchedProfile.city || '',
        state: matchedProfile.state || '',
        pincode: matchedProfile.pincode || '',
        address: matchedProfile.address || ''
      }
    });
  } catch (error: any) {
    console.error('Login error in Firestore:', error);
    return res.status(500).json({
      error: 'An unexpected error occurred during login. Please try again.'
    });
  }
});

// GET /api/auth/login-activities (Returns all audit logs from Firestore)
router.get('/login-activities', async (_req: Request, res: Response) => {
  try {
    const snap = await getDocs(collection(db, 'login_activity'));
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    logs.sort((a: any, b: any) => {
      const timeA = new Date(a.timestamp || a.login_time || 0).getTime();
      const timeB = new Date(b.timestamp || b.login_time || 0).getTime();
      return timeB - timeA;
    });
    return res.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch login activities' });
  }
});

// POST /api/auth/login-activities/test (Creates an instantaneous test audit record for verification)
router.post('/login-activities/test', async (req: Request, res: Response) => {
  try {
    const { username, role, action, ip, status } = req.body || {};
    const testLogId = `log-test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();
    const testRecord = {
      id: testLogId,
      user_id: req.body?.user_id || `usr-test-${Date.now()}`,
      username: username || 'AuditTestUser',
      full_name: req.body?.full_name || 'Audit Test Inspector',
      email: req.body?.email || 'audit.test@foodbridge.org',
      role: (role || 'ADMIN').toUpperCase(),
      action: action || 'MANUAL_AUDIT_VERIFICATION',
      ip: ip || '127.0.0.1 (Direct Admin Console)',
      ip_address: ip || '127.0.0.1 (Direct Admin Console)',
      user_agent: String(req.headers['user-agent'] || 'Admin Console Browser'),
      device: 'Console / Terminal Inspector',
      status: status || 'SUCCESS',
      organization: 'FoodBridge Security Operations',
      city: 'Vizianagaram',
      state: 'Andhra Pradesh',
      auth_method: 'Admin Verification Test',
      login_time: nowIso,
      timestamp: nowIso
    };
    await setDoc(doc(db, 'login_activity', testLogId), testRecord);
    return res.json({ success: true, log: testRecord });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create test log' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded?.userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    const userDoc = await getDoc(doc(db, 'users', decoded.userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return res.json({
        user: {
          id: data.id || userDoc.id,
          fullName: data.name || data.full_name || data.username,
          username: data.username,
          email: data.email,
          phone: data.phone,
          role: data.role,
          organization: data.organization || ''
        }
      });
    }

    return res.json({ user: decoded });
  } catch {
    return res.status(401).json({ error: 'Token expired or invalid' });
  }
});

// PUT /api/auth/profile - Updates the existing users/{uid} document directly
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const { id, uid, email, role, created_at, ...updates } = req.body;
    const targetUserId = id || uid;
    if (!targetUserId) {
      return res.status(400).json({ error: 'User id is required' });
    }

    const userRef = doc(db, 'users', targetUserId);
    const existingSnap = await getDoc(userRef);
    const existingData = existingSnap.exists() ? existingSnap.data() : {};

    // STRICTLY PRESERVE the user's uid, email, role, and registration data (created_at)
    const payload = {
      ...updates,
      id: targetUserId,
      uid: targetUserId,
      email: existingData.email || email,
      role: existingData.role || role,
      created_at: existingData.created_at || created_at || Date.now(),
      name: updates.name || updates.full_name || existingData.name,
      full_name: updates.name || updates.full_name || existingData.name,
      updated_at: new Date().toISOString()
    };

    await setDoc(userRef, payload, { merge: true });
    return res.json({
      success: true,
      message: `User ${targetUserId} profile updated in Firestore users collection`,
      user: payload
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/check-email
router.get('/check-email', async (req: Request, res: Response) => {
  try {
    const rawEmail = String(req.query.email || '').trim().toLowerCase();
    if (!rawEmail) {
      return res.json({ exists: false });
    }

    const presetEmails = ['srikar.srikar0906@gmail.com', 'admin@foodbridge.org', 'john.volunteer@foodbridge.org', 'catering@grandpalace.com', 'contact@lumiere.com', 'contact@cityshelter.org'];
    if (presetEmails.includes(rawEmail)) {
      return res.json({ exists: true, reason: 'preset' });
    }

    const collectionsToCheck = ['users', 'profiles', 'donors', 'volunteers', 'admins'];
    for (const col of collectionsToCheck) {
      try {
        const colSnap = await getDocs(collection(db, col));
        const found = colSnap.docs.some(d => String(d.data()?.email || '').trim().toLowerCase() === rawEmail);
        if (found) {
          return res.json({ exists: true, collection: col });
        }
      } catch (err) {
        console.warn(`Error scanning ${col} for email check:`, err);
      }
    }

    return res.json({ exists: false });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Check email failed' });
  }
});

export default router;
