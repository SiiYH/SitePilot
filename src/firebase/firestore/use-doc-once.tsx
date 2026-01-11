'use client';

import { useState, useEffect } from 'react';
import {
  DocumentReference,
  DocumentData,
  FirestoreError,
  getDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDocOnce hook.
 * @template T Type of the document data.
 */
export interface UseDocOnceResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to fetch a single Firestore document once (one-time read).
 * Does NOT subscribe to real-time updates - use this for detail pages
 * where you don't need live updates.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted docRef or BAD THINGS WILL HAPPEN.
 * Use useMemo or useMemoFirebase to memoize it per React guidance.
 * Also make sure that its dependencies are stable references.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} docRef -
 * The Firestore DocumentReference. Waits if null/undefined.
 * @returns {UseDocOnceResult<T>} Object with data, isLoading, error.
 * 
 * @example
 * ```typescript
 * const userRef = useMemoFirebase(() => 
 *   userId ? doc(firestore, 'users', userId) : null, 
 *   [firestore, userId]
 * );
 * const { data: user, isLoading, error } = useDocOnce<User>(userRef);
 * ```
 */
export function useDocOnce<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocOnceResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    // If no ref provided, reset state
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Start loading
    setIsLoading(true);
    setError(null);

    // Fetch document once
    getDoc(memoizedDocRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          // Document exists, set data with id
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          // Document does not exist
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      })
      .catch((err: FirestoreError) => {
        // Handle permission errors with context
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        });

        setError(contextualError);
        setData(null);
        setIsLoading(false);

        // Trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      });
  }, [memoizedDocRef]); // Re-run if the memoizedDocRef changes

  return { data, isLoading, error };
}