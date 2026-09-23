import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBillStore } from "../../store/billStore";
import { useAccountStore } from "../../store/accountStore";
import { useThemeStore } from "../../store/themeStore";
import { showAlert } from "../../utils/appAlert";

function getDaysUntilDue(dueDate: string) {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.setHours(0, 0, 0, 0);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Luz: "flash-outline",
  Gas: "flame-outline",
  Internet: "wifi-outline",
};

export default function BillsScreen() {
  const { bills, isLoading, fetchBills, payBill } = useBillStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    fetchBills();
  }, []);

  const mainAccount = accounts[0];
  const pendingCount = bills.filter((b) => !b.is_paid).length;
  const pendingTotal = bills.filter((b) => !b.is_paid).reduce((sum, b) => sum + b.amount, 0);

 async function handlePay(billId: string, companyName: string, amount: number) {
    showAlert("Confirmar pago", `¿Pagar ${companyName} por $${amount.toLocaleString("es-AR")}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Pagar",
        onPress: async () => {
          const { error } = await payBill(billId, mainAccount.id);
          if (error) {
            showAlert("Error", error);
          } else {
            await fetchAccounts();
            showAlert("¡Listo! ✅", "Servicio pagado correctamente");
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Pagos y servicios</Text>

      {pendingCount > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
          <View>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              {pendingCount} {pendingCount === 1 ? "pago pendiente" : "pagos pendientes"}
            </Text>
            <Text style={[styles.summaryAmount, { color: theme.text }]}>
              ${pendingTotal.toLocaleString("es-AR")}
            </Text>
          </View>
          <View style={[styles.summaryIconBox, { backgroundColor: theme.warning + "22" }]}>
            <Ionicons name="alert-circle-outline" size={22} color={theme.warning} />
          </View>
        </View>
      )}

      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={32} color={theme.textSecondary} />
            <Text style={[styles.empty, { color: theme.textSecondary }]}>No tenés servicios cargados.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const daysLeft = getDaysUntilDue(item.due_date);
          const isOverdue = daysLeft < 0 && !item.is_paid;
          const isDueSoon = daysLeft >= 0 && daysLeft <= 5 && !item.is_paid;

          return (
            <View style={[styles.billCard, { backgroundColor: theme.surface }]}>
              <View style={styles.billTopRow}>
                <View style={[styles.categoryIconBox, { backgroundColor: theme.primary + "1A" }]}>
                  <Ionicons
                    name={CATEGORY_ICONS[item.category] || "receipt-outline"}
                    size={20}
                    color={theme.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.companyName, { color: theme.text }]}>{item.company_name}</Text>
                  <Text style={[styles.category, { color: theme.textSecondary }]}>{item.category}</Text>
                </View>
                {item.is_paid ? (
                  <View style={[styles.badge, { backgroundColor: theme.success + "22" }]}>
                    <Text style={[styles.badgeText, { color: theme.success }]}>PAGADO</Text>
                  </View>
                ) : isOverdue ? (
                  <View style={[styles.badge, { backgroundColor: theme.danger + "22" }]}>
                    <Text style={[styles.badgeText, { color: theme.danger }]}>VENCIDO</Text>
                  </View>
                ) : isDueSoon ? (
                  <View style={[styles.badge, { backgroundColor: theme.warning + "22" }]}>
                    <Text style={[styles.badgeText, { color: theme.warning }]}>PRÓXIMO</Text>
                  </View>
                ) : null}
              </View>

              <View style={[styles.billBottomRow, { borderTopColor: theme.border }]}>
                <View>
                  <Text style={[styles.amount, { color: theme.text }]}>
                    ${item.amount.toLocaleString("es-AR")}
                  </Text>
                  <Text style={[styles.dueDate, { color: theme.textSecondary }]}>
                    Vence {new Date(item.due_date).toLocaleDateString("es-AR")}
                  </Text>
                </View>

                {!item.is_paid && (
                  <TouchableOpacity
                    style={[styles.payButton, { backgroundColor: theme.primary }]}
                    onPress={() => handlePay(item.id, item.company_name, item.amount)}
                    accessibilityRole="button"
                    accessibilityLabel={`Pagar ${item.company_name}`}
                  >
                    <Text style={styles.payButtonText}>Pagar</Text>
                  </TouchableOpacity>
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
  container: { flex: 1, padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
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
  emptyBox: { alignItems: "center", marginTop: 40, gap: 8 },
  empty: { textAlign: "center" },
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
  payButton: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  payButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});