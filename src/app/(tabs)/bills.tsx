import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBillStore, Bill } from "../../store/billStore";
import { useAccountStore } from "../../store/accountStore";
import { useThemeStore } from "../../store/themeStore";
import { showAlert } from "../../utils/appAlert";
import { formatMoney } from "../../utils/format";
import { formatDateAR, formatTimestampAR, getDaysUntil } from "../../utils/dates";
import { getCategoryMeta } from "../../constants/billCategories";

function getStatus(bill: Bill) {
  if (bill.is_paid) return { key: "paid" as const, label: "PAGADO", detail: "" };
  const days = getDaysUntil(bill.due_date);
  if (days < 0) {
    return { key: "overdue" as const, label: "VENCIDO", detail: `Venció hace ${-days} ${days === -1 ? "día" : "días"}` };
  }
  if (days === 0) return { key: "soon" as const, label: "VENCE HOY", detail: "Vence hoy" };
  if (days <= 5) {
    return { key: "soon" as const, label: "PRÓXIMO", detail: `Vence en ${days} ${days === 1 ? "día" : "días"}` };
  }
  return { key: "ok" as const, label: "", detail: `Vence en ${days} días` };
}

export default function BillsScreen() {
  const { bills, isLoading, fetchBills, payBill, deleteBill } = useBillStore();
  const { fetchAccounts } = useAccountStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  // Pendientes primero (por vencimiento) y pagados al final
  const sorted = useMemo(() => {
    const pending = bills.filter((b) => !b.is_paid);
    const paid = bills
      .filter((b) => b.is_paid)
      .sort((a, b) => (b.paid_at ?? "").localeCompare(a.paid_at ?? ""));
    return [...pending, ...paid];
  }, [bills]);

  const pending = bills.filter((b) => !b.is_paid);
  const pendingTotal = pending.reduce((sum, b) => sum + b.amount, 0);
  const overdueCount = pending.filter((b) => getDaysUntil(b.due_date) < 0).length;

  async function onRefresh() {
    setRefreshing(true);
    await fetchBills();
    setRefreshing(false);
  }

  function handlePay(bill: Bill) {
    showAlert("Confirmar pago", `¿Pagar ${bill.company_name} por ${formatMoney(bill.amount, 0)}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Pagar",
        onPress: async () => {
          const { error } = await payBill(bill.id, bill.account_id);
          if (error) {
            showAlert("Error", error);
          } else {
            await fetchAccounts();
            showAlert("¡Listo!", `Pagaste ${bill.company_name} correctamente`);
          }
        },
      },
    ]);
  }

  function handleDelete(bill: Bill) {
    showAlert("Eliminar servicio", `¿Querés eliminar ${bill.company_name} de tus servicios pendientes?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const { error } = await deleteBill(bill.id);
          if (error) showAlert("Error", error);
        },
      },
    ]);
  }

  if (isLoading && bills.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const statusColor = { paid: theme.success, overdue: theme.danger, soon: theme.warning, ok: theme.textSecondary };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Pagos y servicios</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {bills.length} {bills.length === 1 ? "servicio" : "servicios"}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.primary }]}
                onPress={() => router.push("/new-bill")}
                accessibilityRole="button"
                accessibilityLabel="Agregar servicio"
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {pending.length > 0 && (
              <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
                <View>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                    {pending.length} {pending.length === 1 ? "pago pendiente" : "pagos pendientes"}
                    {overdueCount > 0 ? ` · ${overdueCount} ${overdueCount === 1 ? "vencido" : "vencidos"}` : ""}
                  </Text>
                  <Text style={[styles.summaryAmount, { color: theme.text }]}>{formatMoney(pendingTotal, 0)}</Text>
                </View>
                <View
                  style={[
                    styles.summaryIconBox,
                    { backgroundColor: (overdueCount > 0 ? theme.danger : theme.warning) + "22" },
                  ]}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={22}
                    color={overdueCount > 0 ? theme.danger : theme.warning}
                  />
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={36} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No tenés servicios cargados</Text>
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              Agregá tus facturas para tener los vencimientos a mano.
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push("/new-bill")}
            >
              <Text style={styles.emptyButtonText}>Agregar servicio</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const status = getStatus(item);
          const meta = getCategoryMeta(item.category);
          const color = statusColor[status.key];

          return (
            <View style={[styles.billCard, { backgroundColor: theme.surface }]}>
              <View style={styles.billTopRow}>
                <View style={[styles.categoryIconBox, { backgroundColor: meta.color + "22" }]}>
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.companyName, { color: theme.text }]} numberOfLines={1}>
                    {item.company_name}
                  </Text>
                  <Text style={[styles.category, { color: theme.textSecondary }]}>{item.category}</Text>
                </View>
                {status.label !== "" && (
                  <View style={[styles.badge, { backgroundColor: color + "22" }]}>
                    <Text style={[styles.badgeText, { color }]}>{status.label}</Text>
                  </View>
                )}
              </View>

              <View style={[styles.billBottomRow, { borderTopColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.amount, { color: theme.text }]}>{formatMoney(item.amount, 0)}</Text>
                  <Text style={[styles.dueDate, { color: theme.textSecondary }]}>
                    {item.is_paid
                      ? `Pagado el ${item.paid_at ? formatTimestampAR(item.paid_at) : formatDateAR(item.due_date)}`
                      : `${formatDateAR(item.due_date)} · ${status.detail}`}
                  </Text>
                </View>

                {!item.is_paid && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.deleteButton, { backgroundColor: theme.danger + "1A" }]}
                      onPress={() => handleDelete(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar ${item.company_name}`}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.danger} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.payButton, { backgroundColor: theme.primary }]}
                      onPress={() => handlePay(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Pagar ${item.company_name}`}
                    >
                      <Text style={styles.payButtonText}>Pagar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { fontSize: 13, marginTop: 2 },
  addButton: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  summaryCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  summaryLabel: { fontSize: 12, marginBottom: 4 },
  summaryAmount: { fontSize: 22, fontWeight: "bold" },
  summaryIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  emptyBox: { alignItems: "center", marginTop: 40, gap: 8, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
  empty: { textAlign: "center", fontSize: 13 },
  emptyButton: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24, marginTop: 12 },
  emptyButtonText: { color: "#fff", fontWeight: "bold" },
  billCard: { borderRadius: 14, padding: 16, marginBottom: 14 },
  billTopRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  categoryIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  companyName: { fontSize: 16, fontWeight: "bold" },
  category: { fontSize: 12, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "bold" },
  billBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  amount: { fontSize: 20, fontWeight: "bold" },
  dueDate: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  deleteButton: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  payButton: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  payButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});
