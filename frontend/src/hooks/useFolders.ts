// ============================================
// USE FOLDERS HOOK - FOLDER MANAGEMENT
// ============================================

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchFolders,
  createFolder,
  deleteFolder,
  analyzeFolder,
  setSelectedFolder,
  setSearchTerm,
  clearAnalysisData,
  clearFoldersError,
} from '@/store/slices/foldersSlice';
import type { FolderItem } from '@/types';

export const useFolders = () => {
  const dispatch = useAppDispatch();
  const { items, selectedFolder, isLoading, isAnalyzing, analysisData, error, searchTerm } =
    useAppSelector((state) => state.folders);

  const loadFolders = useCallback(() => {
    dispatch(fetchFolders());
  }, [dispatch]);

  const create = useCallback(
    (name: string, desc: string, userId: string, createdBy: string) => {
      return dispatch(createFolder({ name, desc, userId, createdBy }));
    },
    [dispatch]
  );

  const remove = useCallback(
    (folderId: string) => {
      return dispatch(deleteFolder(folderId));
    },
    [dispatch]
  );

  const analyze = useCallback(
    (folderId: string) => {
      return dispatch(analyzeFolder(folderId));
    },
    [dispatch]
  );

  const selectFolder = useCallback(
    (folder: FolderItem | null) => {
      dispatch(setSelectedFolder(folder));
    },
    [dispatch]
  );

  const search = useCallback(
    (term: string) => {
      dispatch(setSearchTerm(term));
    },
    [dispatch]
  );

  const clearAnalysis = useCallback(() => {
    dispatch(clearAnalysisData());
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearFoldersError());
  }, [dispatch]);

  // Filter folders based on search term
  const filteredFolders = items.filter((folder) =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    folders: items,
    filteredFolders,
    selectedFolder,
    isLoading,
    isAnalyzing,
    analysisData,
    error,
    searchTerm,
    loadFolders,
    create,
    remove,
    analyze,
    selectFolder,
    search,
    clearAnalysis,
    clearError,
  };
};

export default useFolders;
