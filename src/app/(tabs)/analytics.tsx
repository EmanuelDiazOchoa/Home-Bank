import { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAccountStore } from "../../store/accountStore";
import { useThemeStore } from "../../store/themeStore";

const CATEGORY_COLORS: Record<string, string> = {
  "Transferencia enviada": "#FF3B30",
  "Transferencia recibida": "#00A650",
  "Luz": "#FFA500",
  "Gas": "#FF6B6B",
  "Internet": "#4A90D9",
  "Inversión": "#9B59B6",
  "Préstamo": "#1ABC9C",
};

export default function AnalyticsScreen() {
  const { accounts, transactions, isLoading, fetchAccounts, fetchTransactions } = useAccountStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      fetchTransactions(accounts[0].id);
    }
  }, [accounts]);

  const expenseData = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense" || t.type === "transfer_out");
    const grouped: Record<string, number> = {};
    expenses.forEach((t) => {
      const key = t.category || "Otros";
      grouped[key] = (grouped[key] || 0) + Math.abs(t.amount);
    });
    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount, color: CATEGORY_COLORS[category] || "#999" }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Mis gastos</Text>

      {expenseData.length === 0 ? (
  <View style={styles.emptyBox}>
    <Ionicons name="pie-chart-outline" size={32} color={theme.textSecondary} />
    <Text style={[styles.empty, { color: theme.textSecondary }]}>Todavía no tenés gastos registrados.</Text>
  </View>
) : (
        <>
          <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total gastado</Text>
          <Text style={[styles.totalAmount, { color: theme.text }]}>
            ${totalExpenses.toLocaleString("es-AR")}
          </Text>

          <View style={[styles.stackedBar, { backgroundColor: theme.border }]}>
            {expenseData.map((item) => (
              <View
                key={item.category}
                style={{ flex: item.amount, backgroundColor: item.color, height: "100%" }}
              />
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Desglose por categoría</Text>
          {expenseData.map((item) => {
            const percentage = ((item.amount / totalExpenses) * 100).toFixed(1);
            return (
              <View key={item.category} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                    <Text style={[styles.categoryName, { color: theme.text }]}>{item.category}</Text>
                  </View>
                  <Text style={[styles.categoryAmount, { color: theme.text }]}>
                    ${item.amount.toLocaleString("es-AR")}
                  </Text>
                </View>
                <View style={[styles.barBackground, { backgroundColor: theme.border }]}>
                  <View style={[styles.barFill, { width: `${percentage}%` as `${number}%`, backgroundColor: item.color }]} />
                </View>
                <Text style={[styles.percentageText, { color: theme.textSecondary }]}>{percentage}%</Text>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  emptyBox: { alignItems: "center", marginTop: 40, gap: 8 },
  empty: { textAlign: "center", marginTop: 40 },
  totalLabel: { fontSize: 14 },
  totalAmount: { fontSize: 32, fontWeight: "bold", marginBottom: 20 },
  stackedBar: { flexDirection: "row", height: 24, borderRadius: 12, overflow: "hidden", marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 16 },
  categoryItem: { marginBottom: 18 },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  categoryLeft: { flexDirection: "row", alignItems: "center" },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  categoryName: { fontSize: 15 },
  categoryAmount: { fontSize: 15, fontWeight: "600" },
  barBackground: { height: 8, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  percentageText: { fontSize: 12, marginTop: 4 },
});