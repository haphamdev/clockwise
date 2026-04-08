import { useState, useRef } from 'react';
import { Upload, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { downloadTemplate } from '@/lib/import/import-api';

export function UploadStep({
  onFileSelect,
  isPending,
  error,
  type,
}: {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPending: boolean;
  error: string | null;
  type: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadTemplate(type);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8">
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">Select a CSV file to upload</p>
          <p className="text-xs text-muted-foreground">Maximum file size: 5MB</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            onFileSelect(e);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          disabled={isPending}
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Parsing...
            </>
          ) : (
            'Choose File'
          )}
        </Button>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <Download className="mr-1.5 h-4 w-4" />
          {downloading ? 'Downloading...' : 'Download CSV template'}
        </button>
      </div>
    </div>
  );
}
