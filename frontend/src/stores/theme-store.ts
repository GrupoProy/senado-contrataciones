import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (t: Theme) => void;
  applyTheme: () => void;
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'dark',

      setTheme: (theme) => {
        set({ theme });
        get().applyTheme();
      },

      applyTheme: () => {
        const resolved = resolveTheme(get().theme);
        document.documentElement.classList.toggle('dark', resolved === 'dark');
        set({ resolvedTheme: resolved });
      },
    }),
    {
      name: 'contrataciones-theme',
      onRehydrateStorage: () => (state) => state?.applyTheme(),
    }
  )
);

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme, applyTheme } = useThemeStore.getState();
    if (theme === 'system') applyTheme();
  });
}
