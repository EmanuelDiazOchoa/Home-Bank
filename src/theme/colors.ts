export type ThemeMode = "light" | "dark";
export type ColorScheme = "blue" | "green" | "purple" | "orange" | "red";

export interface Theme {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryLight: string;
  success: string;
  danger: string;
  warning: string;
}

const baseLight = {
  background: "#FFFFFF",
  surface: "#F5F5F5",
  card: "#FFFFFF",
  text: "#1A1A1A",
  textSecondary: "#666666",
  border: "#E0E0E0",
  success: "#00A650",
  danger: "#FF3B30",
  warning: "#FF8C00",
};

const baseDark = {
  background: "#121212",
  surface: "#1E1E1E",
  card: "#1E1E2E",
  text: "#F5F5F5",
  textSecondary: "#AAAAAA",
  border: "#333333",
  success: "#00C853",
  danger: "#FF5252",
  warning: "#FFA726",
};

const accentColors: Record<ColorScheme, { primary: string; primaryLight: string }> = {
  blue: { primary: "#0066FF", primaryLight: "#3385FF" },
  green: { primary: "#00A650", primaryLight: "#2ECC71" },
  purple: { primary: "#8B5CF6", primaryLight: "#A78BFA" },
  orange: { primary: "#FF7A00", primaryLight: "#FF9F40" },
  red: { primary: "#E53935", primaryLight: "#EF5350" },
};

export function buildTheme(mode: ThemeMode, scheme: ColorScheme): Theme {
  const base = mode === "dark" ? baseDark : baseLight;
  const accent = accentColors[scheme];
  return { ...base, ...accent };
}

export const COLOR_SCHEME_LABELS: Record<ColorScheme, string> = {
  blue: "Azul",
  green: "Verde",
  purple: "Violeta",
  orange: "Naranja",
  red: "Rojo",
};

export const COLOR_SCHEME_PREVIEW: Record<ColorScheme, string> = {
  blue: "#0066FF",
  green: "#00A650",
  purple: "#8B5CF6",
  orange: "#FF7A00",
  red: "#E53935",
};