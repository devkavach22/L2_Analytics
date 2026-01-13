// ============================================
// AUTH SLICE - USER AUTHENTICATION STATE
// ============================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '@/services/api';
import type { User, LoginPayload, RegisterPayload } from '@/types';

// ============================================
// TYPES
// ============================================

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// INITIAL STATE
// ============================================

const getInitialState = (): AuthState => {
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token') || localStorage.getItem('authToken');
  
  let user: User | null = null;
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      user = parsed.user || parsed;
    } catch {
      user = null;
    }
  }

  return {
    user,
    token: storedToken,
    isAuthenticated: !!storedToken,
    isAdmin: user?.role === 'admin',
    isLoading: false,
    error: null,
  };
};

// ============================================
// ASYNC THUNKS
// ============================================

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await authApi.login(payload);
      
      // Store in localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('authToken', response.token);
      }
      localStorage.setItem('user', JSON.stringify(response));
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload, { rejectWithValue }) => {
    try {
      const response = await authApi.register(payload);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      return null;
    } catch (error: any) {
      // Still clear localStorage even if API fails
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return rejectWithValue(error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isAdmin = action.payload?.role === 'admin';
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isAdmin = action.payload.user?.role === 'admin';
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isAdmin = false;
      });
  },
});

export const { setUser, setToken, clearError, clearAuth } = authSlice.actions;
export default authSlice.reducer;
