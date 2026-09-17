import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export const useLocation = () => {
  const { currentUser } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let watchId: number;

    if (sharing && currentUser && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPosition({ lat, lng });
          
          setDoc(doc(db, 'locations', currentUser.uid), {
            user_id: currentUser.uid,
            latitude: lat,
            longitude: lng,
            timestamp: Date.now(),
            sharing_enabled: true
          });
        },
        (err) => {
          setError(err.message);
          setSharing(false);
        },
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (currentUser && !sharing) {
        setDoc(doc(db, 'locations', currentUser.uid), {
          user_id: currentUser.uid,
          sharing_enabled: false,
          timestamp: Date.now()
        }, { merge: true });
      }
    };
  }, [sharing, currentUser]);

  return { sharing, setSharing, position, error };
};
