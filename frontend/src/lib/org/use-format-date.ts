import { useCallback } from "react";
import { useEffectiveFormats } from "@/lib/user-preferences/use-effective-formats";
import {
  formatDate as formatDateFn,
  formatDateTime as formatDateTimeFn,
} from "./format-date";

export function useFormatDate() {
  const { dateFormat, timeFormat } = useEffectiveFormats();

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
