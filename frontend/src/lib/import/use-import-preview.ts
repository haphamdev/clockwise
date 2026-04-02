import { useMutation } from '@tanstack/react-query';
import { previewImport } from './import-api';
import type { ImportPreviewPayload } from './types';

export function useImportPreview() {
  return useMutation({
    mutationFn: (payload: ImportPreviewPayload) => previewImport(payload),
  });
}
