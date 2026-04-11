import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { useUserPreferences } from "./use-user-preferences";

/**
 * Syncs the user's persisted theme preference to next-themes once on load.
 * Call this once in AppLayout so it runs for all authenticated pages.
 *
 * Uses a ref to ensure we only sync on the initial fetch — subsequent
 * refetches (window focus, stale time) won't override a pending local change.
 *
 * First-load flash: on a brand-new device (no localStorage), the app renders
 * with defaultTheme="dark" until this hook resolves. After the first sync,
 * next-themes stores the theme in localStorage so subsequent loads are instant.
 */
export function useSyncTheme() {
  const { data: prefs } = useUserPreferences();
  const { setTheme } = useTheme();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (prefs?.theme && !hasSynced.current) {
      hasSynced.current = true;
      setTheme(prefs.theme);
    }
  }, [prefs?.theme, setTheme]);
}
