export function navLinkClasses(isActive: boolean): string {
  return `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-bg-light text-foreground'
      : 'text-muted-foreground hover:text-foreground hover:bg-bg-light'
  }`;
}
