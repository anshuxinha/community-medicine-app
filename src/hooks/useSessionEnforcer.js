import { useEffect, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getDeviceId } from '../utils/deviceUtils';
import { isForeignDeviceSession } from '../utils/sessionPolicy';
import { Alert } from 'react-native';

export const useSessionEnforcer = () => {
  const { user, logout } = useContext(AppContext);
  const hasLoggedOutRef = useRef(false);

  useEffect(() => {
    if (!user?.uid) {
      hasLoggedOutRef.current = false;
      return;
    }

    let unsubscribe = () => {};
    let cancelled = false;

    const enforceSession = async () => {
      try {
        const localDeviceId = await getDeviceId();
        if (cancelled) return;
        const userRef = doc(db, 'users', user.uid);

        unsubscribe = onSnapshot(userRef, async (docSnap) => {
          if (hasLoggedOutRef.current) return;

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (isForeignDeviceSession(data.currentDeviceId, localDeviceId)) {
              hasLoggedOutRef.current = true;
              await logout({ kickedByOtherDevice: true });
              Alert.alert(
                "Session Expired",
                "You have been logged out because your account was accessed from another device."
              );
            }
          }
        }, (error) => {
          console.warn("Session enforcer snapshot error:", error.message);
        });
      } catch (error) {
        console.warn("Error setting up session enforcer:", error.message);
      }
    };

    enforceSession();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user?.uid, logout]);
};