export function formatMoney(value: number, decimals = 2) {
  return (
    "$" +
    value.toLocaleString("es-AR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}

export function parseAmount(text: string): number | null {
  let t = text.replace(/\s/g, "");
  if (t === "") return null;
  if (t.includes(",")) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else {
    const dots = (t.match(/\./g) || []).length;
    if (dots > 1 || (dots === 1 && /^\d{1,3}\.\d{3}$/.test(t))) t = t.replace(/\./g, "");
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
