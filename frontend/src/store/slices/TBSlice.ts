// ============================================
// TB SLICE - MAIN API SLICE (Reference Pattern)
// ============================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import CONFIG from '@/config';
import type { RootState } from '@/store';
import type { 
  FileItem, 
  FolderItem, 
  LinkItem, 
  ReportItem, 
  User,
  ChatMessage 
} from '@/types';

// ============================================
// TYPES
// ============================================

interface TBState {
  // Auth
  isLogin: boolean;
  isLoginFetching: boolean;
  LoginData: User | null;
  
  isRegister: boolean;
  isRegisterFetching: boolean;
  RegisterData: any;

  // Files
  isFilesGet: boolean;
  isFilesGetFetching: boolean;
  FilesGetData: FileItem[];

  isFileUpload: boolean;
  isFileUploadFetching: boolean;
  FileUploadData: any;

  isFileDelete: boolean;
  isFileDeleteFetching: boolean;

  // Folders
  isFoldersGet: boolean;
  isFoldersGetFetching: boolean;
  FoldersGetData: FolderItem[];

  isFolderCreate: boolean;
  isFolderCreateFetching: boolean;
  FolderCreateData: any;

  isFolderDelete: boolean;
  isFolderDeleteFetching: boolean;

  // Links
  isLinksGet: boolean;
  isLinksGetFetching: boolean;
  LinksGetData: LinkItem[];

  isLinkAdd: boolean;
  isLinkAddFetching: boolean;

  isLinkDelete: boolean;
  isLinkDeleteFetching: boolean;

  // Reports
  isReportGenerate: boolean;
  isReportGenerateFetching: boolean;
  ReportGenerateData: any;
  ReportContent: string;
  ReportsHistory: ReportItem[];

  // Chat
  isChatSend: boolean;
  isChatSendFetching: boolean;
  ChatMessages: ChatMessage[];

  // Common
  isSuccess: boolean;
  successMessage: string;
  isError: boolean;
  errorMessage: string;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: TBState = {
  // Auth
  isLogin: false,
  isLoginFetching: false,
  LoginData: null,
  
  isRegister: false,
  isRegisterFetching: false,
  RegisterData: null,

  // Files
  isFilesGet: false,
  isFilesGetFetching: false,
  FilesGetData: [],

  isFileUpload: false,
  isFileUploadFetching: false,
  FileUploadData: null,

  isFileDelete: false,
  isFileDeleteFetching: false,

  // Folders
  isFoldersGet: false,
  isFoldersGetFetching: false,
  FoldersGetData: [],

  isFolderCreate: false,
  isFolderCreateFetching: false,
  FolderCreateData: null,

  isFolderDelete: false,
  isFolderDeleteFetching: false,

  // Links
  isLinksGet: false,
  isLinksGetFetching: false,
  LinksGetData: [],

  isLinkAdd: false,
  isLinkAddFetching: false,

  isLinkDelete: false,
  isLinkDeleteFetching: false,

  // Reports
  isReportGenerate: false,
  isReportGenerateFetching: false,
  ReportGenerateData: null,
  ReportContent: '',
  ReportsHistory: [],

  // Chat
  isChatSend: false,
  isChatSendFetching: false,
  ChatMessages: [],

  // Common
  isSuccess: false,
  successMessage: '',
  isError: false,
  errorMessage: '',
};

// ============================================
// ASYNC THUNKS - AUTH
// ============================================

export const LoginApi = createAsyncThunk(
  'TBSlice/LoginApi',
  async (userdata: { email: string; password: string }, thunkAPI) => {
    try {
      const result = await axios({
        method: 'POST',
        baseURL: CONFIG.BASE_URL,
        headers: { 'Content-Type': 'application/json' },
        url: '/auth/login',
        data: userdata,
      });

      if (result.data) {
        if (result.data.token) {
          localStorage.setItem('authToken', result.data.token);
        }
        localStorage.setItem('user', JSON.stringify(result.data));
        return result.data;
      } else {
        return thunkAPI.rejectWithValue({ error: result.data.message });
      }
    } catch (error: any) {
      console.error('LoginApi error >>', error?.message);
      return thunkAPI.rejectWithValue({ 
        error: error?.response?.data?.message || error?.message 
      });
    }
  }
);

export const RegisterApi = createAsyncThunk(
  'TBSlice/RegisterApi',
  async (userdata: { name: string; email: string; password: string; role?: string }, thunkAPI) => {
    try {
      const result = await axios({
        method: 'POST',
        baseURL: CONFIG.BASE_URL,
        headers: { 'Content-Type': 'application/json' },
        url: '/auth/register',
        data: { ...userdata, role: userdata.role || 'user' },
      });

      if (result.data) {
        return result.data;
      } else {
        return thunkAPI.rejectWithValue({ error: result.data.message });
      }
    } catch (error: any) {
      console.error('RegisterApi error >>', error?.message);
      return thunkAPI.rejectWithValue({ 
        error: error?.response?.data?.message || error?.message 
      });
    }
  }
);

// ============================================
// ASYNC THUNKS - FILES
// ============================================

export const FilesGetApi = createAsyncThunk(
  'TBSlice/FilesGetApi',
  async (_, thunkAPI) => {
    try {
      const result = await axios({
        method: 'GET',
        baseURL: CONFIG.BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          authorization: `${localStorage.getItem('authToken')}`,
        },
        url: '/auth/files',
      });

      if (result.data) {
        return result.data.files || result.data || [];
      } else {
        return thunkAPI.rejectWithValue({ error: 'Failed to fetch files' });
      }
    } catch (error: any) {
      console.error('FilesGetApi error >>', error?.message);
      return thunkAPI.rejectWithValue({ error: error?.message });
    }
  }
);

