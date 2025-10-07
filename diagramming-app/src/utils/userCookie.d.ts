export type MinimalUser = { id: string; username: string; avatarUrl?: string; roles?: string[] } | null;
export declare function setCurrentUserCookie(user: any, maxAgeSec?: number): void;
export declare function getCurrentUserFromCookie(): MinimalUser;
export declare function clearCurrentUserCookie(): void;
