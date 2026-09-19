import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, Alert } from "react-native";
import { useBillStore } from "../../store/billStore";
import { useAccountStore } from "../../store/accountStore";
import { useThemeStore } from "../../store/themeStore";

function getDaysUntilDue(dueDate: string) {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.setHours(0, 0, 0, 0);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function BillsScreen() {
  const { bills, isLoading, fetchBills, payBill } = useBillStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    fetchBills();
  }, []);

  const mainAccount = accounts[0];

  async function handlePay(billId: string, companyName: string, amount: number) {
    Alert.alert(
      "Confirmar pago",
      `¿Pagar ${companyName} por $${amount.toLocaleString("es-AR")}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Pagar",
          onPress: async () => {
            const { error } = await payBill(billId, mainAccount.id);
            if (error) {
              Alert.alert("Error", error);
            } else {
              await fetchAccounts();
              Alert.alert("¡Listo! ✅", "Servicio pagado correctamente");
            }
          },
        },
      ]
    );
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

      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No tenés servicios cargados.</Text>
        }
        renderItem={({ item }) => {
          const daysLeft = getDaysUntilDue(item.due_date);
          const isOverdue = daysLeft < 0 && !item.is_paid;
          const isDueSoon = daysLeft >= 0 && daysLeft <= 5 && !item.is_paid;

          return (
            <View
              style={[styles.billCard, { backgroundColor: theme.surface }]}
              accessible
              accessibilityLabel={`${item.company_name}, ${item.category}, $${item.amount}, ${item.is_paid ? "pagado" : isOverdue ? "vencido" : "pendiente"}`}
            >
              <View style={styles.billHeader}>
                <Text style={[styles.companyName, { color: theme.text }]}>{item.company_name}</Text>
                {item.is_paid ? (
                  <View style={[styles.badge, { backgroundColor: theme.success + "33" }]}>
                    <Text style={[styles.badgeText, { color: theme.success }]}>PAGADO</Text>
                  </View>
                ) : isOverdue ? (
                  <View style={[styles.badge, { backgroundColor: theme.danger + "33" }]}>
                    <Text style={[styles.badgeText, { color: theme.danger }]}>VENCIDO</Text>
                  </View>
                ) : isDueSoon ? (
                  <View style={[styles.badge, { backgroundColor: theme.warning + "33" }]}>
                    <Text style={[styles.badgeText, { color: theme.warning }]}>PRÓXIMO A VENCER</Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.category, { color: theme.textSecondary }]}>{item.category}</Text>
              <Text style={[styles.amount, { color: theme.text }]}>${item.amount.toLocaleString("es-AR")}</Text>
              <Text style={[styles.dueDate, { color: theme.textSecondary }]}>
                Vencimiento: {new Date(item.due_date).toLocaleDateString("es-AR")}
              </Text>

              {!item.is_paid && (
                <TouchableOpacity
                  style={[styles.payButton, { backgroundColor: theme.primary }]}
                  onPress={() => handlePay(item.id, item.company_name, item.amount)}
                  accessibilityRole="button"
                  accessibilityLabel={`Pagar ${item.company_name}`}
                >
                  <Text style={styles.payButtonText}>Pagar ahora</Text>
                </TouchableOpacity>
              )}
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
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  empty: { textAlign: "center", marginTop: 40 },
  billCard: { borderRadius: 12, padding: 16, marginBottom: 14 },
  billHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  companyName: { fontSize: 17, fontWeight: "bold" },
  category: { fontSize: 13, marginBottom: 8 },
  amount: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  dueDate: { fontSize: 13, marginBottom: 12 },
  payButton: { borderRadius: 8, padding: 12, alignItems: "center" },
  payButtonText: { color: "#fff", fontWeight: "bold" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "bold" },
});