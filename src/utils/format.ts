export function formatMoney(value: number, decimals = 2) {
  return (
    "$" +
    value.toLocaleString("es-AR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
}
