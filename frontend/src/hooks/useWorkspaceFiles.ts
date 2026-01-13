// ============================================
// USE WORKSPACE FILES HOOK
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { filesApi, foldersApi } from '@/services/api';
import { getUserId } from '@/utils/helpers';

export interface WorkspaceFile {
  id: string;
  name: string;
  type: string;
  extension: string;
  folderName: string;
}

export const useWorkspaceFiles = () => {
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load user from storage
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed.user || parsed);
      } catch (e) {
        console.error('Failed to load user', e);
      }
    }
  }, []);

  // Fetch files when user is loaded
  const fetchFiles = useCallback(async () => {
    const uid = getUserId(currentUser);
    if (!uid) return;

    setIsLoading(true);
    try {
      const [rawFiles, rawFolders] = await Promise.all([
        filesApi.getAll(),
        foldersApi.getAll(),
      ]);

      // Map folders
      const myFolders = (rawFolders as any[])
        .map((f: any) => ({
          id: f._id || f.id,
          name: f.name,
          userId: f.userId || f.user,
        }))
        .filter((f: any) => f.userId === uid);

      // Transform files
      const transformed = (rawFiles as any[])
        .map((f: any) => {
          let folderId = f.folderId || f.folder;
          if (typeof folderId === 'object' && folderId) {
            folderId = folderId._id || folderId.id;
          }

          const parentFolder = myFolders.find(
            (fold: any) => String(fold.id) === String(folderId)
          );

          return {
            id: f._id || f.id,
            name: f.fileName || f.originalName || f.name || 'Untitled',
            extension: f.extension || (f.fileName || '').split('.').pop() || 'file',
            type: (f.extension || '').toLowerCase(),
            userId: f.userId || f.user,
            folderName: parentFolder?.name || 'Uncategorized',
          };
        })
        .filter((f: any) => f.userId === uid)
        .reverse();

      setFiles(transformed);
    } catch (error) {
      console.error('Error fetching workspace files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) fetchFiles();
  }, [currentUser, fetchFiles]);

  return { files, isLoading, refetch: fetchFiles };
};

export default useWorkspaceFiles;