export const FileUploadApi = createAsyncThunk(
  'TBSlice/FileUploadApi',
  async (userdata: { formData: FormData; folderId?: string }, thunkAPI) => {
    try {
      const url = userdata.folderId 
        ? `/auth/upload/${userdata.folderId}` 
        : '/auth/upload';

      const result = await axios({
        method: 'POST',
        baseURL: CONFIG.BASE_URL,
        headers: {
          'Content-Type': 'multipart/form-data',
          authorization: `${localStorage.getItem('authToken')}`,
        },
        url,
        data: userdata.formData,
      });

      if (result.data) {
        return result.data;
      } else {
        return thunkAPI.rejectWithValue({ error: 'Upload failed' });
      }
    } catch (error: any) {
      console.error('FileUploadApi error >>', error?.message);
      return thunkAPI.rejectWithValue({ error: error?.message });
    }
  }
);

export const FileDeleteApi = createAsyncThunk(
  'TBSlice/FileDeleteApi',
  async (userdata: { fileId: string }, thunkAPI) => {
    try {
      const result = await axios({
        method: 'DELETE',
        baseURL: CONFIG.BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          authorization: `${localStorage.getItem('authToken')}`,
        },
        url: `/auth/file/${userdata.fileId}`,
      });

      if (result.data) {
        return { ...result.data, fileId: userdata.fileId };
      } else {
        return thunkAPI.rejectWithValue({ error: 'Delete failed' });
      }
    } catch (error: any) {
      console.error('FileDeleteApi error >>', error?.message);
      return thunkAPI.rejectWithValue({ error: error?.message });
    }
  }
);

// ============================================
// ASYNC THUNKS - FOLDERS
// ============================================

export const FoldersGetApi = createAsyncThunk(
  'TBSlice/FoldersGetApi',
  async (_, thunkAPI) => {
    try {
      const result = await axios({
        method: 'GET',
        baseURL: CONFIG.BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          authorization: `${localStorage.getItem('authToken')}`,
        },
        url: '/auth/folders',
      });

      if (result.data) {
        return result.data.folders || result.data || [];
      } else {
        return thunkAPI.rejectWithValue({ error: 'Failed to fetch folders' });
      }
    } catch (error: any) {
      console.error('FoldersGetApi error >>', error?.message);
      return thunkAPI.rejectWithValue({ error: error?.message });
    }
  }
);

