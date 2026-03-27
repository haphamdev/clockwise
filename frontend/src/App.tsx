import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PlaceholderPage title="Sign in to Clockwise" />} />
        <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
        <Route path="/time-logs" element={<PlaceholderPage title="My Time Logs" />} />
        <Route path="/projects" element={<PlaceholderPage title="Projects" />} />
        <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="/admin" element={<PlaceholderPage title="Admin Panel" />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
