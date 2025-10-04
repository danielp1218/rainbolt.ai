'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  UserSession, 
  getUserSession, 
  createUserSession, 
  updateUserLastActive,
  getUserByAuth0Id 
} from '@/lib/globe-database';

interface UserContextType {
  user: UserSession | null;
  loading: boolean;
  error: string | null;
  createUser: (userData: Omit<UserSession, 'id' | 'createdAt' | 'lastActive'>) => Promise<boolean>;
  updateLastActive: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
  auth0User?: any; // Auth0 user object from your friend's implementation
}

export const UserProvider = ({ children, auth0User }: UserProviderProps) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize user session when Auth0 user is available
  useEffect(() => {
    const initializeUser = async () => {
      if (!auth0User) {
        // For development: provide a mock user when no Auth0 user is present
        const isDevelopment = process.env.NODE_ENV === 'development';
        if (isDevelopment) {
          // Create a mock user for development
          const mockUser: UserSession = {
            id: 'dev_user_123',
            userId: 'dev_user_123',
            auth0Id: 'dev_auth0_123',
            email: 'student@example.com',
            displayName: 'Development Student',
            profilePicture: undefined,
            createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
            lastActive: { seconds: Date.now() / 1000, nanoseconds: 0 }
          };
          setUser(mockUser);
        } else {
          setUser(null);
        }
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First, try to find existing user by Auth0 ID
        let existingUser = await getUserByAuth0Id(auth0User.sub);

        if (!existingUser) {
          // Create new user if doesn't exist
          const newUserData = {
            userId: auth0User.sub, // Use Auth0 sub as user ID
            auth0Id: auth0User.sub,
            email: auth0User.email || '',
            displayName: auth0User.name || auth0User.nickname || 'Anonymous',
            profilePicture: auth0User.picture,
          };

          const result = await createUserSession(newUserData);
          if (result.success) {
            existingUser = await getUserSession(auth0User.sub);
          } else {
            throw new Error('Failed to create user session');
          }
        } else {
          // Update last active for existing user
          await updateUserLastActive(existingUser.id);
        }

        setUser(existingUser);
      } catch (err) {
        console.error('Error initializing user:', err);
        setError('Failed to initialize user session');
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [auth0User]);

  const createUser = async (userData: Omit<UserSession, 'id' | 'createdAt' | 'lastActive'>): Promise<boolean> => {
    try {
      setError(null);
      const result = await createUserSession(userData);
      if (result.success) {
        const newUser = await getUserSession(userData.userId);
        setUser(newUser);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Failed to create user');
      return false;
    }
  };

  const updateLastActive = async () => {
    if (!user) return;
    
    try {
      await updateUserLastActive(user.id);
    } catch (err) {
      console.error('Error updating last active:', err);
    }
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const updatedUser = await getUserSession(user.id);
      setUser(updatedUser);
    } catch (err) {
      console.error('Error refreshing user:', err);
      setError('Failed to refresh user data');
    }
  };

  // Update last active every 5 minutes when user is active
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      updateLastActive();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  const value: UserContextType = {
    user,
    loading,
    error,
    createUser,
    updateLastActive,
    refreshUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Example hook for game session management
export const useGameSession = () => {
  const { user } = useUser();
  
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [gameHistory, setGameHistory] = useState<any[]>([]);

  // Add your game session logic here
  // This is where you'll integrate with your game mechanics

  return {
    user,
    currentGame,
    gameHistory,
    // Add game-specific methods
  };
};