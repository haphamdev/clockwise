import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { ChartLayers, ChartMode } from "@/lib/reports/chart-utils";
import { DEFAULT_LAYERS } from "@/lib/reports/chart-utils";

interface ChartToolbarProps {
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
  layers?: ChartLayers;
  onLayersChange?: (layers: ChartLayers) => void;
}

export function ChartToolbar({
  mode,
  onModeChange,
  layers = DEFAULT_LAYERS,
  onLayersChange,
}: ChartToolbarProps) {
  const id = useId();

  return (
    <div className="flex items-center gap-3">
      <Tabs value={mode} onValueChange={(v) => onModeChange(v as ChartMode)}>
        <TabsList className="h-8">
          <TabsTrigger value="stacked" className="px-3 py-1 text-xs">
            Stacked
          </TabsTrigger>
          <TabsTrigger value="grouped" className="px-3 py-1 text-xs">
            Grouped
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {onLayersChange && (
        <>
          <div className="flex items-center gap-1.5">
            <Checkbox
              id={`${id}-values`}
              checked={layers.values}
              onCheckedChange={(checked) =>
                onLayersChange({ ...layers, values: checked === true })
              }
            />
            <Label htmlFor={`${id}-values`} className="text-xs cursor-pointer">
              Values
            </Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox
              id={`${id}-trend`}
              checked={layers.trend}
              onCheckedChange={(checked) =>
                onLayersChange({ ...layers, trend: checked === true })
              }
            />
            <Label htmlFor={`${id}-trend`} className="text-xs cursor-pointer">
              Trend
            </Label>
          </div>
        </>
      )}
    </div>
  );
}
