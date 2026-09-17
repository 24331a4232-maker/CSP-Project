import { Router, Request, Response } from "express";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const router = Router();

// Initialize Firebase Firestore connection
const fbApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const firestoreDb = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId || "(default)");

// Helper to safely persist records to Firestore in background
async function syncToFirestore(table: string, id: string, data: any) {
  try {
    const docRef = doc(firestoreDb, table, String(id));
    const cleanData = JSON.parse(JSON.stringify(data));
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err: any) {
    console.warn(`[firestore] Sync error for ${table}/${id}:`, err?.message);
  }
}

async function removeFromFirestore(table: string, id: string) {
  try {
    const docRef = doc(firestoreDb, table, String(id));
    await deleteDoc(docRef);
  } catch (err: any) {
    console.warn(`[firestore] Delete error for ${table}/${id}:`, err?.message);
  }
}

// In-memory data store for Supabase tables
interface Profile {
  id: string;
  full_name: string;
  email: string;
  username: string;
  phone: string;
  role: "admin" | "volunteer" | "donor" | "restaurant" | "ngo";
  organization?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  avatar_url?: string;
  is_active?: boolean;
  created_at: string;
  last_login?: string;
  [key: string]: any;
}

const profiles: Profile[] = [
  {
    id: "usr-admin-01",
    full_name: "FoodBridge Administrator",
    email: "admin@foodbridge.org",
    username: "FoodBridge",
    password: "Food@12",
    phone: "7780447031",
    role: "admin",
    organization: "FoodBridge Foundation",
    city: "Vizianagaram",
    state: "Andhra Pradesh",
    pincode: "535003",
    address: "MVGR College Of Engineering",
    avatar_url: "",
    is_active: true,
    created_at: "2024-01-15T08:00:00Z",
    last_login: new Date().toISOString()
  }
];

const foodDonations: any[] = [];
const pickups: any[] = [];
const certificates: any[] = [];

const donationHandovers: any[] = [];
const qrVerifications: any[] = [];
const donationEvents: any[] = [];
const foodQualityInspections: any[] = [];
const loginActivity: any[] = [];
const contactMessages: any[] = [];
const notifications: any[] = [];
const newsletterSubscribers: any[] = [];

// Helper table mapper
const tables: Record<string, any[]> = {
  profiles,
  food_donations: foodDonations,
  pickups,
  certificates,
  donation_handovers: donationHandovers,
  qr_verifications: qrVerifications,
  donation_events: donationEvents,
  food_quality_inspections: foodQualityInspections,
  login_activity: loginActivity,
  contact_messages: contactMessages,
  notifications,
  newsletter_subscribers: newsletterSubscribers,
};

// Generate JWT-like token
function createToken(userId: string, email: string, role: string) {
  return `mock-jwt-${userId}-${Date.now()}`;
}

// ----------------------------------------------------
// 1. Supabase Auth Endpoints (/auth/v1/*)
// ----------------------------------------------------

