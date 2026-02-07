'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  documentId?: string;
}

interface UseDocumentUploadOptions {
  caseId: string;
  onSuccess?: (file: UploadFile) => void;
  onError?: (file: UploadFile, error: Error) => void;
  maxConcurrent?: number;
}

export function useDocumentUpload({
  caseId,
  onSuccess,
  onError,
  maxConcurrent = 3,
}: UseDocumentUploadOptions) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const updateFile = useCallback(
    (id: string, updates: Partial<UploadFile>) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const uploadFile = useCallback(
    async (uploadFile: UploadFile) => {
      const formData = new FormData();
      formData.append('file', uploadFile.file);

      updateFile(uploadFile.id, { status: 'uploading', progress: 0 });

      try {
        // Simulate progress updates during upload
        const progressInterval = setInterval(() => {
          setFiles((prev) => {
            const file = prev.find((f) => f.id === uploadFile.id);
            if (file && file.status === 'uploading' && file.progress < 90) {
              return prev.map((f) =>
                f.id === uploadFile.id
                  ? { ...f, progress: Math.min(f.progress + 10, 90) }
                  : f
              );
            }
            return prev;
          });
        }, 200);

        const response = await api.upload<Array<{ id: string }>>(
          `/documents/${caseId}`,
          formData
        );

        clearInterval(progressInterval);

        const doc = Array.isArray(response.data) ? response.data[0] : response.data;
        const documentId = doc?.id;

        updateFile(uploadFile.id, {
          status: 'completed',
          progress: 100,
          documentId,
        });

        onSuccess?.({ ...uploadFile, status: 'completed', documentId });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        updateFile(uploadFile.id, {
          status: 'error',
          error: errorMessage,
        });
        onError?.({ ...uploadFile, status: 'error', error: errorMessage }, error as Error);
      }
    },
    [caseId, updateFile, onSuccess, onError]
  );

  const processQueue = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    const uploadingCount = files.filter((f) => f.status === 'uploading').length;
    const slotsAvailable = maxConcurrent - uploadingCount;

    const filesToUpload = pendingFiles.slice(0, slotsAvailable);

    await Promise.all(filesToUpload.map(uploadFile));
  }, [files, maxConcurrent, uploadFile]);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const uploadFiles: UploadFile[] = newFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
        file,
        progress: 0,
        status: 'pending' as const,
      }));

      setFiles((prev) => [...prev, ...uploadFiles]);
      return uploadFiles;
    },
    []
  );

  const startUpload = useCallback(async () => {
    if (isUploading) return;
    setIsUploading(true);

    try {
      let hasMore = true;
      while (hasMore) {
        const pendingFiles = files.filter((f) => f.status === 'pending');
        const uploadingFiles = files.filter((f) => f.status === 'uploading');

        if (pendingFiles.length === 0 && uploadingFiles.length === 0) {
          hasMore = false;
          break;
        }

        if (pendingFiles.length > 0 && uploadingFiles.length < maxConcurrent) {
          await processQueue();
        }

        // Wait a bit before checking again
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Re-check files state
        const currentFiles = files;
        const stillPending = currentFiles.filter((f) => f.status === 'pending');
        const stillUploading = currentFiles.filter((f) => f.status === 'uploading');

        if (stillPending.length === 0 && stillUploading.length === 0) {
          hasMore = false;
        }
      }
    } finally {
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ['documents', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    }
  }, [isUploading, files, maxConcurrent, processQueue, queryClient, caseId]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const retryFile = useCallback(
    async (id: string) => {
      const file = files.find((f) => f.id === id);
      if (file) {
        updateFile(id, { status: 'pending', progress: 0, error: undefined });
        await uploadFile({ ...file, status: 'pending', progress: 0, error: undefined });
      }
    },
    [files, updateFile, uploadFile]
  );

  const clearCompleted = useCallback(() => {
    setFiles((prev) => prev.filter((f) => f.status !== 'completed'));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const uploadStats = {
    total: files.length,
    pending: files.filter((f) => f.status === 'pending').length,
    uploading: files.filter((f) => f.status === 'uploading').length,
    completed: files.filter((f) => f.status === 'completed').length,
    error: files.filter((f) => f.status === 'error').length,
  };

  return {
    files,
    isUploading,
    uploadStats,
    addFiles,
    startUpload,
    removeFile,
    retryFile,
    clearCompleted,
    clearAll,
  };
}

// Allowed file types for document upload
export const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/tiff': ['.tiff', '.tif'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds 50MB limit` };
  }

  const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not supported` };
  }

  return { valid: true };
}
