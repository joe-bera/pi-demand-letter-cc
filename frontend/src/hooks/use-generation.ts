'use client';

import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GeneratedDocument, GeneratedDocType, Warning } from '@/types';

interface GenerateParams {
  documentType: GeneratedDocType;
  tone: string;
  parameters?: Record<string, unknown>;
}

interface GenerationState {
  isGenerating: boolean;
  content: string;
  isStreaming: boolean;
  warnings: Warning[];
  error: string | null;
}

export function useGeneration(caseId: string) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    content: '',
    isStreaming: false,
    warnings: [],
    error: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch existing generated documents
  const {
    data: generatedDocuments,
    isLoading: documentsLoading,
  } = useQuery({
    queryKey: ['generated-documents', caseId],
    queryFn: async (): Promise<GeneratedDocument[]> => {
      const response = await api.get<{ documents: GeneratedDocument[] }>(
        `/cases/${caseId}/generated-documents`
      );
      return response.data.documents || [];
    },
    enabled: !!caseId,
  });

  // Get latest version of a document type
  const getLatestVersion = useCallback(
    (type: GeneratedDocType): GeneratedDocument | undefined => {
      if (!generatedDocuments) return undefined;
      return generatedDocuments
        .filter((doc) => doc.documentType === type)
        .sort((a, b) => b.version - a.version)[0];
    },
    [generatedDocuments]
  );

  // Generate document mutation (non-streaming fallback)
  const generateMutation = useMutation({
    mutationFn: async (params: GenerateParams) => {
      const response = await api.post<GeneratedDocument>(
        `/cases/${caseId}/generate`,
        params
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-documents', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    },
  });

  // Generate with streaming
  const generateStreaming = useCallback(
    async (params: GenerateParams) => {
      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState({
        isGenerating: true,
        content: '',
        isStreaming: true,
        warnings: [],
        error: null,
      });

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/cases/${caseId}/generate/stream`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(params),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to generate document');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'content') {
                  accumulatedContent += data.content;
                  setState((prev) => ({
                    ...prev,
                    content: accumulatedContent,
                  }));
                } else if (data.type === 'warning') {
                  setState((prev) => ({
                    ...prev,
                    warnings: [...prev.warnings, data.warning],
                  }));
                } else if (data.type === 'complete') {
                  setState((prev) => ({
                    ...prev,
                    isGenerating: false,
                    isStreaming: false,
                  }));
                  queryClient.invalidateQueries({
                    queryKey: ['generated-documents', caseId],
                  });
                } else if (data.type === 'error') {
                  throw new Error(data.message);
                }
              } catch (e) {
                // Ignore JSON parse errors for partial chunks
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            isStreaming: false,
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          isGenerating: false,
          isStreaming: false,
          error: (error as Error).message,
        }));
      }
    },
    [caseId, queryClient]
  );

  // Generate document
  const generate = useCallback(
    async (params: GenerateParams, useStreaming = true) => {
      if (useStreaming) {
        await generateStreaming(params);
      } else {
        setState((prev) => ({ ...prev, isGenerating: true, error: null }));
        try {
          const result = await generateMutation.mutateAsync(params);
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            content: result.content,
            warnings: result.warnings || [],
          }));
        } catch (error) {
          setState((prev) => ({
            ...prev,
            isGenerating: false,
            error: (error as Error).message,
          }));
        }
      }
    },
    [generateStreaming, generateMutation]
  );

  // Cancel generation
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState((prev) => ({
      ...prev,
      isGenerating: false,
      isStreaming: false,
    }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      content: '',
      isStreaming: false,
      warnings: [],
      error: null,
    });
  }, []);

  return {
    // State
    ...state,
    documentsLoading,
    generatedDocuments: generatedDocuments || [],

    // Actions
    generate,
    cancel,
    reset,
    getLatestVersion,
  };
}

// Tone options
export const toneOptions = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Formal and balanced tone suitable for most cases',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    description: 'Assertive tone emphasizing liability and damages',
  },
  {
    value: 'conservative',
    label: 'Conservative',
    description: 'Measured tone for cases with liability concerns',
  },
  {
    value: 'empathetic',
    label: 'Empathetic',
    description: 'Focus on human impact and client suffering',
  },
] as const;

// Document type options
export const documentTypeOptions = [
  {
    value: 'DEMAND_LETTER' as GeneratedDocType,
    label: 'Demand Letter',
    description: 'Complete demand letter for settlement negotiation',
    icon: 'FileText',
  },
  {
    value: 'EXECUTIVE_SUMMARY' as GeneratedDocType,
    label: 'Executive Summary',
    description: 'High-level case overview for quick review',
    icon: 'FileBarChart',
  },
  {
    value: 'GAP_ANALYSIS' as GeneratedDocType,
    label: 'Gap Analysis',
    description: 'Identify missing documentation and evidence',
    icon: 'AlertTriangle',
  },
  {
    value: 'TREATMENT_TIMELINE' as GeneratedDocType,
    label: 'Treatment Timeline',
    description: 'Chronological medical treatment summary',
    icon: 'Calendar',
  },
  {
    value: 'DAMAGES_WORKSHEET' as GeneratedDocType,
    label: 'Damages Worksheet',
    description: 'Detailed damages calculation breakdown',
    icon: 'Calculator',
  },
] as const;
