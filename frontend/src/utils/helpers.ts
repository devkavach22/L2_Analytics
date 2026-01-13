// ============================================
// UTILITY HELPERS
// ============================================

import type { User } from '@/types';

/**
 * Get user ID from user object (handles different ID field names)
 */
export const getUserId = (user: User | null): string | null => {
  if (!user) return null;
  return user._id || user.id || user.userId || null;
};

/**
 * Format bytes to human readable string
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals < 0 ? 0 : decimals)) + ' ' + sizes[i];
};

/**
 * Format date to locale string
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(date).toLocaleDateString('en-US', options || defaultOptions);
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || 'file';
};

/**
 * Check if file is an image
 */
export const isImageFile = (extension: string): boolean => {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension.toLowerCase());
};

/**
 * Check if file is a document
 */
export const isDocumentFile = (extension: string): boolean => {
  return ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension.toLowerCase());
};

/**
 * Check if file is a spreadsheet
 */
export const isSpreadsheetFile = (extension: string): boolean => {
  return ['xls', 'xlsx', 'csv', 'ods'].includes(extension.toLowerCase());
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Sleep/delay utility
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Safe JSON parse
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};
