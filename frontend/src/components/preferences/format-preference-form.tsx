import { format } from "date-fns";
import { useMemo } from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DATE_TOKENS, TIME_TOKENS } from "@/lib/org/format-date";
import type { DateFormat, TimeFormat } from "@/lib/org/types";
import { useOrgSettings } from "@/lib/org/use-org-settings";
import { useUpdateUserPreferences } from "@/lib/user-preferences/use-update-user-preferences";

const DATE_FORMATS: DateFormat[] = ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"];
const TIME_FORMATS: TimeFormat[] = ["12h", "24h"];
const ORG_DEFAULT = "__org_default__";

const BROWSER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

function getTimezones(): string[] {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  if (typeof intl.supportedValuesOf === "function") {
    return intl.supportedValuesOf("timeZone");
  }
  return ["UTC"];
}

function buildTimezoneOptions(): ComboboxOption[] {
  return getTimezones().map((tz) => ({
    value: tz,
    label: tz.replace(/_/g, " "),
  }));
}

interface FormatPreferenceFormProps {
  currentDateFormat: DateFormat | null;
  currentTimeFormat: TimeFormat | null;
  currentTimezone: string;
}

export function FormatPreferenceForm({
  currentDateFormat,
  currentTimeFormat,
  currentTimezone,
}: FormatPreferenceFormProps) {
  const { data: orgSettings } = useOrgSettings();
  const { mutate, isPending } = useUpdateUserPreferences();
  const timezoneOptions = useMemo(buildTimezoneOptions, []);

  const now = useMemo(() => new Date(), []);

  function dateLabel(fmt: DateFormat) {
    return `${fmt} (${format(now, DATE_TOKENS[fmt])})`;
  }

  function timeLabel(fmt: TimeFormat) {
    const labels: Record<TimeFormat, string> = {
      "12h": `12-hour (${format(now, TIME_TOKENS["12h"])})`,
      "24h": `24-hour (${format(now, TIME_TOKENS["24h"])})`,
    };
    return labels[fmt];
  }

  const orgDateLabel = orgSettings ? dateLabel(orgSettings.dateFormat) : "";
  const orgTimeLabel = orgSettings ? timeLabel(orgSettings.timeFormat) : "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="date-format" className="text-sm font-medium">
          Date format
        </label>
        <Select
          value={currentDateFormat ?? ORG_DEFAULT}
          onValueChange={(v) =>
            mutate({ dateFormat: v === ORG_DEFAULT ? null : (v as DateFormat) })
          }
          disabled={isPending}
        >
          <SelectTrigger id="date-format" className="w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ORG_DEFAULT}>
              Use organization default{orgDateLabel ? ` (${orgDateLabel})` : ""}
            </SelectItem>
            {DATE_FORMATS.map((fmt) => (
              <SelectItem key={fmt} value={fmt}>
                {dateLabel(fmt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="time-format" className="text-sm font-medium">
          Time format
        </label>
        <Select
          value={currentTimeFormat ?? ORG_DEFAULT}
          onValueChange={(v) =>
            mutate({ timeFormat: v === ORG_DEFAULT ? null : (v as TimeFormat) })
          }
          disabled={isPending}
        >
          <SelectTrigger id="time-format" className="w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ORG_DEFAULT}>
              Use organization default{orgTimeLabel ? ` (${orgTimeLabel})` : ""}
            </SelectItem>
            {TIME_FORMATS.map((fmt) => (
              <SelectItem key={fmt} value={fmt}>
                {timeLabel(fmt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="timezone" className="text-sm font-medium">
          Timezone
        </label>
        <div className="max-w-sm">
          <Combobox
            options={timezoneOptions}
            value={currentTimezone}
            onChange={(v) => {
              if (v) mutate({ timezone: v });
            }}
            placeholder="Select timezone..."
            searchPlaceholder="Search timezones..."
            emptyText="No timezone found."
            disabled={isPending}
          />
        </div>
        {currentTimezone === "UTC" && BROWSER_TIMEZONE !== "UTC" && (
          <p className="text-xs text-muted-foreground">
            Your browser timezone is {BROWSER_TIMEZONE.replace(/_/g, " ")}.{" "}
            <button
              type="button"
              className="text-primary underline underline-offset-2"
              onClick={() => mutate({ timezone: BROWSER_TIMEZONE })}
            >
              Use it instead
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
