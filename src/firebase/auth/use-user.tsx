
'use client';
import { useState, useEffect } from 'react';
import { Auth, User, onAuthStateChanged, AuthError } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';

interface UseUserResult {
  user: User | null;
  isUserLoading: boolean;
  userError: AuthError | null;
}

/**
 * Hook to get the current authenticated user from Firebase Auth.
 * It listens to authentication state changes in real-time.
 * @returns {UseUserResult} An object containing the user, loading state, and error.
 */
export function useUser(): UseUserResult {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState<boolean>(true);
  const [userError, setUserError] = useState<AuthError | null>(null);

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setIsUserLoading(false);
      },
      (error) => {
        setUserError(error);
        setIsUserLoading(false);
      }
    );

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [auth]); // Re-run effect if auth instance changes

  return { user, isUserLoading, userError };
}
