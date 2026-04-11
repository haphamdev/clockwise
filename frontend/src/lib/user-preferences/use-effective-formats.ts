import type { DateFormat, TimeFormat } from "@/lib/org/types";
import { useOrgSettings } from "@/lib/org/use-org-settings";
import { useUserPreferences } from "./use-user-preferences";

/**
 * Resolves the effective date/time formats using the override chain:
 * user preference → org setting → hardcoded default
 */
export function useEffectiveFormats() {
  const { data: orgSettings } = useOrgSettings();
  const { data: prefs } = useUserPreferences();

  const dateFormat: DateFormat =
    prefs?.dateFormat ?? orgSettings?.dateFormat ?? "YYYY-MM-DD";
  const timeFormat: TimeFormat =
    prefs?.timeFormat ?? orgSettings?.timeFormat ?? "12h";

  return { dateFormat, timeFormat };
}
