'use client';

import { useAuth } from '@/hooks/use-auth';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';

export function DebugAuth() {
  const { user, company, loading } = useAuth();
  const { user: firebaseUser } = useUser();
  const firestore = useFirestore();
  const [userDocExists, setUserDocExists] = useState<boolean | null>(null);
  const [userDocData, setUserDocData] = useState<any>(null);

  useEffect(() => {
    const checkUserDoc = async () => {
      if (!firebaseUser || !firestore) return;
      
      try {
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        setUserDocExists(userDoc.exists());
        if (userDoc.exists()) {
          setUserDocData(userDoc.data());
        }
      } catch (error) {
        console.error('Error checking user doc:', error);
      }
    };

    checkUserDoc();
  }, [firebaseUser, firestore]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4 bg-gray-100 rounded space-y-2 text-xs font-mono">
      <h3 className="font-bold text-lg">🔍 Auth Debug Info</h3>
      
      <div className="space-y-1">
        <p><strong>Firebase Auth User:</strong></p>
        <p>- UID: {firebaseUser?.uid || 'null'}</p>
        <p>- Email: {firebaseUser?.email || 'null'}</p>
      </div>

      <div className="space-y-1">
        <p><strong>User Document:</strong></p>
        <p>- Exists: {userDocExists === null ? 'checking...' : userDocExists ? '✅ Yes' : '❌ No'}</p>
        {userDocData && (
          <>
            <p>- ID: {user?.id || 'null'}</p>
            <p>- Role: {userDocData.role || 'null'}</p>
            <p>- CompanyId: {userDocData.companyId || 'null'}</p>
            <p>- Status: {userDocData.status || 'null'}</p>
          </>
        )}
      </div>

      <div className="space-y-1">
        <p><strong>Auth Context:</strong></p>
        <p>- User: {user ? '✅ Loaded' : '❌ Null'}</p>
        <p>- Company: {company ? '✅ Loaded' : '❌ Null'}</p>
        <p>- User Role: {user?.role || 'null'}</p>
        <p>- Company ID: {company?.id || 'null'}</p>
      </div>
    </div>
  );
}