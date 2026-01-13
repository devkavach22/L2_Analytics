// ============================================
// FILES SLICE - FILE MANAGEMENT STATE
// ============================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { filesApi } from '@/services/api';
import type { FileItem } from '@/types';

// ============================================
// TYPES
// ============================================

interface FilesState {
  items: FileItem[];
  selectedFile: FileItem | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  searchTerm: string;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: FilesState = {
  items: [],
  selectedFile: null,
  isLoading: false,
  isUploading: false,
  error: null,
  searchTerm: '',
};

// ============================================
// ASYNC THUNKS
// ============================================

export const fetchFiles = createAsyncThunk(
  'files/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const files = await filesApi.getAll();
      return files;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch files');
    }
  }
);

export const uploadFiles = createAsyncThunk(
  'files/upload',
  async ({ formData, folderId }: { formData: FormData; folderId?: string }, { rejectWithValue, dispatch }) => {
    try {
      const response = await filesApi.upload(formData, folderId);
      // Refresh files after upload
      dispatch(fetchFiles());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Upload failed');
    }
  }
);

export const deleteFile = createAsyncThunk(
  'files/delete',
  async (fileId: string, { rejectWithValue, dispatch }) => {
    try {
      await filesApi.delete(fileId);
      dispatch(fetchFiles());
      return fileId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Delete failed');
    }
  }
);

// ============================================
// SLICE
// ============================================

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    setSelectedFile: (state, action: PayloadAction<FileItem | null>) => {
      state.selectedFile = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    clearFilesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Files
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Upload Files
    builder
      .addCase(uploadFiles.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadFiles.fulfilled, (state) => {
        state.isUploading = false;
      })
      .addCase(uploadFiles.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload as string;
      });

    // Delete File
    builder
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.items = state.items.filter(f => f.id !== action.payload);
        if (state.selectedFile?.id === action.payload) {
          state.selectedFile = null;
        }
      });
  },
});

export const { setSelectedFile, setSearchTerm, clearFilesError } = filesSlice.actions;
export default filesSlice.reducer;
