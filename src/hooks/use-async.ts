import { useState, useCallback } from 'react';
import { logError } from '@/utils/logger';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: (asyncFunction: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook para gerenciar estados assíncronos de forma padronizada
 * @param initialData Dados iniciais (opcional)
 * @returns Estado e funções para executar operações assíncronas
 */
export function useAsync<T = unknown>(initialData: T | null = null): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (asyncFunction: () => Promise<T>): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await asyncFunction();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      logError(error, 'useAsync');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook especializado para operações que não retornam dados (como delete, update)
 * @returns Estado e função para executar operações
 */
export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (asyncFunction: () => Promise<void>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await asyncFunction();
      setLoading(false);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      setLoading(false);
      logError(error, 'useAsyncAction');
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    reset,
  };
}