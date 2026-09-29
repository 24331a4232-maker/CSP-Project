import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

export type UserRole = 'ADMIN' | 'VOLUNTEER' | 'DONOR';

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  ADMIN: '/admin',
  VOLUNTEER: '/volunteer',
  DONOR: '/donor'
};

/**
 * Normalizes any string representation of a role to standard 'ADMIN' | 'VOLUNTEER' | 'DONOR'
 */
export function normalizeUserRole(role: any, fallback: UserRole = 'DONOR'): UserRole {
  if (!role) return fallback;
  const r = String(role).trim().toUpperCase();
  if (r === 'ADMIN' || r === 'ADMINISTRATOR') return 'ADMIN';
  if (r === 'VOLUNTEER' || r === 'DISPATCH' || r === 'DRIVER') return 'VOLUNTEER';
  if (r === 'DONOR' || r === 'NGO' || r === 'RESTAURANT' || r === 'HOTEL' || r === 'CATERER') return 'DONOR';
  return fallback;
}

/**
 * Returns the explicit URL dashboard route associated with a given user role
 * @example
 * getDashboardPathForRole('ADMIN') // => '/admin'
 * getDashboardPathForRole('VOLUNTEER') // => '/volunteer'
 * getDashboardPathForRole('DONOR') // => '/donor'
 */
export function getDashboardPathForRole(role: any, fallbackPath: string = '/donor'): string {
  const normalized = normalizeUserRole(role, 'DONOR');
  return ROLE_DASHBOARDS[normalized] || fallbackPath;
}

/**
 * Helper function to identify the user's role on login from their authenticated profile,
 * Firestore database documents (primary `users/{uid}` and partition collections), and session fallbacks.
 *
 * @param params Object containing user, docData, email, or username
 * @returns The verified UserRole ('ADMIN' | 'VOLUNTEER' | 'DONOR')
 */
export async function identifyUserRoleOnLogin(params: {
  user?: FirebaseUser | null;
  userData?: User | null;
  docData?: Record<string, any> | null;
  email?: string | null;
  username?: string | null;
  requestedRole?: string | null;
}): Promise<UserRole> {
  const { user, userData, docData, email, username, requestedRole } = params;

  // 1. Direct role property in provided userData or docData
  if (userData?.role) {
    return normalizeUserRole(userData.role);
  }
  if (docData?.role) {
    return normalizeUserRole(docData.role);
  }

  // 2. Direct identifier-based fast resolution
  const userEmail = (email || user?.email || userData?.email || '').trim().toLowerCase();
  const userName = (username || userData?.username || user?.displayName || '').trim().toLowerCase();

  if (
    userEmail === 'srikar.srikar0906@gmail.com' ||
    userEmail === 'admin@foodbridge.org' ||
    userName === 'foodbridge'
  ) {
    return 'ADMIN';
  }

  if (
    userEmail === 'john.volunteer@foodbridge.org' ||
    userName === 'john_doe' ||
    userName === 'volunteer'
  ) {
    return 'VOLUNTEER';
  }

  if (
    userEmail === 'catering@grandpalace.com' ||
    userEmail === 'contact@lumiere.com' ||
    userEmail === 'contact@cityshelter.org' ||
    userName === 'grand_palace' ||
    userName === 'lumiere_bistro' ||
    userName === 'city_shelter'
  ) {
    return 'DONOR';
  }

  // 3. Query Firestore user document if user UID is available
  const uid = user?.uid || userData?.id;
  if (uid) {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists() && userDocSnap.data()?.role) {
        return normalizeUserRole(userDocSnap.data().role);
      }

      // Check role-partitioned collections
      const [adminDoc, volDoc, donorDoc] = await Promise.all([
        getDoc(doc(db, 'admins', uid)),
        getDoc(doc(db, 'volunteers', uid)),
        getDoc(doc(db, 'donors', uid))
      ]);

      if (adminDoc.exists()) return 'ADMIN';
      if (volDoc.exists()) return 'VOLUNTEER';
      if (donorDoc.exists()) return 'DONOR';
    } catch (dbErr) {
      console.warn('Error verifying role in Firestore:', dbErr);
    }
  }

  // 4. Check cached session/local storage
  try {
    const cachedRole = localStorage.getItem('foodbridge_user_role') || sessionStorage.getItem('pending_reg_role');
    if (cachedRole) {
      return normalizeUserRole(cachedRole);
    }
  } catch (e) {}

  // 5. Fallback to requestedRole or default 'DONOR'
  if (requestedRole) {
    return normalizeUserRole(requestedRole);
  }

  return 'DONOR';
}

/**
 * High-level helper function to identify the user's role on login and immediately
 * redirect them to their specific role dashboard upon authentication.
 *
 * @param params Authentication context, user object, and navigation handler
 * @returns Object with the identified role, the target dashboard path, and redirect status
 */
export async function identifyRoleAndRedirectOnLogin(params: {
  user?: FirebaseUser | null;
  userData?: User | null;
  docData?: Record<string, any> | null;
  email?: string | null;
  username?: string | null;
  requestedRole?: string | null;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  options?: { replace?: boolean };
}): Promise<{ role: UserRole; dashboardPath: string }> {
  const { navigate, options = { replace: true }, ...identifyParams } = params;

  // 1. Identify user's role
  const role = await identifyUserRoleOnLogin(identifyParams);

  // 2. Resolve target dashboard path
  const dashboardPath = getDashboardPathForRole(role);

  // 3. Cache the verified role for session resilience
  try {
    localStorage.setItem('foodbridge_user_role', role);
  } catch (e) {}

  // 4. Ensure immediate redirection upon authentication
  navigate(dashboardPath, options);

  return { role, dashboardPath };
}

/**
 * Synchronous redirection helper when role is already known
 * @param role The user's role ('ADMIN' | 'VOLUNTEER' | 'DONOR')
 * @param navigate The React Router navigate function
 * @param options Navigation options (defaults to `{ replace: true }`)
 */
export function redirectToRoleDashboard(
  role: any,
  navigate: (path: string, options?: { replace?: boolean }) => void,
  options: { replace?: boolean } = { replace: true }
): string {
  const targetPath = getDashboardPathForRole(role);
  navigate(targetPath, options);
  return targetPath;
}
