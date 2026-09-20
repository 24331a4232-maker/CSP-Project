import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Check in-flight registration role if active
          const pendingRole = sessionStorage.getItem('pending_reg_role')?.toUpperCase();

          // 1. Query partitioned collections and user records simultaneously
          const [admDoc, volDoc, donDoc, userDoc, profDoc] = await Promise.all([
            getDoc(doc(db, 'admins', user.uid)),
            getDoc(doc(db, 'volunteers', user.uid)),
            getDoc(doc(db, 'donors', user.uid)),
            getDoc(doc(db, 'users', user.uid)),
            getDoc(doc(db, 'profiles', user.uid))
          ]);

          const userEmail = (user.email || '').trim().toLowerCase();

          // 2. Authoritative role resolution
          let resolvedRole: 'ADMIN' | 'VOLUNTEER' | 'DONOR';

          if (userEmail === 'srikar.srikar0906@gmail.com' || userEmail === 'admin@foodbridge.org' || admDoc.exists()) {
            resolvedRole = 'ADMIN';
          } else if (volDoc.exists() || pendingRole === 'VOLUNTEER' || userEmail === 'john.volunteer@foodbridge.org') {
            resolvedRole = 'VOLUNTEER';
          } else if (donDoc.exists() || pendingRole === 'DONOR' || userEmail === 'catering@grandpalace.com' || userEmail === 'contact@lumiere.com' || userEmail === 'contact@cityshelter.org') {
            resolvedRole = 'DONOR';
          } else {
            // Check stored role in userDoc or profDoc
            const docRole = String(userDoc.data()?.role || profDoc.data()?.role || localStorage.getItem('foodbridge_user_role') || '').toUpperCase();
            if (docRole === 'ADMIN') {
              resolvedRole = 'ADMIN';
            } else if (docRole === 'VOLUNTEER') {
              resolvedRole = 'VOLUNTEER';
            } else {
              resolvedRole = 'DONOR';
            }
          }

          // Cache verified role in localStorage
          localStorage.setItem('foodbridge_user_role', resolvedRole);

          const mergedProfile = {
            ...(profDoc.exists() ? profDoc.data() : {}),
            ...(userDoc.exists() ? userDoc.data() : {}),
            ...(admDoc.exists() ? admDoc.data() : {}),
            ...(volDoc.exists() ? volDoc.data() : {}),
            ...(donDoc.exists() ? donDoc.data() : {})
          };

          const completeUserData: User = {
            id: user.uid,
            name: mergedProfile.name || mergedProfile.full_name || user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email || mergedProfile.email || '',
            username: mergedProfile.username || user.email?.split('@')[0] || 'user',
            created_at: mergedProfile.created_at || Date.now(),
            ...mergedProfile,
            role: resolvedRole
          };

          setUserData(completeUserData);

          // 3. Ensure document is synchronized in users and partitioned collection
          const { setDoc } = await import('firebase/firestore');
          setDoc(doc(db, 'users', user.uid), completeUserData, { merge: true }).catch(() => {});
          
          if (resolvedRole === 'VOLUNTEER' && !volDoc.exists()) {
            setDoc(doc(db, 'volunteers', user.uid), {
              ...completeUserData,
              role: 'volunteer',
              vehicle_type: 'Standard Transport',
              availability_status: 'Available',
              assigned_zones: ['General Zone'],
              rating: 5.0,
              is_verified: true
            }, { merge: true }).catch(() => {});
          } else if (resolvedRole === 'DONOR' && !donDoc.exists()) {
            setDoc(doc(db, 'donors', user.uid), {
              ...completeUserData,
              role: 'donor',
              donor_type: 'Individual',
              organization_name: completeUserData.name,
              badges: ['FoodBridge Donor']
            }, { merge: true }).catch(() => {});
          }
        } catch (err) {
          console.warn('AuthContext user fetch error:', err);
          const cachedRole = (localStorage.getItem('foodbridge_user_role') || '').toUpperCase();
          const fallbackRole: 'ADMIN' | 'VOLUNTEER' | 'DONOR' = 
            (user.email === 'srikar.srikar0906@gmail.com' || user.email === 'admin@foodbridge.org') ? 'ADMIN' :
            (cachedRole === 'VOLUNTEER' || user.email === 'john.volunteer@foodbridge.org') ? 'VOLUNTEER' : 'DONOR';

          setUserData({
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            username: user.email?.split('@')[0] || 'user',
            role: fallbackRole,
            created_at: Date.now()
          });
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
