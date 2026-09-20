import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          
          // Listen to the single source of truth in real-time
          unsubscribeDoc = onSnapshot(userRef, async (docSnap) => {
            const userEmail = (user.email || '').trim().toLowerCase();
            const pendingRole = sessionStorage.getItem('pending_reg_role')?.toUpperCase();
            const cachedRole = (localStorage.getItem('foodbridge_user_role') || '').toUpperCase();

            let resolvedRole: 'ADMIN' | 'VOLUNTEER' | 'DONOR';

            // 1. Primary Source of Truth: Firestore User Document Role
            if (docSnap.exists() && docSnap.data()?.role) {
              const r = String(docSnap.data().role).toUpperCase();
              if (r === 'ADMIN' || r === 'VOLUNTEER' || r === 'DONOR') {
                resolvedRole = r;
              } else {
                resolvedRole = 'DONOR';
              }
            } else if (userEmail === 'srikar.srikar0906@gmail.com' || userEmail === 'admin@foodbridge.org') {
              resolvedRole = 'ADMIN';
            } else if (userEmail === 'john.volunteer@foodbridge.org') {
              resolvedRole = 'VOLUNTEER';
            } else if (userEmail === 'catering@grandpalace.com' || userEmail === 'contact@lumiere.com' || userEmail === 'contact@cityshelter.org') {
              resolvedRole = 'DONOR';
            } else if (pendingRole === 'ADMIN' || pendingRole === 'VOLUNTEER' || pendingRole === 'DONOR') {
              resolvedRole = pendingRole;
            } else if (cachedRole === 'ADMIN' || cachedRole === 'VOLUNTEER' || cachedRole === 'DONOR') {
              resolvedRole = cachedRole as any;
            } else {
              resolvedRole = 'DONOR';
            }

            localStorage.setItem('foodbridge_user_role', resolvedRole);

            if (docSnap.exists()) {
              const data = docSnap.data();
              let rawDate = data.created_at || Date.now();
              if (typeof rawDate === 'string') {
                rawDate = new Date(rawDate).getTime();
              }

              // Preserve uid, email, role, and registration data (created_at)
              const updatedUser: User = {
                id: user.uid,
                name: data.name || data.full_name || user.displayName || userEmail.split('@')[0] || 'User',
                email: data.email || user.email || '',
                username: data.username || userEmail.split('@')[0] || 'user',
                created_at: rawDate,
                last_login: data.last_login || null,
                is_active: data.is_active ?? true,
                phone: data.phone || '',
                organization: data.organization || data.organization_name || '',
                city: data.city || data.serviceCity || '',
                state: data.state || '',
                pincode: data.pincode || '',
                address: data.address || '',
                bio: data.bio || '',
                avatar_url: data.avatar_url || data.profilePicUrl || '',
                availability: data.availability || data.availability_status || '',
                updated_at: data.updated_at || Date.now(),
                ...data,
                // Strict immutable fields guarantee
                uid: user.uid,
                role: resolvedRole
              } as User;

              setUserData(updatedUser);
            } else {
              // Create document in users/{uid} preserving uid, email, role, created_at
              const nowMs = Date.now();
              const initialUser: User = {
                id: user.uid,
                name: user.displayName || userEmail.split('@')[0] || 'User',
                email: user.email || '',
                username: userEmail.split('@')[0] || 'user',
                role: resolvedRole,
                created_at: nowMs,
                is_active: true,
                last_login: new Date().toISOString()
              };

              await setDoc(userRef, initialUser, { merge: true }).catch((e) => {
                console.warn('Initial user setDoc error:', e);
              });

              setUserData(initialUser);
            }
            setLoading(false);
          }, (err) => {
            console.warn('AuthContext users onSnapshot error:', err);
            setLoading(false);
          });
        } catch (err) {
          console.warn('AuthContext user fetch error:', err);
          setLoading(false);
        }
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
