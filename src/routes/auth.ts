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

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = String(email).trim().toLowerCase();

    // 2. Fetch existing profiles from Firestore to check uniqueness
    const profilesSnapshot = await getDocs(collection(db, 'profiles'));

    // Check 1: Username must be UNIQUE
    const usernameExists = profilesSnapshot.docs.some((d) => {
      const u = d.data().username;
      return u && String(u).trim().toLowerCase() === cleanUsername;
    });
    if (usernameExists) {
      return res.status(400).json({
        error: 'Username already exists. Please choose another username.'
      });
    }

    // Check 2: Email must be UNIQUE
    const emailExists = profilesSnapshot.docs.some((d) => {
      const e = d.data().email;
      return e && String(e).trim().toLowerCase() === cleanEmail;
    });
    if (emailExists) {
      return res.status(400).json({
        error: 'Email already registered. Please login.'
      });
    }

    // Check 3: Phone number must be UNIQUE
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

    await setDoc(doc(db, 'profiles', userId), newProfile);

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

    // Query Firestore profiles collection
    const profilesSnapshot = await getDocs(collection(db, 'profiles'));

    let matchedDocId: string | null = null;
    let matchedProfile: any = null;

    for (const d of profilesSnapshot.docs) {
      const data = d.data();
      const uName = data.username ? String(data.username).trim().toLowerCase() : '';
      const uEmail = data.email ? String(data.email).trim().toLowerCase() : '';
      if (uName === cleanIdentifier || uEmail === cleanIdentifier) {
        matchedDocId = d.id;
        matchedProfile = data;
        break;
      }
    }

    // Special alias check for FoodBridge Admin
    if (!matchedProfile && (cleanIdentifier === 'foodbridge' || cleanIdentifier === 'admin@foodbridge.org')) {
      for (const d of profilesSnapshot.docs) {
        const data = d.data();
        if (data.role === 'admin' || data.id === 'usr-admin-01') {
          matchedDocId = d.id;
          matchedProfile = data;
          break;
        }
      }
    }

    if (!matchedProfile || !matchedDocId) {
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
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Update last_login timestamp in Firestore
    const nowIso = new Date().toISOString();
    await setDoc(doc(db, 'profiles', matchedDocId), { last_login: nowIso }, { merge: true });

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

    const userDoc = await getDoc(doc(db, 'profiles', decoded.userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return res.json({
        user: {
          id: data.id || userDoc.id,
          fullName: data.full_name || data.username,
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

export default router;
