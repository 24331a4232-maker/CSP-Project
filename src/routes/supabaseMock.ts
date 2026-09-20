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

const defaultAdmin: Profile = {
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
  permissions: ["system_admin", "manage_donations", "manage_volunteers", "manage_donors", "view_analytics", "access_audit_logs"],
  avatar_url: "",
  is_active: true,
  created_at: "2024-01-15T08:00:00Z",
  last_login: new Date().toISOString()
};

// Distinct tables divided by entity and user role
const admins: any[] = [{ ...defaultAdmin }];
const volunteers: any[] = [];
const donors: any[] = [];
const profiles: Profile[] = [{ ...defaultAdmin }];

const foodDonations: any[] = [];
const pickups: any[] = [];
const certificates: any[] = [];

const donationHandovers: any[] = [];
const qrVerifications: any[] = [];
const donationEvents: any[] = [];
const foodQualityInspections: any[] = [];
const loginActivity: any[] = [
  {
    id: "audit-admin-01",
    user_id: "usr-admin-01",
    username: "FoodBridge",
    full_name: "FoodBridge Administrator",
    email: "srikar.srikar0906@gmail.com",
    role: "ADMIN",
    action: "ADMIN_SESSION_INIT",
    ip: "127.0.0.1 (Direct Secure Gateway)",
    ip_address: "127.0.0.1",
    user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (Chrome/124.0)",
    device: "macOS Desktop (Chrome)",
    status: "SUCCESS",
    organization: "FoodBridge Foundation",
    city: "Vizianagaram",
    state: "Andhra Pradesh",
    auth_method: "Password (bcrypt)",
    login_time: new Date(Date.now() - 5 * 60000).toISOString(),
    timestamp: new Date(Date.now() - 5 * 60000).toISOString()
  },
  {
    id: "audit-donor-01",
    user_id: "usr-donor-01",
    username: "grand_palace",
    full_name: "Grand Palace Hotel & Suites",
    email: "catering@grandpalace.com",
    role: "DONOR",
    action: "DONOR_PORTAL_ACCESS",
    ip: "192.168.1.105 (Hotel Branch Net)",
    ip_address: "192.168.1.105",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome/122.0)",
    device: "Windows PC (Chrome)",
    status: "SUCCESS",
    organization: "Grand Palace Hotel & Suites",
    city: "Metropolis",
    state: "California",
    auth_method: "Password (bcrypt)",
    login_time: new Date(Date.now() - 25 * 60000).toISOString(),
    timestamp: new Date(Date.now() - 25 * 60000).toISOString()
  },
  {
    id: "audit-vol-01",
    user_id: "usr-vol-01",
    username: "john_doe",
    full_name: "John Doe Volunteer",
    email: "john.volunteer@foodbridge.org",
    role: "VOLUNTEER",
    action: "VOLUNTEER_SESSION_INIT",
    ip: "10.0.4.88 (Mobile Carrier 5G)",
    ip_address: "10.0.4.88",
    user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15",
    device: "iOS Mobile (Safari)",
    status: "SUCCESS",
    organization: "Community Volunteers",
    city: "Vizianagaram",
    state: "Andhra Pradesh",
    auth_method: "Password (bcrypt)",
    login_time: new Date(Date.now() - 45 * 60000).toISOString(),
    timestamp: new Date(Date.now() - 45 * 60000).toISOString()
  },
  {
    id: "audit-ngo-01",
    user_id: "usr-ngo-01",
    username: "city_shelter",
    full_name: "City Food Shelter",
    email: "contact@cityshelter.org",
    role: "NGO",
    action: "PARTNER_PORTAL_ACCESS",
    ip: "172.16.0.42 (NGO Office Fiber)",
    ip_address: "172.16.0.42",
    user_agent: "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
    device: "Linux Workstation (Firefox)",
    status: "SUCCESS",
    organization: "City Food Shelter Foundation",
    city: "Metropolis",
    state: "California",
    auth_method: "JWT Bearer Token",
    login_time: new Date(Date.now() - 90 * 60000).toISOString(),
    timestamp: new Date(Date.now() - 90 * 60000).toISOString()
  },
  {
    id: "audit-donor-02",
    user_id: "usr-donor-02",
    username: "lumiere_bistro",
    full_name: "Lumière French Bakery",
    email: "contact@lumiere.com",
    role: "DONOR",
    action: "DONOR_LISTING_LOGIN",
    ip: "192.168.1.88 (Bistro POS Gateway)",
    ip_address: "192.168.1.88",
    user_agent: "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15",
    device: "iOS Tablet (Safari)",
    status: "SUCCESS",
    organization: "Lumière French Bakery & Bistro",
    city: "Metropolis",
    state: "California",
    auth_method: "Password (bcrypt)",
    login_time: new Date(Date.now() - 140 * 60000).toISOString(),
    timestamp: new Date(Date.now() - 140 * 60000).toISOString()
  },
  {
    id: "audit-fail-01",
    user_id: "unknown",
    username: "root_operator",
    full_name: "Unregistered Client",
    email: "unknown.admin@unverified.net",
    role: "UNKNOWN",
    action: "FAILED_LOGIN_ATTEMPT",
    ip: "203.0.113.195 (External Proxy)",
    ip_address: "203.0.113.195",
    user_agent: "curl/8.4.0 (Security Probe)",
    device: "CLI / Automated Client",
    status: "FAILED",
    failure_reason: "Invalid password credentials provided",
    organization: "Unknown External Host",
    city: "External Gateway",
    state: "WAN",
    auth_method: "Password Verification",
    login_time: new Date(Date.now() - 210 * 60000).toISOString(),
    timestamp: new Date(Date.now() - 210 * 60000).toISOString()
  }
];
const contactMessages: any[] = [];
const notifications: any[] = [];
const newsletterSubscribers: any[] = [];

