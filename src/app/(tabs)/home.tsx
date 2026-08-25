import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import { useAccountStore } from "../../store/accountStore";

export default function HomeScreen() {
  const signOut = useAuthStore((state) => state.signOut);
  const { accounts, transactions, isLoading, fetchAccounts, fetchTransactions } = useAccountStore();
  const router = useRouter();

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      fetchTransactions(accounts[0].id);
    }
  }, [accounts]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  const mainAccount = accounts[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola 👋</Text>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.logout}>Salir</Text>
        </TouchableOpacity>
      </View>

      {mainAccount ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Caja de ahorro • {mainAccount.currency}</Text>
          <Text style={styles.balance}>
            ${mainAccount.balance.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.alias}>Alias: {mainAccount.alias}</Text>
          <Text style={styles.cbu}>CBU: {mainAccount.cbu}</Text>
        </View>
      ) : (
        <Text>No se encontró ninguna cuenta.</Text>
      )}

      <TouchableOpacity style={styles.transferButton} onPress={() => router.push("/transfer")}>
        <Text style={styles.transferButtonText}>💸 Transferir dinero</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Movimientos recientes</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Todavía no tenés movimientos.</Text>}
        renderItem={({ item }) => (
          <View style={styles.transactionRow}>
            <Text style={styles.transactionDesc}>{item.description || item.category}</Text>
            <Text
              style={[
                styles.transactionAmount,
                { color: item.type === "income" || item.type === "transfer_in" ? "#00A650" : "#FF3B30" },
              ]}
            >
              {item.type === "income" || item.type === "transfer_in" ? "+" : "-"}$
              {Math.abs(item.amount).toLocaleString("es-AR")}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: "bold" },
  logout: { color: "#FF3B30", fontWeight: "600" },
  card: {
    backgroundColor: "#0066FF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardLabel: { color: "#fff", opacity: 0.8, fontSize: 13, marginBottom: 8 },
  balance: { color: "#fff", fontSize: 32, fontWeight: "bold", marginBottom: 12 },
  alias: { color: "#fff", fontSize: 13, opacity: 0.9 },
  cbu: { color: "#fff", fontSize: 13, opacity: 0.9 },
  transferButton: {
    backgroundColor: "#00A650",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  transferButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  empty: { color: "#999", textAlign: "center", marginTop: 20 },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  transactionDesc: { fontSize: 15 },
  transactionAmount: { fontSize: 15, fontWeight: "600" },
});