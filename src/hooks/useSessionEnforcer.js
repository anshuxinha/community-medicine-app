import { useEffect, useContext, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getDeviceId } from '../utils/deviceUtils';
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

    const enforceSession = async () => {
      try {
        const localDeviceId = await getDeviceId();
        const userRef = doc(db, 'users', user.uid);

        unsubscribe = onSnapshot(userRef, async (docSnap) => {
          if (hasLoggedOutRef.current) return;

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.currentDeviceId && data.currentDeviceId !== localDeviceId) {
              // Another device took over — force logout immediately
              hasLoggedOutRef.current = true;
              await logout();
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
      unsubscribe();
    };
  }, [user]);
};