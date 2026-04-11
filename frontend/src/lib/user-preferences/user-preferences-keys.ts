export const userPreferencesKeys = {
  all: ["user-preferences"] as const,
  mine: () => [...userPreferencesKeys.all, "mine"] as const,
};
