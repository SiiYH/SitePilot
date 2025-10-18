/* // @/hooks/useCurrentUser.ts
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { User } from '@/types';

export function useCurrentUser() {
  const { user: firebaseUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) return;

    const fetchUserData = async () => {
      if (!firebaseUser || !firestore) {
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserData({ id: userDoc.id, ...userDoc.data() } as User);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [firebaseUser, firestore, isUserLoading]);

  return { 
    user: userData, 
    loading: loading || isUserLoading,
    companyId: userData?.companyId,
    role: userData?.role 
  };
} */