export const FolderCreateApi = createAsyncThunk(
  'TBSlice/FolderCreateApi',
  async (userdata: { name: string; desc: string; userId: string; createdBy: string }, thunkAPI) => {
    try {
      const result = await axios({
        method: 'POST',
        baseURL: CONFIG.BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          authorization: `${localStorage.getItem('authToken')}`,
        },
        url: '/auth/folder/create',
        data: userdata,
      });

      if (result.data) {
        return result.data;
      } else {
        return thunkAPI.rejectWithValue({ error: 'Create failed' });
      }
    } catch (error: any) {
      console.error('FolderCreateApi error >>', error?.message);
      return thunkAPI.rejectWithValue({ error: error?.message });
    }
  }
);

export const FolderDeleteApi = createAsyncThunk(
  'TBSlice/FolderDeleteApi',
  async (userdata: { folderId: string }, thunkAPI) => {
    try {
      const result = await axios({
        method: 'DELETE',
        baseURL: CONFIG.BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          authorization: `${localStorage.getItem('authToken')}`,
        },
        url: `/auth/folder/${userdata.folderId}`,
      });

      if (result.data) {
        return { ...result.data, folderId: userdata.folderId };
      } else {
        return thunkAPI.rejectWithValue({ error: 'Delete failed' });
      }
    } catch (error: any) {
      console.error('FolderDeleteApi error >>', error?.message);
      return thunkAPI.rejectWithValue({ error: error?.message });
    }
  }
);

// ============================================
// ASYNC THUNKS - LINKS
// ============================================

export const LinksGetApi = createAsyncThunk(
  'TBSlice/LinksGetApi',
  async (_, thunkAPI) => {
    try {
      const result = await axios({
        method: 'GET',
        baseURL: CONFIG.BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          authorization: `${localStorage.getItem('authToken')}`,
        },
        url: '/auth/links',
      });

      if (result.data) {
        return result.data.links || result.data || [];
      } else {
        return thunkAPI.rejectWithValue({ error: 'Failed to fetch links' });
      }
    } catch (error: any) {
      console.error('LinksGetApi error >>', error?.message);
      return thunkAPI.rejectWithValue({ error: error?.message });
    }
  }
);

export const LinkAddApi = createAsyncThunk(
  'TBSlice/LinkAddApi',
  async (userdata: { url: string; folderId: string; userId: string }, thunkAPI) => {
    try {
      const result = await axios({
        method: 'POST',
        baseURL: CONFIG.BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          authorization: `${localStorage.getItem('authToken')}`,
        },
        url: '/auth/link/add',
        data: userdata,
      });

      if (result.data) {
        return result.data;
      } else {
        return thunkAPI.rejectWithValue({ error: 'Add link failed' });
      }
    } catch (error: any) {
      console.error('LinkAddApi error >>', error?.message);
      return thunkAPI.rejectWithValue({ error: error?.message });
    }
  }
);

export const LinkDeleteApi = createAsyncThunk(
  'TBSlice/LinkDeleteApi',
  async (userdata: { linkId: string }, thunkAPI) => {
    try {
      const result = await axios({
        method: 'DELETE',
        baseURL: CONFIG.BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          authorization: `${localStorage.getItem('authToken')}`,
        },
        url: `/auth/link/${userdata.linkId}`,
      });

      if (result.data) {
        return { ...result.data, linkId: userdata.linkId };
      } else {
        return thunkAPI.rejectWithValue({ error: 'Delete failed' });
      }
    } catch (error: any) {
      console.error('LinkDeleteApi error >>', error?.message);
      return thunkAPI.rejectWithValue({ error: error?.message });
    }
  }
);

// ============================================
// ASYNC THUNKS - REPORTS
// ============================================

export const ReportGenerateApi = createAsyncThunk(
  'TBSlice/ReportGenerateApi',
  async (userdata: { reportType: string; keyword?: string; fileId?: string }, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append('reportType', userdata.reportType);
      if (userdata.keyword) formData.append('keyword', userdata.keyword);
      if (userdata.fileId) formData.append('fileId', userdata.fileId);

      const result = await axios({
        method: 'POST',
        baseURL: CONFIG.BASE_URL,
        headers: {
          'Content-Type': 'multipart/form-data',
          authorization: `${localStorage.getItem('authToken')}`,
        },
        url: '/auth/report/analyze',
        data: formData,
      });

      if (result.data) {
        return result.data;
      } else {
        return thunkAPI.rejectWithValue({ error: 'Report generation failed' });
      }
    } catch (error: any) {
      console.error('ReportGenerateApi error >>', error?.message);
      return thunkAPI.rejectWithValue({ error: error?.response?.data?.msg || error?.message });
    }
  }
);

