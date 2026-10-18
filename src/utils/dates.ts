// Las fechas "date" de la base vienen como "YYYY-MM-DD". Se trabajan siempre en
// hora local para evitar el desfase de un día que produce new Date("YYYY-MM-DD").

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDateAR(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function getDaysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parseLocalDate(iso).getTime() - today.getTime()) / 86400000);
}

export function addDaysISO(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function endOfMonthISO(): string {
  const now = new Date();
  return toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
}

// "25/12/2026" -> "2026-12-25" (devuelve null si no es una fecha real)
export function parseARDate(text: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const d = Number(match[1]);
  const m = Number(match[2]);
  const y = Number(match[3]);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return toISODate(date);
}

// Inserta las barras mientras se escribe: "25122026" -> "25/12/2026"
export function maskARDate(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// Para timestamps con hora (ej. paid_at): se convierte a fecha local
export function formatTimestampAR(timestamp: string): string {
  const d = new Date(timestamp);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
