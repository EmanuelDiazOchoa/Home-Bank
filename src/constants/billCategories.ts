import { Ionicons } from "@expo/vector-icons";

type IconName = keyof typeof Ionicons.glyphMap;

export interface CategoryMeta {
  icon: IconName;
  color: string;
}

export const BILL_CATEGORIES = [
  "Luz",
  "Gas",
  "Internet",
  "Agua",
  "Teléfono",
  "Tarjeta",
  "Alquiler",
  "Seguro",
  "Otros",
] as const;

export type BillCategory = (typeof BILL_CATEGORIES)[number];

const META: Record<string, CategoryMeta> = {
  Luz: { icon: "flash-outline", color: "#F5A623" },
  Gas: { icon: "flame-outline", color: "#FF6B6B" },
  Internet: { icon: "wifi-outline", color: "#4A90D9" },
  Agua: { icon: "water-outline", color: "#2BB5C9" },
  Teléfono: { icon: "call-outline", color: "#9B59B6" },
  Tarjeta: { icon: "card-outline", color: "#E67E22" },
  Alquiler: { icon: "home-outline", color: "#16A085" },
  Seguro: { icon: "shield-checkmark-outline", color: "#3F7FBF" },
  Otros: { icon: "ellipsis-horizontal", color: "#8E9AAF" },
  "Transferencia enviada": { icon: "swap-horizontal-outline", color: "#E5484D" },
  "Transferencia recibida": { icon: "swap-horizontal-outline", color: "#2EAD6B" },
  Inversión: { icon: "trending-up-outline", color: "#7C5CFF" },
  Préstamo: { icon: "cash-outline", color: "#1ABC9C" },
};

export function getCategoryMeta(category: string): CategoryMeta {
  return META[category] ?? { icon: "ellipsis-horizontal", color: "#8E9AAF" };
}
