export const orgKeys = {
  all: ['org'] as const,
  settings: () => [...orgKeys.all, 'settings'] as const,
};