// POST /auth/v1/token
router.post("/auth/v1/token", (req: Request, res: Response) => {
  const grantType = (req.query.grant_type as string) || req.body?.grant_type || "password";

  if (grantType === "password") {
    const { email, password } = req.body || {};
    const cleanEmail = (email || "").trim().toLowerCase();

    // Look for existing profile by email or username
    let profile = profiles.find(
      (p) => p.email.toLowerCase() === cleanEmail || p.username.toLowerCase() === cleanEmail
    );

    // Specifically handle FoodBridge admin aliases
    if (cleanEmail === "foodbridge" || cleanEmail === "foodbridge29" || cleanEmail === "admin@foodbridge.org") {
      profile = profiles.find((p) => p.role === "admin") || profile;
    }

    // Verify admin credentials strictly
    if (profile && profile.role === "admin") {
      if (password !== "Food@12") {
        return res.status(400).json({
          error: "invalid_grant",
          error_description: "Invalid login credentials"
        });
      }
    }

    // If profile not found, create a fallback profile based on the entered identifier
    if (!profile) {
      const isFoodbridgeAdmin = cleanEmail === "foodbridge" || cleanEmail.includes("admin");
      if (isFoodbridgeAdmin) {
        if (password !== "Food@12") {
          return res.status(400).json({
            error: "invalid_grant",
            error_description: "Invalid login credentials"
          });
        }
      }
      profile = {
        id: `usr-${Date.now()}`,
        full_name: isFoodbridgeAdmin ? "FoodBridge Administrator" : cleanEmail.split("@")[0] || "FoodBridge User",
        email: cleanEmail.includes("@") ? cleanEmail : `${cleanEmail}@example.com`,
        username: isFoodbridgeAdmin ? "FoodBridge" : cleanEmail.split("@")[0],
        password: isFoodbridgeAdmin ? "Food@12" : password,
        phone: isFoodbridgeAdmin ? "7780447031" : "+1 (555) 000-0000",
        role: isFoodbridgeAdmin ? "admin" : "volunteer",
        organization: "FoodBridge Community",
        city: isFoodbridgeAdmin ? "Vizianagaram" : "Metropolis",
        state: isFoodbridgeAdmin ? "Andhra Pradesh" : "California",
        pincode: isFoodbridgeAdmin ? "535003" : "94105",
        address: isFoodbridgeAdmin ? "MVGR College Of Engineering" : "Metropolis Downtown",
        is_active: true,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      };
      profiles.push(profile);
    } else {
      profile.last_login = new Date().toISOString();
    }

    const token = createToken(profile.id, profile.email, profile.role);
    const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 7;

    return res.json({
      access_token: token,
      token_type: "bearer",
      expires_in: 86400 * 7,
      expires_at: expiresAt,
      refresh_token: `mock-refresh-${profile.id}`,
      user: {
        id: profile.id,
        aud: "authenticated",
        role: "authenticated",
        email: profile.email,
        phone: profile.phone,
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: {
          full_name: profile.full_name,
          username: profile.username,
          role: profile.role,
          phone: profile.phone,
          organization: profile.organization,
          city: profile.city,
          state: profile.state,
          pincode: profile.pincode,
          address: profile.address
        },
        created_at: profile.created_at,
        updated_at: new Date().toISOString()
      }
    });
  }

  // Refresh token fallback
  return res.json({
    access_token: `mock-refresh-token-${Date.now()}`,
    token_type: "bearer",
    expires_in: 86400 * 7,
    expires_at: Math.floor(Date.now() / 1000) + 86400 * 7,
    refresh_token: `mock-refresh-${Date.now()}`,
    user: profiles[0]
  });
});

// POST /auth/v1/signup
router.post("/auth/v1/signup", async (req: Request, res: Response) => {
  const { email, password, data = {} } = req.body || {};
  const cleanEmail = (email || "").trim().toLowerCase();
  const username = (data.username || cleanEmail.split("@")[0] || "").trim();
  const phone = (data.phone || "").trim();
  const cleanPhoneDigits = phone.replace(/\D/g, "");

  // Check Firestore profiles
  try {
    const snap = await getDocs(collection(firestoreDb, "profiles"));
    
    // Check 1: Username unique
    if (username) {
      const usernameExists = snap.docs.some(
        (d) => d.data().username && d.data().username.trim().toLowerCase() === username.toLowerCase()
      );
      if (usernameExists) {
        return res.status(400).json({
          error: "Username already exists. Please choose another username.",
          message: "Username already exists. Please choose another username."
        });
      }
    }

    // Check 2: Email unique
    if (cleanEmail) {
      const emailExists = snap.docs.some(
        (d) => d.data().email && d.data().email.trim().toLowerCase() === cleanEmail
      );
      if (emailExists) {
        return res.status(400).json({
          error: "Email already registered. Please login.",
          message: "Email already registered. Please login."
        });
      }
    }

    // Check 3: Phone unique
    if (cleanPhoneDigits.length >= 7) {
      const phoneExists = snap.docs.some((d) => {
        const p = d.data().phone;
        if (!p) return false;
        const pDigits = p.replace(/\D/g, "");
        if (pDigits === cleanPhoneDigits) return true;
        if (pDigits.length >= 10 && cleanPhoneDigits.length >= 10) {
          return pDigits.slice(-10) === cleanPhoneDigits.slice(-10);
        }
        return false;
      });
      if (phoneExists) {
        return res.status(400).json({
          error: "Phone number already registered.",
          message: "Phone number already registered."
        });
      }
    }
  } catch (err: any) {
    console.warn("[supabaseMock] Pre-signup Firestore uniqueness check error:", err?.message);
  }

  const newId = `usr-${Date.now()}`;
  const nowIso = new Date().toISOString();
  const profile: Profile = {
    id: newId,
    full_name: (data.full_name || username).trim(),
    email: cleanEmail,
    username,
    phone,
    role: data.role || "volunteer",
    organization: (data.organization || "").trim(),
    city: (data.city || "").trim(),
    state: (data.state || "").trim(),
    pincode: (data.pincode || "").trim(),
    address: (data.address || "").trim(),
    is_active: true,
    created_at: nowIso,
    last_login: nowIso
  };
  profiles.push(profile);
  await syncToFirestore("profiles", profile.id, profile);

  const token = createToken(profile.id, profile.email, profile.role);
  const expiresAt = Math.floor(Date.now() / 1000) + 86400 * 7;

  return res.status(200).json({
    user: {
      id: profile.id,
      aud: "authenticated",
      role: "authenticated",
      email: profile.email,
      phone: profile.phone,
      app_metadata: { provider: "email" },
      user_metadata: data,
      created_at: profile.created_at,
      updated_at: new Date().toISOString()
    },
    session: {
      access_token: token,
      token_type: "bearer",
      expires_in: 86400 * 7,
      expires_at: expiresAt,
      refresh_token: `mock-refresh-${profile.id}`,
      user: {
        id: profile.id,
        email: profile.email,
        user_metadata: data
      }
    }
  });
});

