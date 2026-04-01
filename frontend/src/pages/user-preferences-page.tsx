import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { ThemePreferenceForm } from '@/components/preferences/theme-preference-form';
import { useUserPreferences } from '@/lib/user-preferences/use-user-preferences';

export function UserPreferencesPage() {
  const { data: prefs, isLoading, isError } = useUserPreferences();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
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
    </div>
  );
}
