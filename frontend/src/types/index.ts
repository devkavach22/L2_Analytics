// ============================================
// COMMON TYPES
// ============================================

export interface User {
  _id?: string;
  id?: string;
  userId?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  token?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  msg?: string;
  data?: T;
}

// ============================================
// AUTH TYPES
// ============================================

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

// ============================================
// FILE & FOLDER TYPES
// ============================================

export interface FileItem {
  id: string;
  name: string;
  extension: string;
  size: number;
  pageCount: string | number;
  publicPath?: string;
  extractedText?: string;
  folderId?: string;
  userId?: string;
  createdAt?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  desc?: string;
  fileCount: number;
  createdAt: string;
  theme: 'orange' | 'blue' | 'emerald' | 'purple';
  userId?: string;
  creatorName?: string;
  totalSize?: number;
}

export interface LinkItem {
  id: string;
  url: string;
  title?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  ocrStatus?: 'pending' | 'completed';
  extractedText?: string;
  translatedText?: string;
  originalUrl?: string;
  folderId?: string;
}

// ============================================
// REPORT TYPES
// ============================================

export interface ReportItem {
  id: string | number;
  title: string;
  type: string;
  format: string;
  date: string;
  timestamp: string;
  status: 'Ready' | 'Failed' | 'Processing';
  downloadUrl?: string;
}

export interface ReportAnalysisPayload {
  reportType: string;
  keyword?: string;
  fileId?: string;
}

// ============================================
// CHAT TYPES
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

// ============================================
// MENU TYPES
// ============================================

export interface MenuItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

// ============================================
// STATS TYPES
// ============================================

export interface DashboardStats {
  processed: number;
  storage: number;
  storageUnit: string;
  hoursSaved: number;
}
