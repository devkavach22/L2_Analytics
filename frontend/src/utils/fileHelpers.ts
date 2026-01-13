// ============================================
// FILE HELPERS
// ============================================

import { FileText, FileImage, Rows, FileCode, File as FileIcon } from 'lucide-react';

export interface FileStyle {
  icon: typeof FileText;
  color: string;
  bg: string;
}

/**
 * Get file style based on extension
 */
export const getFileStyle = (ext: string): FileStyle => {
  const e = ext ? ext.toLowerCase() : 'file';
  
  if (['pdf'].includes(e)) {
    return { icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50' };
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(e)) {
    return { icon: FileImage, color: 'text-sky-500', bg: 'bg-sky-50' };
  }
  if (['doc', 'docx', 'txt'].includes(e)) {
    return { icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' };
  }
  if (['xls', 'xlsx', 'csv'].includes(e)) {
    return { icon: Rows, color: 'text-emerald-600', bg: 'bg-emerald-50' };
  }
  if (['js', 'ts', 'tsx', 'html', 'css', 'py', 'sql'].includes(e)) {
    return { icon: FileCode, color: 'text-orange-500', bg: 'bg-orange-50' };
  }
  
  return { icon: FileIcon, color: 'text-slate-400', bg: 'bg-slate-50' };
};

/**
 * Get file type category
 */
export const getFileCategory = (ext: string): string => {
  const e = ext.toLowerCase();
  
  if (['pdf'].includes(e)) return 'PDF';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(e)) return 'Image';
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(e)) return 'Document';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(e)) return 'Spreadsheet';
  if (['ppt', 'pptx', 'odp'].includes(e)) return 'Presentation';
  if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(e)) return 'Video';
  if (['mp3', 'wav', 'ogg', 'flac'].includes(e)) return 'Audio';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) return 'Archive';
  if (['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'java', 'cpp', 'c'].includes(e)) return 'Code';
  
  return 'Other';
};

/**
 * Check if file can be previewed
 */
export const canPreviewFile = (ext: string): boolean => {
  const previewable = [
    'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
    'txt', 'md', 'json', 'xml', 'html', 'css', 'js'
  ];
  return previewable.includes(ext.toLowerCase());
};

/**
 * Get MIME type from extension
 */
export const getMimeType = (ext: string): string => {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    xml: 'application/xml',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    zip: 'application/zip',
  };
  
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
};
