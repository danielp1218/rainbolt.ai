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

// Session Link Interface
export interface SessionLink {
  id: string;
  userId: string;
  fromSessionId: string;
  toSessionId: string;
  createdAt: any;
  updatedAt: any;
  linkType?: 'related' | 'sequential' | 'reference'; // Optional categorization
  description?: string; // Optional description of the relationship
}

// Create a link between two sessions
export const createSessionLink = async (
  userId: string,
  fromSessionId: string,
  toSessionId: string,
  linkType: 'related' | 'sequential' | 'reference' = 'related',
  description?: string
): Promise<{ success: boolean; linkId?: string; error?: string }> => {
  try {
    const linkId = `link_${fromSessionId}_${toSessionId}_${Date.now()}`;
    const linkRef = doc(db, 'sessionLinks', linkId);

    const linkData: Partial<SessionLink> = {
      id: linkId,
      userId,
      fromSessionId,
      toSessionId,
      linkType,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Only add description if it's provided and not undefined
    if (description !== undefined && description !== null && description.trim() !== '') {
      linkData.description = description;
    }

    await setDoc(linkRef, linkData);
    return { success: true, linkId };
  } catch (error) {
    console.error('Error creating session link:', error);
    return { success: false, error: (error as Error).message };
  }
};

// Get all links for a user
export const getUserSessionLinks = async (userId: string): Promise<SessionLink[]> => {
  try {
    console.log('getUserSessionLinks called with userId:', userId);
    const linksQuery = query(
      collection(db, 'sessionLinks'),
      where('userId', '==', userId)
    );
    
    console.log('Executing Firestore query...');
    const linksSnapshot = await getDocs(linksQuery);
    console.log('Firestore query result:', linksSnapshot.size, 'documents');
    
    const links = linksSnapshot.docs.map(doc => {
      const data = doc.data() as SessionLink;
      console.log('Link document:', doc.id, data);
      return data;
    });
    
    console.log('Returning links:', links);
    return links;
  } catch (error) {
    console.error('Error fetching user session links:', error);
    return [];
  }
};

// Delete a session link
export const deleteSessionLink = async (linkId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await deleteDoc(doc(db, 'sessionLinks', linkId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting session link:', error);
    return { success: false, error: (error as Error).message };
  }
};

// Delete all links related to a session (called when deleting a session)
export const deleteSessionLinks = async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Find all links that involve this session
    const fromLinksQuery = query(
      collection(db, 'sessionLinks'),
      where('fromSessionId', '==', sessionId)
    );
    const toLinksQuery = query(
      collection(db, 'sessionLinks'),
      where('toSessionId', '==', sessionId)
    );

    const [fromSnapshot, toSnapshot] = await Promise.all([
      getDocs(fromLinksQuery),
      getDocs(toLinksQuery)
    ]);

    // Delete all found links
    const deletePromises = [
      ...fromSnapshot.docs.map(doc => deleteDoc(doc.ref)),
      ...toSnapshot.docs.map(doc => deleteDoc(doc.ref))
    ];

    await Promise.all(deletePromises);
    return { success: true };
  } catch (error) {
    console.error('Error deleting session links:', error);
    return { success: false, error: (error as Error).message };
  }
};