// GET /auth/v1/user
router.get("/auth/v1/user", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  const profile = profiles.find((p) => token.includes(p.id)) || profiles[0];

  return res.json({
    id: profile.id,
    aud: "authenticated",
    role: "authenticated",
    email: profile.email,
    phone: profile.phone,
    user_metadata: {
      full_name: profile.full_name,
      username: profile.username,
      role: profile.role
    }
  });
});

// POST /auth/v1/logout
router.post("/auth/v1/logout", (_req: Request, res: Response) => {
  res.status(200).json({});
});

// POST /auth/v1/recover
router.post("/auth/v1/recover", (_req: Request, res: Response) => {
  res.status(200).json({});
});

// ----------------------------------------------------
// 2. PostgREST Endpoints (/rest/v1/:table)
// ----------------------------------------------------

// Filter parser for PostgREST
function matchesFilter(item: any, key: string, val: any): boolean {
  if (val == null) return true;

  if (Array.isArray(val)) {
    return val.every((singleVal) => matchesFilter(item, key, singleVal));
  }

  if (typeof val !== "string") {
    val = String(val);
  }

  // Handle PostgREST 'or' condition: ?or=(status.eq.Available,status.eq.Assigned)
  if (key === "or") {
    const raw = val.startsWith("(") && val.endsWith(")") ? val.slice(1, -1) : val;
    const parts = raw.split(",");
    return parts.some((part: string) => {
      const dotIdx = part.indexOf(".");
      if (dotIdx === -1) return true;
      const subKey = part.slice(0, dotIdx);
      const subVal = part.slice(dotIdx + 1);
      return matchesFilter(item, subKey, subVal);
    });
  }

  // Handle not.<operator>
  if (val.startsWith("not.")) {
    const rest = val.slice(4);
    if (rest === "is.null") {
      return item[key] != null && item[key] !== "";
    }
    if (rest.startsWith("eq.")) {
      return String(item[key] ?? "") !== rest.slice(3);
    }
    if (rest.startsWith("in.(")) {
      const inItems = rest.slice(4, -1).split(",").map((s: string) => s.trim().replace(/^["']|["']$/g, ""));
      return !inItems.includes(String(item[key] ?? ""));
    }
    if (rest.startsWith("ilike.")) {
      const target = rest.slice(6).toLowerCase();
      const itemVal = String(item[key] || "").toLowerCase();
      return !itemVal.includes(target);
    }
    if (rest.startsWith("like.")) {
      const target = rest.slice(5);
      return !String(item[key] || "").includes(target);
    }
    return !matchesFilter(item, key, rest);
  }

  if (val.startsWith("eq.")) {
    const target = val.slice(3);
    return String(item[key] ?? "") === target;
  }
  if (val.startsWith("neq.")) {
    const target = val.slice(4);
    return String(item[key] ?? "") !== target;
  }
  if (val.startsWith("ilike.")) {
    const target = val.slice(6).toLowerCase();
    const itemVal = String(item[key] || "").toLowerCase();
    return itemVal === target || itemVal.includes(target);
  }
  if (val.startsWith("like.")) {
    const target = val.slice(5);
    return String(item[key] || "").includes(target);
  }
  if (val.startsWith("in.(")) {
    const inItems = val.slice(4, -1).split(",").map((s: string) => s.trim().replace(/^["']|["']$/g, ""));
    return inItems.includes(String(item[key] ?? ""));
  }
  if (val.startsWith("gte.")) {
    const target = Number(val.slice(4));
    return Number(item[key]) >= target;
  }
  if (val.startsWith("lte.")) {
    const target = Number(val.slice(4));
    return Number(item[key]) <= target;
  }
  if (val.startsWith("gt.")) {
    const target = Number(val.slice(3));
    return Number(item[key]) > target;
  }
  if (val.startsWith("lt.")) {
    const target = Number(val.slice(3));
    return Number(item[key]) < target;
  }
  if (val === "is.null") {
    return item[key] == null || item[key] === "";
  }
  if (val.startsWith("is.")) {
    const target = val.slice(3);
    if (target === "null") return item[key] == null || item[key] === "";
    if (target === "true") return Boolean(item[key]) === true;
    if (target === "false") return Boolean(item[key]) === false;
    return String(item[key] ?? "") === target;
  }
  if (val.startsWith("cs.{")) {
    const target = val.slice(4, -1);
    const itemVal = item[key];
    if (Array.isArray(itemVal)) return itemVal.map(String).includes(target);
    return String(itemVal || "").includes(target);
  }
  return String(item[key] ?? "") === val;
}

// GET /rest/v1/:table
router.get("/rest/v1/:table", (req: Request, res: Response) => {
  const tableName = req.params.table;
  let items = tables[tableName];

  if (!items) {
    items = [];
    tables[tableName] = items;
  }

  // Filter items
  let result = [...items];
  const query = req.query as Record<string, string>;

  for (const [key, val] of Object.entries(query)) {
    if (["select", "order", "limit", "offset", "count", "head"].includes(key)) continue;
    result = result.filter((item) => matchesFilter(item, key, val));
  }

  // Handle special case: lookup admin or sync profiles with Firestore
  if (tableName === "profiles" && query.username && result.length === 0) {
    const rawUserParam = Array.isArray(query.username) ? String(query.username[0] || "") : String(query.username || "");
    let requestedUser = "";
    if (rawUserParam.startsWith("ilike.")) requestedUser = rawUserParam.slice(6);
    else if (rawUserParam.startsWith("eq.")) requestedUser = rawUserParam.slice(3);
    else requestedUser = rawUserParam;

    if (requestedUser) {
      const isAdmin = requestedUser.toLowerCase() === "foodbridge" || requestedUser.toLowerCase() === "foodbridge29" || requestedUser.toLowerCase().includes("admin");
      const existingAdmin = isAdmin ? profiles.find((p) => p.role === "admin") : null;
      if (existingAdmin) {
        result = [existingAdmin];
      }
    }
  }

  // Sorting
  if (query.order) {
    const orderStr = Array.isArray(query.order) ? String(query.order[0]) : String(query.order);
    const [col, dir] = orderStr.split(".");
    const asc = dir !== "desc";
    result.sort((a, b) => {
      const va = a[col];
      const vb = b[col];
      if (va < vb) return asc ? -1 : 1;
      if (va > vb) return asc ? 1 : -1;
      return 0;
    });
  }

  // Pagination
  const total = result.length;
  if (query.offset) {
    result = result.slice(Number(query.offset));
  }
  if (query.limit) {
    result = result.slice(0, Number(query.limit));
  }

  // Field selection
  if (query.select && query.select !== "*") {
    const selectStr = Array.isArray(query.select) ? String(query.select[0]) : String(query.select);
    const fields = selectStr.split(",").map((s) => s.trim());
    result = result.map((item) => {
      const projected: any = {};
      for (const f of fields) {
        if (f in item) projected[f] = item[f];
      }
      return projected;
    });
  }

  // Content-Range header for count
  if (query.count === "exact" || req.headers["prefer"]?.includes("count=exact")) {
    res.setHeader("content-range", `0-${Math.max(0, result.length - 1)}/${total}`);
  }

  // If HEAD request or head=true
  if (req.method === "HEAD" || query.head === "true") {
    res.setHeader("content-range", `*/${total}`);
    return res.status(200).end();
  }

  // Accept single object
  const acceptHeader = req.headers["accept"] || "";
  if (acceptHeader.includes("application/vnd.pgrst.object+json")) {
    if (result.length > 0) {
      return res.status(200).json(result[0]);
    }
    return res.status(200).json(null);
  }

  return res.status(200).json(result);
});

// POST /rest/v1/:table
router.post("/rest/v1/:table", (req: Request, res: Response) => {
  const tableName = req.params.table;
  let items = tables[tableName];
  if (!items) {
    items = [];
    tables[tableName] = items;
  }

  const payload = req.body;
  const toInsert = Array.isArray(payload) ? payload : [payload];

  for (const item of toInsert) {
    const record = {
      id: item.id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: item.created_at || new Date().toISOString(),
      ...item
    };
    items.push(record);
    syncToFirestore(tableName, record.id, record);
  }

  const acceptHeader = req.headers["accept"] || "";
  if (acceptHeader.includes("application/vnd.pgrst.object+json")) {
    return res.status(201).json(toInsert[0]);
  }

  return res.status(201).json(toInsert);
});

// PATCH /rest/v1/:table
router.patch("/rest/v1/:table", (req: Request, res: Response) => {
  const tableName = req.params.table;
  let items = tables[tableName];
  if (!items) {
    items = [];
    tables[tableName] = items;
  }

  const query = req.query as Record<string, string>;
  const updates = req.body || {};
  const updated: any[] = [];

  for (let i = 0; i < items.length; i++) {
    let match = true;
    for (const [key, val] of Object.entries(query)) {
      if (["select", "order", "limit", "offset", "count"].includes(key)) continue;
      if (!matchesFilter(items[i], key, val)) {
        match = false;
        break;
      }
    }
    if (match) {
      items[i] = { ...items[i], ...updates, updated_at: new Date().toISOString() };
      updated.push(items[i]);
      syncToFirestore(tableName, items[i].id, items[i]);
    }
  }

  const acceptHeader = req.headers["accept"] || "";
  if (acceptHeader.includes("application/vnd.pgrst.object+json")) {
    return res.status(200).json(updated[0] || null);
  }

  return res.status(200).json(updated);
});

// DELETE /rest/v1/:table
router.delete("/rest/v1/:table", (req: Request, res: Response) => {
  const tableName = req.params.table;
  let items = tables[tableName];
  if (!items) return res.status(200).json([]);

  const query = req.query as Record<string, string>;
  const kept: any[] = [];
  for (const item of items) {
    let match = true;
    for (const [key, val] of Object.entries(query)) {
      if (["select", "order", "limit", "offset", "count"].includes(key)) continue;
      if (matchesFilter(item, key, val)) {
        removeFromFirestore(tableName, item.id);
        match = false;
        break;
      }
    }
    if (match) kept.push(item);
  }

  tables[tableName] = kept;
  return res.status(200).json([]);
});

// ----------------------------------------------------
// 3. Database Status & Edge Functions
// ----------------------------------------------------

// GET /api/database/status
router.get("/api/database/status", (_req: Request, res: Response) => {
  res.json({
    status: "connected",
    provider: "Google Cloud Firestore",
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId || "(default)",
    collections: {
      profiles: profiles.length,
      food_donations: foodDonations.length,
      pickups: pickups.length,
      certificates: certificates.length,
      donation_handovers: donationHandovers.length
    },
    timestamp: new Date().toISOString()
  });
});

// Auto-seed initial records to Firestore on startup in background
(async () => {
  try {
    for (const p of profiles) {
      syncToFirestore("profiles", p.id, p);
    }
    for (const d of foodDonations) {
      syncToFirestore("food_donations", d.id, d);
    }
    for (const pk of pickups) {
      syncToFirestore("pickups", pk.id, pk);
    }
    for (const c of certificates) {
      syncToFirestore("certificates", c.id, c);
    }
  } catch (e: any) {
    console.warn("[firestore] initial seeding warning:", e?.message);
  }
})();

// ----------------------------------------------------
// 3. Edge Functions & Storage Endpoints
// ----------------------------------------------------

// POST /functions/v1/delete-user
router.post("/functions/v1/delete-user", (req: Request, res: Response) => {
  const { userId } = req.body || {};
  if (userId) {
    const idx = profiles.findIndex((p) => p.id === userId);
    if (idx !== -1) profiles.splice(idx, 1);
  }
  return res.json({ success: true });
});

// Storage upload mock
router.post("/storage/v1/object/:bucket/*", (req: Request, res: Response) => {
  res.json({ Key: `uploads/${Date.now()}-mock.jpg` });
});

export default router;
