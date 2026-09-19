import { create } from 'zustand';
import { Appearance } from 'react-native';
import { buildTheme, Theme, ThemeMode, ColorScheme } from '../theme/colors';

interface ThemeState {
  mode: ThemeMode;
  scheme: ColorScheme;
  theme: Theme;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  setScheme: (scheme: ColorScheme) => void;
}

const initialMode: ThemeMode = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
const initialScheme: ColorScheme = 'blue';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  scheme: initialScheme,
  theme: buildTheme(initialMode, initialScheme),

  toggleMode: () => {
    const newMode: ThemeMode = get().mode === 'dark' ? 'light' : 'dark';
    set({ mode: newMode, theme: buildTheme(newMode, get().scheme) });
  },

  setMode: (mode) => {
    set({ mode, theme: buildTheme(mode, get().scheme) });
  },

  setScheme: (scheme) => {
    set({ scheme, theme: buildTheme(get().mode, scheme) });
  },
}));