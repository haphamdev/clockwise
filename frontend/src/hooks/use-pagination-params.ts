import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

interface UsePaginationParamsOptions {
  defaultLimit?: number;
}

export function usePaginationParams(options: UsePaginationParamsOptions = {}) {
  const { defaultLimit = 10 } = options;
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || defaultLimit;

  const setPage = useCallback(
    (newPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (newPage <= 1) {
          next.delete('page');
        } else {
          next.set('page', String(newPage));
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const getParam = useCallback(
    (key: string) => searchParams.get(key) ?? '',
    [searchParams],
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        // Reset to page 1 when filters change
        next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  const setParams = useCallback(
    (entries: Record<string, string>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(entries)) {
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        }
        next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  return useMemo(
    () => ({ page, limit, setPage, getParam, setParam, setParams }),
    [page, limit, setPage, getParam, setParam, setParams],
  );
}
