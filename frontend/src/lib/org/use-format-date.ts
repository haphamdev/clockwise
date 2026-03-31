import { useCallback } from 'react';
import { useOrgSettings } from './use-org-settings';
import { formatDate as formatDateFn, formatDateTime as formatDateTimeFn } from './format-date';
import type { DateFormat, TimeFormat } from './types';

export function useFormatDate() {
  const { data: settings } = useOrgSettings();
  const dateFormat: DateFormat = settings?.dateFormat ?? 'YYYY-MM-DD';
  const timeFormat: TimeFormat = settings?.timeFormat ?? '12h';

  const formatDate = useCallback(
    (input: string | Date, options?: { relative?: boolean }) =>
      formatDateFn(input, dateFormat, options),
    [dateFormat],
  );

  const formatDateTime = useCallback(
    (input: string | Date, options?: { relative?: boolean }) =>
      formatDateTimeFn(input, dateFormat, timeFormat, options),
    [dateFormat, timeFormat],
  );

  return { formatDate, formatDateTime };
}
