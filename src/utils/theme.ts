export const APP_THEME_KEY = 'ik-app-theme';

export const APP_THEMES = ['light', 'dark', 'coffee', 'blue', 'orange'] as const;
export type AppTheme = typeof APP_THEMES[number];

export const DEFAULT_APP_THEME: AppTheme = 'light';

export function isAppTheme(value: string | null): value is AppTheme {
  return !!value && APP_THEMES.includes(value as AppTheme);
}

export function getStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return DEFAULT_APP_THEME;
  const saved = window.localStorage.getItem(APP_THEME_KEY);
  return isAppTheme(saved) ? saved : DEFAULT_APP_THEME;
}

export function applyTheme(theme: AppTheme, persist = true) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  if (persist && typeof window !== 'undefined') {
    window.localStorage.setItem(APP_THEME_KEY, theme);
  }
}
