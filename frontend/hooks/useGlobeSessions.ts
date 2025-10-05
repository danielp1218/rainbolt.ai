import { useState, useEffect } from 'react';
import { useAuth0Firebase } from './useAuth0Firebase';
import { getUserGlobeSessions, createGlobeSession, deleteGlobeSession, GlobeSession } from '@/lib/globe-database';

export function useGlobeSessions() {
    const { firebaseUserId } = useAuth0Firebase();
    const [sessions, setSessions] = useState<GlobeSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load sessions from database
    const loadSessions = async () => {
        if (!firebaseUserId) {
            setSessions([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const userSessions = await getUserGlobeSessions(firebaseUserId);
            setSessions(userSessions);
        } catch (err: any) {
            console.error('Error loading sessions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Create a new session
    const createNewSession = async (title: string) => {
        if (!firebaseUserId) {
            throw new Error('User not authenticated');
        }

        try {
            const result = await createGlobeSession(firebaseUserId, title);

            if (result.success && result.id) {
                // Reload sessions to include the new one
                await loadSessions();
                return result.id;
            } else {
                throw new Error(result.error || 'Failed to create session');
            }
        } catch (err: any) {
            console.error('Error creating session:', err);
            setError(err.message);
            throw err;
        }
    };

    // Delete a session
    const deleteSession = async (sessionId: string) => {
        try {
            const result = await deleteGlobeSession(sessionId);
            
            if (result.success) {
                // Remove from local state immediately for better UX
                setSessions(prev => prev.filter(session => session.id !== sessionId));
            } else {
                throw new Error(result.error || 'Failed to delete session');
            }
        } catch (err: any) {
            console.error('Error deleting session:', err);
            setError(err.message);
            throw err;
        }
    };

    // Load sessions when user changes
    useEffect(() => {
        loadSessions();
    }, [firebaseUserId]);

    return {
        sessions,
        loading,
        error,
        createNewSession,
        deleteSession,
        refreshSessions: loadSessions
    };
}