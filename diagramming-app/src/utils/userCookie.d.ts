export type MinimalUser = { id: string; username: string; avatarUrl?: string; isAdmin?: boolean } | null;
export declare function setCurrentUserCookie(user: any, maxAgeSec?: number): void;
export declare function getCurrentUserFromCookie(): MinimalUser;
export declare function clearCurrentUserCookie(): void;
