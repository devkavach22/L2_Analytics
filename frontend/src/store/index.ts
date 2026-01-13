// ============================================
// REDUX STORE CONFIGURATION
// ============================================

import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/slices/authSlice';
import filesReducer from '@/store/slices/filesSlice';
import foldersReducer from '@/store/slices/foldersSlice';
import uiReducer from '@/store/slices/uiSlice';
import reportReducer from '@/store/slices/reportSlice';
import tbReducer from '@/store/slices/TBSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    files: filesReducer,
    folders: foldersReducer,
    ui: uiReducer,
    report: reportReducer,
    tb: tbReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser'],
        ignoredPaths: ['auth.user', 'tb.ChatMessages'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
