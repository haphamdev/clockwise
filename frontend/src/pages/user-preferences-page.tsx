import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { ThemePreferenceForm } from '@/components/preferences/theme-preference-form';
import { FormatPreferenceForm } from '@/components/preferences/format-preference-form';
import { WeekStartPreferenceForm } from '@/components/preferences/week-start-preference-form';
import { useUserPreferences } from '@/lib/user-preferences/use-user-preferences';
import { useDocumentTitle } from '@/hooks/use-document-title';

export function UserPreferencesPage() {
  useDocumentTitle('Clockwise - Settings');
  const { data: prefs, isLoading, isError } = useUserPreferences();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full max-w-md" />
        <Skeleton className="h-24 w-full max-w-md" />
      </div>
    );
  }

  if (isError || !prefs) {
    return <p className="py-12 text-center text-muted-foreground">Failed to load preferences.</p>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        breadcrumbs={[
          { label: 'Profile', href: '/profile' },
          { label: 'Settings' },
        ]}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <ThemePreferenceForm currentTheme={prefs.theme} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Date & Time</h2>
        <FormatPreferenceForm
          currentDateFormat={prefs.dateFormat}
          currentTimeFormat={prefs.timeFormat}
          currentTimezone={prefs.timezone}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Calendar</h2>
        <WeekStartPreferenceForm currentWeekStartDay={prefs.weekStartDay} />
      </section>
    </div>
  );
}
