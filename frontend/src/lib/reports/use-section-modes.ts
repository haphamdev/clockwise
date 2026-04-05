import { useCallback, useMemo } from 'react';
import type { ChartMode } from '@/components/reports/chart-mode-toggle';
import { parseChartModes, serializeChartModes } from './report-param-utils';

/**
 * Manages per-section chart modes via URL params.
 *
 * Each section stores its chart modes as a single comma-separated URL param
 * where position = chart index. e.g. tiMode=g,s means chart 0 is grouped,
 * chart 1 is stacked.
 *
 * @param paramKey  URL param name (e.g. 'piMode', 'tiMode')
 * @param defaults  Default mode for each chart position (order matters)
 * @param getParam  Read a URL param value
 * @param setParam  Write a URL param value
 * @returns [modes, setMode] — current modes array and a setter for one position
 */
export function useSectionModes(
  paramKey: string,
  defaults: ChartMode[],
  getParam: (key: string) => string,
  setParam: (key: string, value: string) => void,
): [ChartMode[], (chartIndex: number, mode: ChartMode) => void] {
  const raw = getParam(paramKey);

  const modes = useMemo(
    () => parseChartModes(raw, defaults),
    [raw, defaults],
  );

  const setMode = useCallback(
    (chartIndex: number, mode: ChartMode) => {
      const next = [...modes];
      next[chartIndex] = mode;
      setParam(paramKey, serializeChartModes(next));
    },
    [modes, paramKey, setParam],
  );

  return [modes, setMode];
}
