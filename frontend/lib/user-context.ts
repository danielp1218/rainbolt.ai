/**
 * Global user ID storage for Firebase sync
 * This is set by the app when user authentication is established
 */
let currentUserId: string | null = null;

export const setCurrentUserId = (userId: string | null) => {
    currentUserId = userId;
    console.log('[User Context] User ID set to:', userId);
};

export const getCurrentUserId = (): string | null => {
    return currentUserId;
};
