import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, Alert } from "react-native";
import { useBillStore } from "../../store/billStore";
import { useAccountStore } from "../../store/accountStore";

function getDaysUntilDue(dueDate: string) {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.setHours(0, 0, 0, 0);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function BillsScreen() {
  const { bills, isLoading, fetchBills, payBill } = useBillStore();
  const { accounts, fetchAccounts } = useAccountStore();

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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pagos y servicios</Text>

      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No tenés servicios cargados.</Text>}
        renderItem={({ item }) => {
          const daysLeft = getDaysUntilDue(item.due_date);
          const isOverdue = daysLeft < 0 && !item.is_paid;
          const isDueSoon = daysLeft >= 0 && daysLeft <= 5 && !item.is_paid;

          return (
            <View style={styles.billCard}>
              <View style={styles.billHeader}>
                <Text style={styles.companyName}>{item.company_name}</Text>
                {item.is_paid ? (
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidText}>PAGADO</Text>
                  </View>
                ) : isOverdue ? (
                  <View style={styles.overdueBadge}>
                    <Text style={styles.overdueText}>VENCIDO</Text>
                  </View>
                ) : isDueSoon ? (
                  <View style={styles.dueSoonBadge}>
                    <Text style={styles.dueSoonText}>PRÓXIMO A VENCER</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.amount}>${item.amount.toLocaleString("es-AR")}</Text>
              <Text style={styles.dueDate}>
                Vencimiento: {new Date(item.due_date).toLocaleDateString("es-AR")}
              </Text>

              {!item.is_paid && (
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={() => handlePay(item.id, item.company_name, item.amount)}
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
  empty: { color: "#999", textAlign: "center", marginTop: 40 },
  billCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  billHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  companyName: { fontSize: 17, fontWeight: "bold" },
  category: { fontSize: 13, color: "#666", marginBottom: 8 },
  amount: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  dueDate: { fontSize: 13, color: "#888", marginBottom: 12 },
  payButton: {
    backgroundColor: "#0066FF",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  payButtonText: { color: "#fff", fontWeight: "bold" },
  paidBadge: { backgroundColor: "#00A65020", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  paidText: { color: "#00A650", fontSize: 11, fontWeight: "bold" },
  overdueBadge: { backgroundColor: "#FF3B3020", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  overdueText: { color: "#FF3B30", fontSize: 11, fontWeight: "bold" },
  dueSoonBadge: { backgroundColor: "#FFA50020", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  dueSoonText: { color: "#FF8C00", fontSize: 11, fontWeight: "bold" },
});