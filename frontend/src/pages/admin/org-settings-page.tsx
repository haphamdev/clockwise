import { OrgSettingsForm } from "@/components/admin/org/org-settings-form";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useOrgSettings } from "@/lib/org/use-org-settings";

export function OrgSettingsPage() {
  useDocumentTitle("Clockwise - Organization Settings");
  const { data: settings, isLoading } = useOrgSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Settings"
        description="Configure organization-wide preferences."
      />
      {isLoading ? (
        <div className="max-w-lg space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder rows have no stable identity
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : settings ? (
        <OrgSettingsForm settings={settings} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Failed to load settings.
        </p>
      )}
    </div>
  );
}
