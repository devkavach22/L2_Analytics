// ============================================
// FOLDERS SLICE - FOLDER MANAGEMENT STATE
// ============================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { foldersApi } from '@/services/api';
import type { FolderItem } from '@/types';

// ============================================
// TYPES
// ============================================

interface FoldersState {
  items: FolderItem[];
  selectedFolder: FolderItem | null;
  isLoading: boolean;
  isAnalyzing: boolean;
  analysisData: any | null;
  error: string | null;
  searchTerm: string;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: FoldersState = {
  items: [],
  selectedFolder: null,
  isLoading: false,
  isAnalyzing: false,
  analysisData: null,
  error: null,
  searchTerm: '',
};

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchFolders = createAsyncThunk(
  'folders/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const folders = await foldersApi.getAll();
      return folders;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch folders');
    }
  }
);

export const createFolder = createAsyncThunk(
  'folders/create',
  async (
    { name, desc, userId, createdBy }: { name: string; desc: string; userId: string; createdBy: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await foldersApi.create(name, desc, userId, createdBy);
      dispatch(fetchFolders());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create folder');
    }
  }
);

export const deleteFolder = createAsyncThunk(
  'folders/delete',
  async (folderId: string, { rejectWithValue, dispatch }) => {
    try {
      await foldersApi.delete(folderId);
      dispatch(fetchFolders());
      return folderId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Delete failed');
    }
  }
);

export const analyzeFolder = createAsyncThunk(
  'folders/analyze',
  async (folderId: string, { rejectWithValue }) => {
    try {
      const response = await foldersApi.analyze(folderId);
      const data = response.data as any;
      return data?.data || response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Analysis failed');
    }
  }
);

// ============================================
// SLICE
// ============================================

const foldersSlice = createSlice({
  name: 'folders',
  initialState,
  reducers: {
    setSelectedFolder: (state, action: PayloadAction<FolderItem | null>) => {
      state.selectedFolder = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    clearAnalysisData: (state) => {
      state.analysisData = null;
    },
    clearFoldersError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Folders
    builder
      .addCase(fetchFolders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchFolders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Folder
    builder
      .addCase(createFolder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createFolder.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createFolder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete Folder
    builder
      .addCase(deleteFolder.fulfilled, (state, action) => {
        state.items = state.items.filter(f => f.id !== action.payload);
        if (state.selectedFolder?.id === action.payload) {
          state.selectedFolder = null;
        }
      });

    // Analyze Folder
    builder
      .addCase(analyzeFolder.pending, (state) => {
        state.isAnalyzing = true;
        state.analysisData = null;
      })
      .addCase(analyzeFolder.fulfilled, (state, action) => {
        state.isAnalyzing = false;
        state.analysisData = action.payload;
      })
      .addCase(analyzeFolder.rejected, (state, action) => {
        state.isAnalyzing = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedFolder, setSearchTerm, clearAnalysisData, clearFoldersError } = foldersSlice.actions;
export default foldersSlice.reducer;
