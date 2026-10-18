import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAccountStore } from "../../store/accountStore";
import { useProfileStore } from "../../store/profileStore";
import { useBillStore } from "../../store/billStore";
import { useThemeStore } from "../../store/themeStore";
import { LinearGradient } from "expo-linear-gradient";
import { getDaysUntil } from "../../utils/dates";

export default function HomeScreen() {
  const { accounts, transactions, isLoading, fetchAccounts, fetchTransactions } = useAccountStore();
  const { fullName, fetchProfile } = useProfileStore();
  const { bills, fetchBills } = useBillStore();
  const { theme } = useThemeStore();
  const [showBalance, setShowBalance] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAccounts();
    fetchProfile();
    fetchBills();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) fetchTransactions(accounts[0].id);
  }, [accounts]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const mainAccount = accounts[0];
  const firstName = fullName?.trim().split(" ")[0] || "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  const initial = (fullName?.trim().charAt(0) || "U").toUpperCase();
  // Servicios vencidos o que vencen en los próximos 5 días
  const dueAlerts = bills.filter((b) => !b.is_paid && getDaysUntil(b.due_date) <= 5).length;

  const quickActions = [
    { label: "Transferir", icon: "swap-horizontal" as const, route: "/transfer" },
    { label: "Pagos", icon: "receipt-outline" as const, route: "/bills" },
    { label: "Tarjetas", icon: "card-outline" as const, route: "/cards" },
    { label: "Inversiones", icon: "trending-up-outline" as const, route: "/investments" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profile}
          onPress={() => router.push("/settings")}
          accessibilityRole="button"
          accessibilityLabel="Abrir ajustes y perfil"
        >
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>{initial}</Text>
            <View style={[styles.avatarBadge, { backgroundColor: theme.surface, borderColor: theme.background }]}>
              <Ionicons name="settings-sharp" size={9} color={theme.textSecondary} />
            </View>
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={[styles.greetingLabel, { color: theme.textSecondary }]}>{greeting}</Text>
            <Text style={[styles.greetingName, { color: theme.text }]} numberOfLines={1}>
              {firstName || "Bienvenido"}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bellButton, { backgroundColor: theme.surface }]}
          onPress={() => router.push("/bills")}
          accessibilityRole="button"
          accessibilityLabel={
            dueAlerts > 0 ? `${dueAlerts} servicios vencidos o por vencer` : "Sin vencimientos próximos"
          }
        >
          <Ionicons name={dueAlerts > 0 ? "notifications" : "notifications-outline"} size={20} color={theme.text} />
          {dueAlerts > 0 && (
            <View style={[styles.bellBadge, { backgroundColor: theme.danger, borderColor: theme.background }]}>
              <Text style={styles.bellBadgeText}>{dueAlerts > 9 ? "9+" : dueAlerts}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {mainAccount ? (
  <LinearGradient
    colors={[theme.primary, theme.primaryLight]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.card}
  >
          <View style={styles.cardTopRow}>
            <Text style={styles.cardLabel}>Caja de ahorro • {mainAccount.currency}</Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              <Ionicons name={showBalance ? "eye-outline" : "eye-off-outline"} size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.balance}>
            {showBalance
              ? `$${mainAccount.balance.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
              : "$ ••••••"}
          </Text>
          <Text style={styles.alias}>Alias: {mainAccount.alias}</Text>
          <Text style={styles.cbu}>CBU: {mainAccount.cbu}</Text>
        </LinearGradient>
      ) : (
        <Text style={{ color: theme.text }}>No se encontró ninguna cuenta.</Text>
      )}

      <View style={styles.quickActions}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={[styles.quickAction, { backgroundColor: theme.surface }]}
            onPress={() => router.push(action.route as any)}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Ionicons name={action.icon} size={22} color={theme.primary} />
            <Text style={[styles.quickActionLabel, { color: theme.text }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Movimientos recientes</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={32} color={theme.textSecondary} />
            <Text style={[styles.empty, { color: theme.textSecondary }]}>Todavía no tenés movimientos.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.transactionRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.transactionDesc, { color: theme.text }]}>
              {item.description || item.category}
            </Text>
            <Text
              style={[
                styles.transactionAmount,
                { color: item.type === "income" || item.type === "transfer_in" ? theme.success : theme.danger },
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  profile: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  greetingLabel: { fontSize: 12 },
  greetingName: { fontSize: 18, fontWeight: "bold" },
  bellButton: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  bellBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  container: { flex: 1, padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { borderRadius: 16, padding: 20, marginBottom: 20 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardLabel: { color: "#fff", opacity: 0.8, fontSize: 13 },
  balance: { color: "#fff", fontSize: 32, fontWeight: "bold", marginBottom: 12 },
  alias: { color: "#fff", fontSize: 13, opacity: 0.9 },
  cbu: { color: "#fff", fontSize: 13, opacity: 0.9 },
  quickActions: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  quickAction: { flex: 1, marginHorizontal: 4, borderRadius: 12, paddingVertical: 14, alignItems: "center", gap: 6 },
  quickActionLabel: { fontSize: 11, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  emptyBox: { alignItems: "center", marginTop: 30, gap: 8 },
  empty: { textAlign: "center" },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  transactionDesc: { fontSize: 15 },
  transactionAmount: { fontSize: 15, fontWeight: "600" },
});