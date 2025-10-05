import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// TypeScript interfaces for your data structures
export interface UserSession {
  id: string;
  userId: string;
  auth0Id: string; // Link to Auth0 user ID
  email: string;
  displayName: string;
  profilePicture?: string;
  createdAt: any;
  lastActive: any;
}

// Globe Learning Session - focused on actual globe interactions
export interface GlobeSession {
  id: string;
  userId: string;
  title: string;
  status: 'active' | 'completed';
  createdAt: any;
  updatedAt: any;
  lastAccessedAt: any;
  
  // Globe interaction data
  globeImages: Array<{
    id: string;
    imageUrl: string; // Screenshot of the globe view
    location: { lat: number; lng: number };
    locationName?: string;
    timestamp: any;
    userNote?: string;
  }>;
  
  // Chat history during globe exploration
  chatHistory: Array<{
    id: string;
    role: 'user' | 'ai';
    message: string;
    timestamp: any;
    relatedImage?: string; // Reference to globe image ID
  }>;
}

// User session management functions
export const createUserSession = async (userData: Omit<UserSession, 'id' | 'createdAt' | 'lastActive'>) => {
  try {
    const userSessionData = {
      ...userData,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    };

    const docRef = doc(collection(db, 'userSessions'), userData.userId);
    await setDoc(docRef, userSessionData);

    return { success: true, id: userData.userId };
  } catch (error) {
    console.error('Error creating user session:', error);
    return { success: false, error: (error as Error).message };
  }
};

export const getUserSession = async (userId: string): Promise<UserSession | null> => {
  try {
    const docRef = doc(db, 'userSessions', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserSession;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
};

export const getUserByAuth0Id = async (auth0Id: string): Promise<UserSession | null> => {
  try {
    const q = query(collection(db, 'userSessions'), where('auth0Id', '==', auth0Id));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as UserSession;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by Auth0 ID:', error);
    return null;
  }
};

export const updateUserLastActive = async (userId: string) => {
  try {
    const docRef = doc(db, 'userSessions', userId);
    await updateDoc(docRef, {
      lastActive: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating last active:', error);
    return { success: false, error: (error as Error).message };
  }
};

// Globe session management functions
export const createGlobeSession = async (
  userId: string,
  title: string
) => {
  try {
    const sessionId = `globe_${userId}_${Date.now()}`;
    const globeSession: Omit<GlobeSession, 'id'> = {
      userId,
      title,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastAccessedAt: serverTimestamp(),
      globeImages: [],
      chatHistory: []
    };

    const docRef = doc(collection(db, 'globeSessions'), sessionId);
    await setDoc(docRef, globeSession);

    return { success: true, id: sessionId };
  } catch (error) {
    console.error('Error creating globe session:', error);
    return { success: false, error: (error as Error).message };
  }
};

export const getGlobeSession = async (sessionId: string): Promise<GlobeSession | null> => {
  try {
    const docRef = doc(db, 'globeSessions', sessionId);
    const sessionSnap = await getDoc(docRef);

    if (sessionSnap.exists()) {
      return { id: sessionSnap.id, ...sessionSnap.data() } as GlobeSession;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting globe session:', error);
    return null;
  }
};

export const getUserGlobeSessions = async (userId: string): Promise<GlobeSession[]> => {
  try {
    const q = query(collection(db, 'globeSessions'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const sessions: GlobeSession[] = [];
    querySnapshot.forEach((doc) => {
      sessions.push({ id: doc.id, ...doc.data() } as GlobeSession);
    });

    return sessions;
  } catch (error) {
    console.error('Error getting user globe sessions:', error);
    return [];
  }
};

export const deleteGlobeSession = async (sessionId: string) => {
  try {
    const sessionRef = doc(db, 'globeSessions', sessionId);
    await deleteDoc(sessionRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting globe session:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const addGlobeImage = async (
  sessionId: string,
  imageData: {
    imageUrl: string;
    location: { lat: number; lng: number };
    locationName?: string;
    userNote?: string;
  }
) => {
  try {
    const docRef = doc(db, 'globeSessions', sessionId);
    const sessionSnap = await getDoc(docRef);

    if (!sessionSnap.exists()) {
      return { success: false, error: 'Session not found' };
    }

    const sessionData = sessionSnap.data() as GlobeSession;
    const newImage = {
      id: `img_${Date.now()}`,
      ...imageData,
      timestamp: serverTimestamp()
    };

    const updatedImages = [...sessionData.globeImages, newImage];

    await updateDoc(docRef, {
      globeImages: updatedImages,
      updatedAt: serverTimestamp(),
      lastAccessedAt: serverTimestamp()
    });

    return { success: true, imageId: newImage.id };
  } catch (error) {
    console.error('Error adding globe image:', error);
    return { success: false, error: (error as Error).message };
  }
};

export const addChatMessage = async (
  sessionId: string,
  message: {
    role: 'user' | 'ai';
    message: string;
    relatedImage?: string;
  }
) => {
  try {
    const docRef = doc(db, 'globeSessions', sessionId);
    const sessionSnap = await getDoc(docRef);

    if (!sessionSnap.exists()) {
      return { success: false, error: 'Session not found' };
    }

    const sessionData = sessionSnap.data() as GlobeSession;
    const newMessage = {
      id: `chat_${Date.now()}`,
      ...message,
      timestamp: serverTimestamp()
    };

    const updatedChatHistory = [...sessionData.chatHistory, newMessage];

    await updateDoc(docRef, {
      chatHistory: updatedChatHistory,
      updatedAt: serverTimestamp(),
      lastAccessedAt: serverTimestamp()
    });

    return { success: true, messageId: newMessage.id };
  } catch (error) {
    console.error('Error adding chat message:', error);
    return { success: false, error: (error as Error).message };
  }
};