import { browser } from '$app/environment';

const THEME_KEY = 'theme';

type Theme = 'light' | 'dark' | 'system';

let currentTheme = $state<Theme>('system');

const applyTheme = (theme: Theme) => {
  const themeToApply = theme === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    : theme;

  document.documentElement.classList.toggle('dark', themeToApply === 'dark');
};

const initializeTheme = () => {
  if (!browser) return; 

  const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
  const initialTheme = storedTheme || 'system';
  currentTheme = initialTheme;
  applyTheme(initialTheme);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme === 'system') {
      applyTheme('system');
    }
  });
};

// Initialize theme on load
initializeTheme();

export const theme = {
  get value() {
    return currentTheme;
  },
  set: (newTheme: Theme) => {
    currentTheme = newTheme;
    if (browser) {
      localStorage.setItem(THEME_KEY, newTheme);
    }
    applyTheme(newTheme);
  },
  toggle: () => {
     // In this simple version, toggle only switches between light/dark
     // It doesn't consider 'system' directly for toggling, 
     // but reads the applied theme derived from system preference if necessary
    const appliedTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = appliedTheme === 'dark' ? 'light' : 'dark';
    theme.set(newTheme); 
  }
}; 