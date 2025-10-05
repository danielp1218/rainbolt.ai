import { StateStorage } from 'zustand/middleware';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

interface FirebaseStorageOptions {
    getUserId: () => string | null;
    getSessionId?: () => string | null;
    collectionName?: string;
}

/**
 * Creates a Zustand storage that syncs with Firebase Firestore
 * Falls back to localStorage if Firebase is unavailable or user is not authenticated
 */
export function createFirebaseStorage(options: FirebaseStorageOptions): StateStorage {
    const { getUserId, getSessionId, collectionName = 'globeSessions' } = options;
    
    // Create a queue for pending writes to avoid overwhelming Firebase
    let writeQueue: Array<{ key: string; value: string }> = [];
    let writeTimer: NodeJS.Timeout | null = null;
    
    const processWriteQueue = async () => {
        if (writeQueue.length === 0) return;
        
        const userId = getUserId();
        const sessionId = getSessionId ? getSessionId() : null;
        
        if (!userId) {
            // If no user, write to localStorage only (browser only)
            if (typeof window !== 'undefined') {
                writeQueue.forEach(({ key, value }) => {
                    try {
                        localStorage.setItem(key, value);
                    } catch (e) {
                        console.error('Error writing to localStorage:', e);
                    }
                });
            }
            writeQueue = [];
            return;
        }
        
        // Batch all queued writes
        const updates = writeQueue.reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
        }, {} as Record<string, string>);
        
        writeQueue = [];
        
        try {
            if (sessionId && collectionName === 'globeSessions') {
                // Save to globeSessions with data in the data map field
                const docRef = doc(db, collectionName, sessionId);
                
                // First check if the document exists
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    // Update existing session - merge into data field
                    await updateDoc(docRef, {
                        [`data.${Object.keys(updates)[0]}`]: Object.values(updates)[0],
                        updatedAt: serverTimestamp(),
                        lastAccessedAt: serverTimestamp()
                    });
                } else {
                    // Create new session document
                    await setDoc(docRef, {
                        userId,
                        title: 'Chat Session',
                        status: 'active',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        lastAccessedAt: serverTimestamp(),
                        data: updates
                    });
                    
                    // Add sessionId to user's sessionIds array
                    try {
                        const userDocRef = doc(db, 'userSessions', userId);
                        await updateDoc(userDocRef, {
                            sessionIds: arrayUnion(sessionId)
                        });
                        console.log('[Firebase Storage] Added sessionId to user:', sessionId);
                    } catch (error) {
                        console.error('[Firebase Storage] Error updating user sessionIds:', error);
                    }
                }
                
                console.log('[Firebase Storage] Synced to globeSessions:', sessionId, Object.keys(updates));
            } else {
                // Fallback to old behavior for other collections
                const docRef = doc(db, collectionName, userId);
                await setDoc(docRef, updates, { merge: true });
                console.log('[Firebase Storage] Synced to Firebase:', Object.keys(updates));
            }
        } catch (error) {
            console.error('[Firebase Storage] Error syncing to Firebase:', error);
            // Fall back to localStorage (browser only)
            if (typeof window !== 'undefined') {
                Object.entries(updates).forEach(([key, value]) => {
                    try {
                        localStorage.setItem(key, value);
                    } catch (e) {
                        console.error('Error writing to localStorage:', e);
                    }
                });
            }
        }
    };
    
    return {
        getItem: async (name: string): Promise<string | null> => {
            const userId = getUserId();
            
            // Try localStorage first (synchronous, faster) - only in browser
            if (typeof window !== 'undefined') {
                try {
                    const localValue = localStorage.getItem(name);
                    if (localValue) {
                        console.log('[Firebase Storage] Loaded from localStorage:', name);
                        return localValue;
                    }
                } catch (e) {
                    console.error('Error reading from localStorage:', e);
                }
            }
            
            // If user is authenticated, try Firebase
            if (userId) {
                try {
                    const sessionId = getSessionId ? getSessionId() : null;
                    
                    if (sessionId && collectionName === 'globeSessions') {
                        // Read from globeSessions data field
                        const docRef = doc(db, collectionName, sessionId);
                        const docSnap = await getDoc(docRef);
                        
                        if (docSnap.exists()) {
                            const sessionData = docSnap.data();
                            const dataMap = sessionData.data || {};
                            const value = dataMap[name];
                            
                            if (value) {
                                console.log('[Firebase Storage] Loaded from globeSessions:', name);
                                // Cache in localStorage for faster subsequent loads (browser only)
                                if (typeof window !== 'undefined') {
                                    try {
                                        localStorage.setItem(name, value);
                                    } catch (e) {
                                        console.error('Error caching to localStorage:', e);
                                    }
                                }
                                return value;
                            }
                        }
                    } else {
                        // Fallback to old behavior
                        const docRef = doc(db, collectionName, userId);
                        const docSnap = await getDoc(docRef);
                        
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            const value = data[name];
                            
                            if (value) {
                                console.log('[Firebase Storage] Loaded from Firebase:', name);
                                // Cache in localStorage for faster subsequent loads (browser only)
                                if (typeof window !== 'undefined') {
                                    try {
                                        localStorage.setItem(name, value);
                                    } catch (e) {
                                        console.error('Error caching to localStorage:', e);
                                    }
                                }
                                return value;
                            }
                        }
                    }
                } catch (error) {
                    console.error('[Firebase Storage] Error reading from Firebase:', error);
                }
            }
            
            return null;
        },
        
        setItem: async (name: string, value: string): Promise<void> => {
            // Always write to localStorage immediately (synchronous backup) - only in browser
            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem(name, value);
                } catch (e) {
                    console.error('Error writing to localStorage:', e);
                }
            }
            
            // Queue write to Firebase (debounced to avoid too many writes)
            writeQueue.push({ key: name, value });
            
            // Clear existing timer
            if (writeTimer) {
                clearTimeout(writeTimer);
            }
            
            // Set new timer to batch writes
            writeTimer = setTimeout(() => {
                processWriteQueue();
                writeTimer = null;
            }, 1000); // Wait 1 second before syncing to Firebase
        },
        
        removeItem: async (name: string): Promise<void> => {
            const userId = getUserId();
            const sessionId = getSessionId ? getSessionId() : null;
            
            // Remove from localStorage - only in browser
            if (typeof window !== 'undefined') {
                try {
                    localStorage.removeItem(name);
                } catch (e) {
                    console.error('Error removing from localStorage:', e);
                }
            }
            
            // Remove from Firebase if authenticated
            if (userId) {
                try {
                    if (sessionId && collectionName === 'globeSessions') {
                        // Remove from globeSessions data field
                        const docRef = doc(db, collectionName, sessionId);
                        await updateDoc(docRef, {
                            [`data.${name}`]: null,
                            updatedAt: serverTimestamp()
                        });
                        console.log('[Firebase Storage] Removed from globeSessions:', name);
                    } else {
                        // Fallback to old behavior
                        const docRef = doc(db, collectionName, userId);
                        await setDoc(docRef, { [name]: null }, { merge: true });
                        console.log('[Firebase Storage] Removed from Firebase:', name);
                    }
                } catch (error) {
                    console.error('[Firebase Storage] Error removing from Firebase:', error);
                }
            }
        }
    };
}
