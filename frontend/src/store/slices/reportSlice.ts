// ============================================
// REPORT SLICE - AI REPORT GENERATION STATE
// ============================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { reportsApi, chatApi } from '@/services/api';
import type { ReportItem, ChatMessage } from '@/types';
import { STORAGE_KEYS } from '@/constants';

// ============================================
// TYPES
// ============================================

interface ReportState {
  // Input
  inputType: 'keyword' | 'file';
  topic: string;
  selectedFileId: string | null;
  reportType: string;
  
  // Processing
  isGenerating: boolean;
  streamedText: string;
  
  // Reports
  reports: ReportItem[];
  currentReport: ReportItem | null;
  
  // Chat
  chatMessages: ChatMessage[];
  isTyping: boolean;
  showChatInterface: boolean;
  
  // UI
  showSuccessModal: boolean;
  error: string | null;
}

// ============================================
// HELPERS
// ============================================

const loadReportsFromStorage = (): ReportItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_REPORTS);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveReportsToStorage = (reports: ReportItem[]) => {
  localStorage.setItem(STORAGE_KEYS.USER_REPORTS, JSON.stringify(reports));
};

// ============================================
// INITIAL STATE
// ============================================

const initialState: ReportState = {
  inputType: 'keyword',
  topic: '',
  selectedFileId: null,
  reportType: 'Executive Report',
  isGenerating: false,
  streamedText: '',
  reports: loadReportsFromStorage(),
  currentReport: null,
  chatMessages: [],
  isTyping: false,
  showChatInterface: false,
  showSuccessModal: false,
  error: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

export const generateReport = createAsyncThunk(
  'report/generate',
  async (
    { reportType, keyword, fileId }: { reportType: string; keyword?: string; fileId?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await reportsApi.analyze({ reportType, keyword, fileId });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Analysis failed');
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  'report/chat',
  async ({ question, link }: { question: string; link?: string }, { rejectWithValue }) => {
    try {
      const response = await chatApi.ask(question, link);
      return response.answer;
    } catch (error: any) {
      return rejectWithValue('Connection error. Unable to reach intelligence core.');
    }
  }
);

// ============================================
// SLICE
// ============================================

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    setInputType: (state, action: PayloadAction<'keyword' | 'file'>) => {
      state.inputType = action.payload;
    },
    setTopic: (state, action: PayloadAction<string>) => {
      state.topic = action.payload;
    },
    setSelectedFileId: (state, action: PayloadAction<string | null>) => {
      state.selectedFileId = action.payload;
    },
    setReportType: (state, action: PayloadAction<string>) => {
      state.reportType = action.payload;
    },
    setStreamedText: (state, action: PayloadAction<string>) => {
      state.streamedText = action.payload;
    },
    appendStreamedText: (state, action: PayloadAction<string>) => {
      state.streamedText += action.payload;
    },
    clearStreamedText: (state) => {
      state.streamedText = '';
    },
    setIsGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload;
    },
    setShowChatInterface: (state, action: PayloadAction<boolean>) => {
      state.showChatInterface = action.payload;
    },
    setShowSuccessModal: (state, action: PayloadAction<boolean>) => {
      state.showSuccessModal = action.payload;
    },
    addReport: (state, action: PayloadAction<ReportItem>) => {
      state.reports = [action.payload, ...state.reports];
      state.currentReport = action.payload;
      saveReportsToStorage(state.reports);
    },
    clearReports: (state) => {
      state.reports = [];
      localStorage.removeItem(STORAGE_KEYS.USER_REPORTS);
    },
    addChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.chatMessages.push(action.payload);
    },
    setChatMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.chatMessages = action.payload;
    },
    resetForm: (state) => {
      state.topic = '';
      state.selectedFileId = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Generate Report
    builder
      .addCase(generateReport.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateReport.fulfilled, (state) => {
        state.isGenerating = false;
      })
      .addCase(generateReport.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload as string;
      });

    // Chat
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.isTyping = true;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.isTyping = false;
        state.chatMessages.push({
          id: Date.now().toString(),
          role: 'assistant',
          content: action.payload,
          timestamp: new Date(),
        });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.isTyping = false;
        state.chatMessages.push({
          id: Date.now().toString(),
          role: 'assistant',
          content: action.payload as string,
          timestamp: new Date(),
        });
      });
  },
});

export const {
  setInputType,
  setTopic,
  setSelectedFileId,
  setReportType,
  setStreamedText,
  appendStreamedText,
  clearStreamedText,
  setIsGenerating,
  setShowChatInterface,
  setShowSuccessModal,
  addReport,
  clearReports,
  addChatMessage,
  setChatMessages,
  resetForm,
  clearError,
} = reportSlice.actions;

export default reportSlice.reducer;
