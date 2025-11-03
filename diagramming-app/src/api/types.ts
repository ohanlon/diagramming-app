/**
 * Type definitions for API requests and responses
 */

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  avatarFile?: File;
}

export interface RegisterResponse {
  user: User;
}

export interface UserSettings {
  themeMode?: 'light' | 'dark';
  [key: string]: unknown;
}

export interface UserSettingsResponse {
  settings: UserSettings;
}

export interface Diagram {
  id: string;
  name: string;
  version?: number;
  sheets: Record<string, any>;
  activeSheetId: string;
  createdAt?: string;
  updatedAt?: string;
  thumbnailDataUrl?: string | null;
  isSnapToGridEnabled?: boolean;
}

export interface SaveDiagramRequest {
  name: string;
  sheets: Record<string, any>;
  activeSheetId: string;
  version?: number;
  thumbnailDataUrl?: string | null;
  isSnapToGridEnabled?: boolean;
}

export interface SaveDiagramResponse {
  id: string;
  version: number;
}

export interface ShapeCategory {
  id: string;
  name: string;
}

export interface ShapeSubcategory {
  id: string;
  name: string;
  categoryId: string;
}

export type ShapeTextPosition = 'Inside' | 'Outside' | 'None';

export interface ShapeAsset {
  id: string;
  subcategoryId: string;
  title: string;
  path: string;
  originalFilename: string;
  textPosition: ShapeTextPosition;
  autosize: boolean;
  isProduction: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromoteShapesResponse {
  promoted: ShapeAsset[];
  errors: Array<{ id: string; message: string; code: string }>;
}

export interface DeleteShapeResponse {
  status: 'deleted' | 'soft_deleted';
  shape?: ShapeAsset;
}
