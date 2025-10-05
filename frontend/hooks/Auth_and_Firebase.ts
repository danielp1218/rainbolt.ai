// filepath: /Users/jstwx07/Desktop/projects/rainboltai.ai/rainbolt.ai/frontend/hooks/useAuth0Firebase.ts
import { useUser } from '@auth0/nextjs-auth0/';
import { useEffect, useState } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function useAuth0Firebase() {
    const { user, isLoading } = useUser();
    const [firebaseUser, setFirebaseUser] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setFirebaseUser(null);
            return;
        }

        // Get custom Firebase token from your API
        const signInToFirebase = async () => {
            try {
                const response = await fetch('/api/firebase/token');
                const { token } = await response.json();

                if (token) {
                    const userCredential = await signInWithCustomToken(auth, token);
                    setFirebaseUser(userCredential.user);
                }
            } catch (err: any) {
                console.error('Firebase sign-in error:', err);
                setError(err.message);
            }
        };

        signInToFirebase();
    }, [user]);

    return { user, firebaseUser, isLoading, error };
}