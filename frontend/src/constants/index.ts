// ============================================
// CONSTANTS - BARREL EXPORT
// ============================================

export * from './menu';
export * from './reports';

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  NOTIFICATION: 'latest_report_notification',
  ACTIVE_JOB: 'ai_search_active_job',
  USER_REPORTS: 'user_reports',
} as const;

// API Endpoints (for reference)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  FILES: {
    LIST: '/auth/files',
    UPLOAD: '/auth/upload',
    DELETE: '/auth/file',
    VIEW: '/auth/file/view',
  },
  FOLDERS: {
    LIST: '/auth/folders',
    CREATE: '/auth/folder/create',
    DELETE: '/auth/folder',
    ANALYZE: '/auth/folder/analyze',
  },
  LINKS: {
    LIST: '/auth/links',
    ADD: '/auth/link/add',
    DELETE: '/auth/link',
  },
  REPORTS: {
    ANALYZE: '/auth/report/analyze',
  },
  CHAT: {
    ASK: '/auth/chat/ask',
  },
} as const;