// Streaming Report API - connects to SSE endpoint for real-time report generation
export const ReportStreamApi = createAsyncThunk(
  'TBSlice/ReportStreamApi',
  async (userdata: { reportType: string; keyword?: string; fileId?: string }, thunkAPI) => {
    try {
      // First call the analyze endpoint to start generation
      const formData = new FormData();
      formData.append('reportType', userdata.reportType);
      if (userdata.keyword) formData.append('keyword', userdata.keyword);
      if (userdata.fileId) formData.append('fileId', userdata.fileId);

      const result = await axios({
        method: 'POST',
        baseURL: CONFIG.BASE_URL,
        headers: {
          'Content-Type': 'multipart/form-data',
          authorization: `${localStorage.getItem('authToken')}`,
        },
        url: '/auth/report/analyze',
        data: formData,
        timeout: 300000, // 5 min timeout for AI processing
      });

      if (result.data && result.data.data) {
        const reportData = result.data.data;
        
        // Format the report content for display
        const formattedReport = formatReportContent(reportData);
        
        return {
          success: true,
          reportId: reportData._id,
          title: reportData.originalFilename,
          content: formattedReport,
          downloadUrl: reportData.generatedReportPath,
          analysisResult: reportData.analysisResult,
          collectionInsight: reportData.collectionInsight,
        };
      } else {
        return thunkAPI.rejectWithValue({ error: 'Report generation failed' });
      }
    } catch (error: any) {
      console.error('ReportStreamApi error >>', error?.message);
      return thunkAPI.rejectWithValue({ 
        error: error?.response?.data?.msg || error?.response?.data?.error || error?.message 
      });
    }
  }
);

// Helper function to format report content for ChatGPT-style display
function formatReportContent(reportData: any): string {
  const analysis = reportData.analysisResult || {};
  const insight = reportData.collectionInsight || {};
  
  let content = '';
  
  // Header
  content += `# 📊 ${reportData.originalFilename || 'Analysis Report'}\n\n`;
  content += `**Report Type:** ${reportData.status === 'completed' ? '✅ Completed' : '⏳ Processing'}\n`;
  content += `**Generated:** ${new Date(reportData.uploadDate).toLocaleString()}\n\n`;
  
  // Collection Insight
  if (insight.contextDescription || insight.totalDocs) {
    content += `## 🔍 Document Context\n\n`;
    if (insight.contextDescription) {
      content += `${insight.contextDescription}\n\n`;
    }
    if (insight.totalDocs) {
      content += `- **Documents Analyzed:** ${insight.totalDocs}\n`;
    }
    if (insight.fileTypes && insight.fileTypes.length > 0) {
      content += `- **File Types:** ${insight.fileTypes.join(', ')}\n`;
    }
    content += '\n';
  }
  
  // Summary
  if (analysis.summary) {
    content += `## 📝 Executive Summary\n\n`;
    content += `${analysis.summary}\n\n`;
  }
  
  // Keywords
  if (analysis.keywords && analysis.keywords.length > 0) {
    content += `## 🏷️ Key Terms\n\n`;
    content += analysis.keywords.map((k: string) => `\`${k}\``).join(' • ') + '\n\n';
  }
  
  // Trends
  if (analysis.trends && analysis.trends.length > 0) {
    content += `## 📈 Trends & Patterns\n\n`;
    analysis.trends.forEach((trend: string, i: number) => {
      content += `${i + 1}. ${trend}\n`;
    });
    content += '\n';
  }
  
  // Decisions/Recommendations
  if (analysis.decisions) {
    content += `## 💡 Recommendations\n\n`;
    content += `${analysis.decisions}\n\n`;
  }
  
  // Full Report Text
  if (analysis.finalReportText) {
    content += `## 📄 Detailed Analysis\n\n`;
    content += `${analysis.finalReportText}\n\n`;
  }
  
  // Download Link
  if (reportData.generatedReportPath) {
    content += `---\n\n`;
    content += `📥 **[Download Full Report (PDF)](${reportData.generatedReportPath})**\n`;
  }
  
  return content;
}

