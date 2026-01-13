// ============================================
// USE FILES HOOK - FILE MANAGEMENT
// ============================================

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchFiles,
  uploadFiles,
  deleteFile,
  setSelectedFile,
  setSearchTerm,
  clearFilesError,
} from '@/store/slices/filesSlice';
import type { FileItem } from '@/types';

export const useFiles = () => {
  const dispatch = useAppDispatch();
  const { items, selectedFile, isLoading, isUploading, error, searchTerm } = useAppSelector(
    (state) => state.files
  );

  const loadFiles = useCallback(() => {
    dispatch(fetchFiles());
  }, [dispatch]);

  const upload = useCallback(
    (formData: FormData, folderId?: string) => {
      return dispatch(uploadFiles({ formData, folderId }));
    },
    [dispatch]
  );

  const remove = useCallback(
    (fileId: string) => {
      return dispatch(deleteFile(fileId));
    },
    [dispatch]
  );

  const selectFile = useCallback(
    (file: FileItem | null) => {
      dispatch(setSelectedFile(file));
    },
    [dispatch]
  );

  const search = useCallback(
    (term: string) => {
      dispatch(setSearchTerm(term));
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearFilesError());
  }, [dispatch]);

  // Filter files based on search term
  const filteredFiles = items.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    files: items,
    filteredFiles,
    selectedFile,
    isLoading,
    isUploading,
    error,
    searchTerm,
    loadFiles,
    upload,
    remove,
    selectFile,
    search,
    clearError,
  };
};

export default useFiles;
