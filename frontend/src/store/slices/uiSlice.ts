// ============================================
// UI SLICE - GLOBAL UI STATE
// ============================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ============================================
// TYPES
// ============================================

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface Modal {
  type: string;
  data?: any;
}

interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  toasts: Toast[];
  activeModal: Modal | null;
  isScrolled: boolean;
  theme: 'light' | 'dark';
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: UIState = {
  sidebarOpen: true,
  mobileMenuOpen: false,
  toasts: [],
  activeModal: null,
  isScrolled: false,
  theme: 'light',
};

// ============================================
// SLICE
// ============================================

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = Date.now().toString();
      state.toasts.push({ ...action.payload, id });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    openModal: (state, action: PayloadAction<Modal>) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
    setScrolled: (state, action: PayloadAction<boolean>) => {
      state.isScrolled = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  addToast,
  removeToast,
  clearToasts,
  openModal,
  closeModal,
  setScrolled,
  setTheme,
} = uiSlice.actions;

export default uiSlice.reducer;
