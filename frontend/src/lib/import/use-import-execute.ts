import { useMutation } from '@tanstack/react-query';
import { executeImport } from './import-api';
import type { ImportExecutePayload } from './types';

export function useImportExecute() {
  return useMutation({
    mutationFn: (payload: ImportExecutePayload) => executeImport(payload),
  });
}
