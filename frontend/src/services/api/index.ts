// ============================================
// API SERVICE - CENTRALIZED API CALLS
// ============================================

import Instance from '@/lib/axiosInstance';
import type {
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  ApiResponse,
  FileItem,
  FolderItem,
  LinkItem,
  ReportAnalysisPayload,
} from '@/types';

// ============================================
// AUTH API
// ============================================

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await Instance.post('/auth/login', payload);
    return response.data;
  },

  register: async (payload: RegisterPayload): Promise<ApiResponse> => {
    const response = await Instance.post('/auth/register', payload);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (token) {
      await Instance.post('/auth/logout', {}, {
        headers: { Authorization: token }
      });
    }
  },

  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const response = await Instance.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse> => {
    const response = await Instance.post('/auth/reset-password', { token, password });
    return response.data;
  },
};

// ============================================
// FILES API
// ============================================

export const filesApi = {
  getAll: async (): Promise<FileItem[]> => {
    const response = await Instance.get('/auth/files');
    return response.data.files || response.data || [];
  },

  upload: async (formData: FormData, folderId?: string): Promise<ApiResponse> => {
    const url = folderId ? `/auth/upload/${folderId}` : '/auth/upload';
    const response = await Instance.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  delete: async (fileId: string): Promise<ApiResponse> => {
    const response = await Instance.delete(`/auth/file/${fileId}`);
    return response.data;
  },

  view: async (fileId: string): Promise<Blob> => {
    const token = localStorage.getItem('token');
    const response = await Instance.get(`/auth/file/view/${fileId}`, {
      responseType: 'blob',
      headers: { Authorization: token || '' }
    });
    return response.data;
  },
};

// ============================================
// FOLDERS API
// ============================================

export const foldersApi = {
  getAll: async (): Promise<FolderItem[]> => {
    const response = await Instance.get('/auth/folders');
    return response.data.folders || response.data || [];
  },

  create: async (name: string, desc: string, userId: string, createdBy: string): Promise<ApiResponse> => {
    const response = await Instance.post('/auth/folder/create', {
      name, desc, userId, createdBy
    });
    return response.data;
  },

  delete: async (folderId: string): Promise<ApiResponse> => {
    const response = await Instance.delete(`/auth/folder/${folderId}`);
    return response.data;
  },

  analyze: async (folderId: string): Promise<ApiResponse> => {
    const response = await Instance.post(`/auth/folder/analyze/${folderId}`, {
      analyze_text: true,
      generate_charts: true
    });
    return response.data;
  },
};

// ============================================
// LINKS API
// ============================================

export const linksApi = {
  getAll: async (): Promise<LinkItem[]> => {
    const response = await Instance.get('/auth/links');
    return response.data.links || response.data || [];
  },

  add: async (url: string, folderId: string, userId: string): Promise<ApiResponse> => {
    const token = localStorage.getItem('token');
    const response = await Instance.post('/auth/link/add', 
      { url, folderId, userId },
      { headers: { Authorization: token || '' } }
    );
    return response.data;
  },

  delete: async (linkId: string): Promise<ApiResponse> => {
    const response = await Instance.delete(`/auth/link/${linkId}`);
    return response.data;
  },
};

// ============================================
// REPORTS API
// ============================================

export const reportsApi = {
  analyze: async (payload: ReportAnalysisPayload): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('reportType', payload.reportType);
    if (payload.keyword) formData.append('keyword', payload.keyword);
    if (payload.fileId) formData.append('fileId', payload.fileId);

    const response = await Instance.post('/auth/report/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  generate: async (targetId: string, targetType: string, reportType: string): Promise<ApiResponse> => {
    const token = localStorage.getItem('token');
    const response = await Instance.post('/auth/report/analyze', 
      { targetId, targetType, reportType },
      { headers: { Authorization: token || '', 'Content-Type': 'application/json' } }
    );
    return response.data;
  },
};

// ============================================
// CHAT API
// ============================================

export const chatApi = {
  ask: async (question: string, link?: string): Promise<{ answer: string }> => {
    const response = await Instance.post('/auth/chat/ask', { question, link });
    return response.data;
  },
};