// ============================================
// ASYNC THUNKS - CHAT
// ============================================

export const ChatSendApi = createAsyncThunk(
  'TBSlice/ChatSendApi',
  async (userdata: { question: string; link?: string }, thunkAPI) => {
    try {
      const result = await axios({
        method: 'POST',
        baseURL: CONFIG.BASE_URL,
        headers: {
          'Content-Type': 'application/json',
          authorization: `${localStorage.getItem('authToken')}`,
        },
        url: '/auth/chat/ask',
        data: userdata,
      });

      if (result.data) {
        return result.data;
      } else {
        return thunkAPI.rejectWithValue({ error: 'Chat failed' });
      }
    } catch (error: any) {
      console.error('ChatSendApi error >>', error?.message);
      return thunkAPI.rejectWithValue({ error: error?.message });
    }
  }
);

// ============================================
// SLICE
// ============================================

const TBSlice = createSlice({
  name: 'TBSlice',
  initialState,
  reducers: {
    updateState: (state, { payload }: PayloadAction<Partial<TBState>>) => {
      return { ...state, ...payload };
    },
    resetState: () => initialState,
    clearErrors: (state) => {
      state.isError = false;
      state.errorMessage = '';
    },
    clearSuccess: (state) => {
      state.isSuccess = false;
      state.successMessage = '';
    },
    addChatMessage: (state, { payload }: PayloadAction<ChatMessage>) => {
      state.ChatMessages.push(payload);
    },
    clearChatMessages: (state) => {
      state.ChatMessages = [];
    },
    addReportToHistory: (state, { payload }: PayloadAction<ReportItem>) => {
      state.ReportsHistory = [payload, ...state.ReportsHistory];
    },
    clearReportsHistory: (state) => {
      state.ReportsHistory = [];
    },
    logout: (state) => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      state.LoginData = null;
      state.isLogin = false;
    },
  },
  extraReducers: (builder) => {
    // ==================== LOGIN ====================
    builder.addCase(LoginApi.pending, (state) => {
      state.isLoginFetching = true;
    });
    builder.addCase(LoginApi.fulfilled, (state, { payload }) => {
      state.LoginData = payload;
      state.isLogin = true;
      state.isLoginFetching = false;
      state.isSuccess = true;
      state.successMessage = payload?.message || 'Login successful';
      state.isError = false;
      state.errorMessage = '';
    });
    builder.addCase(LoginApi.rejected, (state, { payload }: { payload: any }) => {
      state.isLogin = false;
      state.isLoginFetching = false;
      state.isError = true;
      state.errorMessage = payload?.error || 'Login failed';
    });

    // ==================== REGISTER ====================
    builder.addCase(RegisterApi.pending, (state) => {
      state.isRegisterFetching = true;
    });
    builder.addCase(RegisterApi.fulfilled, (state, { payload }) => {
      state.RegisterData = payload;
      state.isRegister = true;
      state.isRegisterFetching = false;
      state.isSuccess = true;
      state.successMessage = payload?.message || 'Registration successful';
      state.isError = false;
      state.errorMessage = '';
    });
    builder.addCase(RegisterApi.rejected, (state, { payload }: { payload: any }) => {
      state.isRegister = false;
      state.isRegisterFetching = false;
      state.isError = true;
      state.errorMessage = payload?.error || 'Registration failed';
    });

    // ==================== FILES GET ====================
    builder.addCase(FilesGetApi.pending, (state) => {
      state.isFilesGetFetching = true;
    });
    builder.addCase(FilesGetApi.fulfilled, (state, { payload }) => {
      state.FilesGetData = payload;
      state.isFilesGet = true;
      state.isFilesGetFetching = false;
      state.isError = false;
      state.errorMessage = '';
    });
    builder.addCase(FilesGetApi.rejected, (state, { payload }: { payload: any }) => {
      state.isFilesGet = false;
      state.isFilesGetFetching = false;
      state.isError = true;
      state.errorMessage = payload?.error || 'Failed to fetch files';
    });

    // ==================== FILE UPLOAD ====================
    builder.addCase(FileUploadApi.pending, (state) => {
      state.isFileUploadFetching = true;
    });
    builder.addCase(FileUploadApi.fulfilled, (state, { payload }) => {
      state.FileUploadData = payload;
      state.isFileUpload = true;
      state.isFileUploadFetching = false;
      state.isSuccess = true;
      state.successMessage = payload?.message || 'File uploaded successfully';
      state.isError = false;
      state.errorMessage = '';
    });
    builder.addCase(FileUploadApi.rejected, (state, { payload }: { payload: any }) => {
      state.isFileUpload = false;
      state.isFileUploadFetching = false;
      state.isError = true;
      state.errorMessage = payload?.error || 'Upload failed';
    });

    // ==================== FILE DELETE ====================
    builder.addCase(FileDeleteApi.pending, (state) => {
      state.isFileDeleteFetching = true;
    });
    builder.addCase(FileDeleteApi.fulfilled, (state, { payload }) => {
      state.FilesGetData = state.FilesGetData.filter(f => f.id !== payload.fileId);
      state.isFileDelete = true;
      state.isFileDeleteFetching = false;
      state.isSuccess = true;
      state.successMessage = 'File deleted successfully';
    });
    builder.addCase(FileDeleteApi.rejected, (state, { payload }: { payload: any }) => {
      state.isFileDelete = false;
      state.isFileDeleteFetching = false;
      state.isError = true;
      state.errorMessage = payload?.error || 'Delete failed';
    });

    // ==================== FOLDERS GET ====================
    builder.addCase(FoldersGetApi.pending, (state) => {
      state.isFoldersGetFetching = true;
    });
    builder.addCase(FoldersGetApi.fulfilled, (state, { payload }) => {
      state.FoldersGetData = payload;
      state.isFoldersGet = true;
      state.isFoldersGetFetching = false;
      state.isError = false;
      state.errorMessage = '';
    });
    builder.addCase(FoldersGetApi.rejected, (state, { payload }: { payload: any }) => {
      state.isFoldersGet = false;
      state.isFoldersGetFetching = false;
      state.isError = true;
      state.errorMessage = payload?.error || 'Failed to fetch folders';
    });

    // ==================== FOLDER CREATE ====================
    builder.addCase(FolderCreateApi.pending, (state) => {
      state.isFolderCreateFetching = true;
    });
    builder.addCase(FolderCreateApi.fulfilled, (state, { payload }) => {
      state.FolderCreateData = payload;
      state.isFolderCreate = true;
      state.isFolderCreateFetching = false;
      state.isSuccess = true;
      state.successMessage = payload?.message || 'Folder created successfully';
    });
    builder.addCase(FolderCreateApi.rejected, (state, { payload }: { payload: any }) => {
      state.isFolderCreate = false;
      state.isFolderCreateFetching = false;
      state.isError = true;
      state.errorMessage = payload?.error || 'Create failed';
    });

    // ==================== FOLDER DELETE ====================
    builder.addCase(FolderDeleteApi.pending, (state) => {
      state.isFolderDeleteFetching = true;
    });
    builder.addCase(FolderDeleteApi.fulfilled, (state, { payload }) => {
      state.FoldersGetData = state.FoldersGetData.filter(f => f.id !== payload.folderId);
      state.isFolderDelete = true;
      state.isFolderDeleteFetching = false;
      state.isSuccess = true;
      state.successMessage = 'Folder deleted successfully';
    });
    builder.addCase(FolderDeleteApi.rejected, (state, { payload }: { payload: any }) => {
      state.isFolderDelete = false;
      state.isFolderDeleteFetching = false;
      state.isError = true;
      state.errorMessage = payload?.error || 'Delete failed';
    });

    // ==================== LINKS GET ====================
    builder.addCase(LinksGetApi.pending, (state) => {
      state.isLinksGetFetching = true;
    });
    builder.addCase(LinksGetApi.fulfilled, (state, { payload }) => {
      state.LinksGetData = payload;
      state.isLinksGet = true;
      state.isLinksGetFetching = false;
    });
    builder.addCase(LinksGetApi.rejected, (state, { payload }: { payload: any }) => {
      state.isLinksGet = false;
      state.isLinksGetFetching = false;
      state.isError = true;
      state.errorMessage = payload?.error || 'Failed to fetch links';
    });

    // ==================== LINK ADD ====================
    builder.addCase(LinkAddApi.pending, (state) => {
      state.isLinkAddFetching = true;
    });
    builder.addCase(LinkAddApi.fulfilled, (state, { payload }) => {
      state.isLinkAdd = true;
      state.isLinkAddFetching = false;
      state.isSuccess = true;
      state.successMessage = payload?.message || 'Link added successfully';
    });
    builder.addCase(LinkAddApi.rejected, (state, { payload }: { payload: any }) => {
      state.isLinkAdd = false;
      state.isLinkAddFetching = false;
      state.isError = true;
      state.errorMessage = payload?.error || 'Add link failed';
    });

    // ==================== LINK DELETE ====================
    builder.addCase(LinkDeleteApi.pending, (state) => {
      state.isLinkDeleteFetching = true;
    });
    builder.addCase(LinkDeleteApi.fulfilled, (state, { payload }) => {
      state.LinksGetData = state.LinksGetData.filter(l => l.id !== payload.linkId);
      state.isLinkDelete = true;
      state.isLinkDeleteFetching = false;
      state.isSuccess = true;
      state.successMessage = 'Link deleted successfully';
    });
    builder.addCase(LinkDeleteApi.rejected, (state, { payload }: { payload: any }) => {
      state.isLinkDelete = false;
      state.isLinkDeleteFetching = false;
      state.isError = true;
      state.errorMessage = payload?.error || 'Delete failed';
    });

    // ==================== REPORT GENERATE ====================
    builder.addCase(ReportGenerateApi.pending, (state) => {
      state.isReportGenerateFetching = true;
      state.ReportContent = '';
    });
    builder.addCase(ReportGenerateApi.fulfilled, (state, { payload }) => {
      state.ReportGenerateData = payload;
      state.isReportGenerate = true;
      state.isReportGenerateFetching = false;
      state.isSuccess = true;
      state.successMessage = 'Report generated successfully';
    });
    builder.addCase(ReportGenerateApi.rejected, (state, { payload }: { payload: any }) => {
      state.isReportGenerate = false;
      state.isReportGenerateFetching = false;
      state.isError = true;
      state.errorMessage = payload?.error || 'Report generation failed';
    });

    // ==================== REPORT STREAM ====================
    builder.addCase(ReportStreamApi.pending, (state) => {
      state.isReportGenerateFetching = true;
      state.ReportContent = '';
    });
    builder.addCase(ReportStreamApi.fulfilled, (state, { payload }) => {
      state.ReportGenerateData = payload;
      state.ReportContent = payload.content || '';
      state.isReportGenerate = true;
      state.isReportGenerateFetching = false;
      state.isSuccess = true;
      state.successMessage = 'Report generated successfully';
    });
    builder.addCase(ReportStreamApi.rejected, (state, { payload }: { payload: any }) => {
      state.isReportGenerate = false;
      state.isReportGenerateFetching = false;
      state.isError = true;
      state.errorMessage = payload?.error || 'Report generation failed';
    });

    // ==================== CHAT SEND ====================
    builder.addCase(ChatSendApi.pending, (state) => {
      state.isChatSendFetching = true;
    });
    builder.addCase(ChatSendApi.fulfilled, (state, { payload }) => {
      state.isChatSend = true;
      state.isChatSendFetching = false;
      state.ChatMessages.push({
        id: Date.now().toString(),
        role: 'assistant',
        content: payload.answer,
        timestamp: new Date(),
      });
    });
    builder.addCase(ChatSendApi.rejected, (state, { payload }: { payload: any }) => {
      state.isChatSend = false;
      state.isChatSendFetching = false;
      state.isError = true;
      state.errorMessage = payload?.error || 'Chat failed';
    });
  },
});

// ============================================
// EXPORTS
// ============================================

export const {
  updateState,
  resetState,
  clearErrors,
  clearSuccess,
  addChatMessage,
  clearChatMessages,
  addReportToHistory,
  clearReportsHistory,
  logout,
} = TBSlice.actions;

// Selector
export const TBSelector = (state: RootState) => state.tb;

export default TBSlice.reducer;