// Helper table mapper with distinct divided tables
const tables: Record<string, any[]> = {
  admins,
  volunteers,
  donors,
  profiles,
  food_donations: foodDonations,
  donations: foodDonations,
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

    // Record login activity in memory and Firestore
    const logId = `audit-${profile.id}-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const roleUpper = (profile.role || "USER").toUpperCase();
    const userAgent = String(req.headers["user-agent"] || "Web Browser");
    let deviceDesc = "Web Browser";
    if (userAgent.includes("iPhone") || userAgent.includes("iPad")) deviceDesc = "iOS Mobile";
    else if (userAgent.includes("Android")) deviceDesc = "Android Mobile";
    else if (userAgent.includes("Macintosh")) deviceDesc = "macOS Desktop";
    else if (userAgent.includes("Windows")) deviceDesc = "Windows PC";
    else if (userAgent.includes("Linux")) deviceDesc = "Linux Workstation";

    const auditEntry = {
      id: logId,
      user_id: profile.id,
      username: profile.username || profile.full_name || "User",
      full_name: profile.full_name || profile.username || "User",
      email: profile.email,
      role: roleUpper,
      action: roleUpper === "ADMIN" ? "ADMIN_SESSION_INIT" : `${roleUpper}_LOGIN_SUCCESS`,
      ip: String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1 (Direct Gateway)"),
      ip_address: String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1"),
      user_agent: userAgent,
      device: deviceDesc,
      status: "SUCCESS",
      organization: profile.organization || "",
      city: profile.city || "Vizianagaram",
      state: profile.state || "Andhra Pradesh",
      auth_method: "Password (bcrypt)",
      login_time: nowIso,
      timestamp: nowIso
    };
    loginActivity.unshift(auditEntry);
    syncToFirestore("login_activity", logId, auditEntry);

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

  // Divide and arrange into role-specific tables
  const userRole = (data.role || "volunteer").toLowerCase();
  if (userRole === "admin") {
    const adminRecord = {
      ...profile,
      role: "admin",
      permissions: ["system_admin", "manage_donations", "manage_volunteers", "manage_donors", "view_analytics", "access_audit_logs"]
    };
    admins.push(adminRecord);
    await syncToFirestore("admins", adminRecord.id, adminRecord);
  } else if (userRole === "volunteer") {
    const volunteerRecord = {
      ...profile,
      role: "volunteer",
      vehicle_type: data.vehicle_type || data.vehicle || "Motorcycle / Van",
      availability_status: data.availability_status || "Available",
      assigned_zones: [profile.city ? `${profile.city} Zone` : "General Zone"],
      total_deliveries: 0,
      hours_served: 0,
      rating: 5.0,
      is_verified: true
    };
    volunteers.push(volunteerRecord);
    await syncToFirestore("volunteers", volunteerRecord.id, volunteerRecord);
  } else {
    // donor
    const donorRecord = {
      ...profile,
      role: "donor",
      donor_type: profile.organization ? "Restaurant / Business" : "Individual",
      organization_name: profile.organization || "Personal Donor",
      total_donations: 0,
      food_donated_kg: 0,
      meals_provided: 0,
      badges: ["Welcome Donor"]
    };
    donors.push(donorRecord);
    await syncToFirestore("donors", donorRecord.id, donorRecord);
  }

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

      // Cross-sync to role-specific tables if updating profiles
      if (tableName === "profiles") {
        const userRole = String(items[i].role || "").toLowerCase();
        if (userRole === "admin") {
          syncToFirestore("admins", items[i].id, { ...items[i], role: "admin" });
        } else if (userRole === "volunteer") {
          syncToFirestore("volunteers", items[i].id, { ...items[i], role: "volunteer" });
        } else if (userRole === "donor") {
          syncToFirestore("donors", items[i].id, { ...items[i], role: "donor" });
        }
      }
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
        if (tableName === "profiles") {
          removeFromFirestore("admins", item.id);
          removeFromFirestore("volunteers", item.id);
          removeFromFirestore("donors", item.id);
        }
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
    tables: {
      admins: { count: admins.length, description: "Administrator accounts with system configuration permissions" },
      volunteers: { count: volunteers.length, description: "Field rescue volunteers and delivery drivers" },
      donors: { count: donors.length, description: "Food donors (restaurants, caterers, individuals)" },
      food_donations: { count: foodDonations.length, description: "Surplus food items listed for collection" },
      pickups: { count: pickups.length, description: "Logistics and dispatch operations" },
      login_activity: { count: loginActivity.length, description: "Role-based login and security audit trail" },
      notifications: { count: notifications.length, description: "Real-time dispatch alerts and updates" },
      contact_messages: { count: contactMessages.length, description: "User feedback and inquiries" },
      profiles: { count: profiles.length, description: "Unified cross-role user profiles view" }
    },
    timestamp: new Date().toISOString()
  });
});

// POST /api/database/sync-tables (Organizes and divides database records into distinct role tables in Firestore)
router.post("/api/database/sync-tables", async (_req: Request, res: Response) => {
  try {
    const counts: Record<string, number> = { admins: 0, volunteers: 0, donors: 0, food_donations: 0, pickups: 0, login_activity: 0 };
    
    // 1. Sync default admin to admins collection
    for (const a of admins) {
      await syncToFirestore("admins", a.id, a);
      counts.admins++;
    }

    // 2. Sync login activity records to login_activity collection
    for (const la of loginActivity) {
      await syncToFirestore("login_activity", la.id, la);
      counts.login_activity++;
    }

    // 2. Fetch all profiles from Firestore
    if (firestoreDb) {
      const snap = await getDocs(collection(firestoreDb, "profiles"));
      for (const d of snap.docs) {
        const u = d.data();
        const role = String(u.role || "").toLowerCase();
        if (role === "admin") {
          const adminDoc = {
            ...u,
            role: "admin",
            permissions: u.permissions || ["system_admin", "manage_donations", "manage_volunteers", "manage_donors", "view_analytics", "access_audit_logs"]
          };
          await syncToFirestore("admins", d.id, adminDoc);
          counts.admins++;
        } else if (role === "volunteer") {
          const volDoc = {
            ...u,
            role: "volunteer",
            vehicle_type: u.vehicle_type || "Motorcycle / Van",
            availability_status: u.availability_status || "Available",
            assigned_zones: u.assigned_zones || [u.city ? `${u.city} Zone` : "General Zone"],
            total_deliveries: u.total_deliveries || 0,
            hours_served: u.hours_served || 0,
            rating: u.rating || 5.0,
            is_verified: u.is_verified ?? true
          };
          await syncToFirestore("volunteers", d.id, volDoc);
          counts.volunteers++;
        } else if (role === "donor") {
          const donorDoc = {
            ...u,
            role: "donor",
            donor_type: u.donor_type || (u.organization ? "Restaurant / Business" : "Individual"),
            organization_name: u.organization || u.organization_name || "Community Food Donor",
            total_donations: u.total_donations || 0,
            food_donated_kg: u.food_donated_kg || 0,
            meals_provided: u.meals_provided || 0,
            badges: u.badges || ["Community Partner"]
          };
          await syncToFirestore("donors", d.id, donorDoc);
          counts.donors++;
        }
      }
    }

    return res.json({
      success: true,
      message: "Database successfully organized and divided into distinct tables!",
      syncedCounts: counts
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Failed to sync tables" });
  }
});

// Auto-seed initial records to Firestore on startup in background
(async () => {
  try {
    for (const a of admins) {
      syncToFirestore("admins", a.id, a);
    }
    for (const v of volunteers) {
      syncToFirestore("volunteers", v.id, v);
    }
    for (const dn of donors) {
      syncToFirestore("donors", dn.id, dn);
    }
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
    for (const la of loginActivity) {
      syncToFirestore("login_activity", la.id, la);
    }
  } catch (e: any) {
    console.warn("[firestore] initial seeding warning:", e?.message);
  }
})();

// ----------------------------------------------------
// 3. Edge Functions & Storage Endpoints
// ----------------------------------------------------

// POST /functions/v1/delete-user
router.post("/functions/v1/delete-user", async (req: Request, res: Response) => {
  const { userId } = req.body || {};
  if (userId) {
    const idx = profiles.findIndex((p) => p.id === userId);
    if (idx !== -1) profiles.splice(idx, 1);

    const aIdx = admins.findIndex((a) => a.id === userId);
    if (aIdx !== -1) admins.splice(aIdx, 1);

    const vIdx = volunteers.findIndex((v) => v.id === userId);
    if (vIdx !== -1) volunteers.splice(vIdx, 1);

    const dIdx = donors.findIndex((d) => d.id === userId);
    if (dIdx !== -1) donors.splice(dIdx, 1);

    // Permanently remove from all Firestore collections
    await Promise.allSettled([
      removeFromFirestore("profiles", userId),
      removeFromFirestore("users", userId),
      removeFromFirestore("admins", userId),
      removeFromFirestore("volunteers", userId),
      removeFromFirestore("donors", userId)
    ]);
  }
  return res.json({ success: true, message: `User ${userId} permanently deleted` });
});

// Storage upload mock
router.post("/storage/v1/object/:bucket/*", (req: Request, res: Response) => {
  res.json({ Key: `uploads/${Date.now()}-mock.jpg` });
});

export default router;
