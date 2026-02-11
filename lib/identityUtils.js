
/**
 * Standardizes user identity from various input formats (Trip Member, Clerk User, Email, etc.)
 * into a consistent { id, name, isMe } object.
 * 
 * @param {Object|string} input - The user object or ID string to standardize
 * @param {string} ownerId - The ID of the trip owner
 * @param {string} currentUserId - The ID of the currently logged-in user (optional)
 * @param {string} ownerName - The display name of the owner (optional)
 * @returns {Object|null} - { id, name, isMe } or null if invalid
 */
export const standardizeIdentity = (input, ownerId, currentUserId, ownerName) => {
    if (!input) return null;

    const rawId = typeof input === 'string' ? input : (input.userId || input.id);
    const rawName = typeof input === 'string' ? '' : (input.fullName || input.name || input.display_name || input.firstName || input.email || '');
    const rawEmail = typeof input === 'string' ? '' : (input.email || '');

    // CHECK 1: OWNER
    // Always map the Owner to the Trip User ID.
    if (rawId === ownerId) {
        return {
            id: ownerId,
            name: currentUserId === ownerId ? "Me (You)" : (ownerName || "Owner"),
            isMe: currentUserId === ownerId
        };
    }

    // CHECK 2: PRIYANSHU (Hardcoded Fix - STABLE ID as requested in previous context)
    // Preserving this specific logic from the codebase
    if (rawEmail === 'shardapriyanshu10@gmail.com' || (rawName && rawName.toLowerCase().includes('priyanshu')) || rawName === 'shardapriyanshu10@gmail.com') {
        return {
            id: 'canonical_priyanshu',
            name: "Priyanshu",
            isMe: false
        };
    }

    // CHECK 3: CURRENT USER (Dynamic Display Label ONLY)
    if (rawId === currentUserId) {
        return {
            id: rawId,
            name: "Me (You)",
            isMe: true
        };
    }

    // CHECK 4: DEFAULT
    return {
        id: rawId,
        name: rawName || 'Unknown',
        isMe: false
    };
};
