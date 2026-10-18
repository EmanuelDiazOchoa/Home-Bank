import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useAccountStore } from "../../store/accountStore";
import { useThemeStore } from "../../store/themeStore";
import { formatMoney } from "../../utils/format";
import { getCategoryMeta } from "../../constants/billCategories";
import { computeAnalytics, Period } from "../../utils/analytics";

const PERIODS: { value: Period; label: string }[] = [
  { value: 1, label: "Este mes" },
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
];

const DONUT_SIZE = 190;
const STROKE = 24;
const RADIUS = (DONUT_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CHART_HEIGHT = 120;

function percentLabel(share: number) {
  if (share > 0 && share < 0.01) return "<1%";
  return `${Math.round(share * 100)}%`;
}

export default function AnalyticsScreen() {
  const { accounts, analyticsTransactions, isLoading, fetchAccounts, fetchAnalyticsTransactions } = useAccountStore();
  const { theme } = useThemeStore();
  const [period, setPeriod] = useState<Period>(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAccounts().finally(() => {
      if (useAccountStore.getState().accounts.length === 0) setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (accounts.length === 0) return;
    fetchAnalyticsTransactions(accounts[0].id, 6).finally(() => setLoading(false));
  }, [accounts]);

  async function onRefresh() {
    if (accounts.length === 0) return;
    setRefreshing(true);
    await fetchAnalyticsTransactions(accounts[0].id, 6);
    setRefreshing(false);
  }

  const data = useMemo(() => computeAnalytics(analyticsTransactions, period), [analyticsTransactions, period]);

  if ((isLoading || loading) && analyticsTransactions.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const net = data.income - data.expense;
  const maxBar = Math.max(1, ...data.months.flatMap((m) => [m.income, m.expense]));
  const topCategory = data.categories[0];

  let accumulated = 0;
  const segments = data.categories.map((c) => {
    const share = data.expense > 0 ? c.amount / data.expense : 0;
    const gap = data.categories.length > 1 ? 2 : 0;
    const seg = { ...c, length: Math.max(share * CIRCUMFERENCE - gap, 0), offset: -accumulated };
    accumulated += share * CIRCUMFERENCE;
    return seg;
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
    >
      <Text style={[styles.title, { color: theme.text }]}>Análisis</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Tus ingresos y gastos</Text>

      <View style={[styles.segmented, { backgroundColor: theme.surface }]}>
        {PERIODS.map((p) => {
          const selected = period === p.value;
          return (
            <TouchableOpacity
              key={p.value}
              style={[styles.segment, selected && { backgroundColor: theme.primary }]}
              onPress={() => setPeriod(p.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.segmentText, { color: selected ? "#fff" : theme.textSecondary }]}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.summaryIcon, { backgroundColor: theme.success + "22" }]}>
            <Ionicons name="arrow-down" size={16} color={theme.success} />
          </View>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Ingresos</Text>
          <Text style={[styles.summaryAmount, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(data.income, 0)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.summaryIcon, { backgroundColor: theme.danger + "22" }]}>
            <Ionicons name="arrow-up" size={16} color={theme.danger} />
          </View>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Gastos</Text>
          <Text style={[styles.summaryAmount, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(data.expense, 0)}
          </Text>
        </View>
      </View>

      <View style={[styles.netRow, { backgroundColor: theme.surface }]}>
        <Text style={[styles.netLabel, { color: theme.textSecondary }]}>Balance del período</Text>
        <Text style={[styles.netAmount, { color: net >= 0 ? theme.success : theme.danger }]}>
          {net >= 0 ? "+" : "-"}
          {formatMoney(Math.abs(net), 0)}
        </Text>
      </View>

      {!data.hasData ? (
        <View style={styles.emptyBox}>
          <Ionicons name="pie-chart-outline" size={36} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Sin movimientos en este período</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Cuando pagues servicios o transfieras, vas a ver acá el detalle.
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Gastos por categoría</Text>

            {data.expense === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textSecondary, marginVertical: 24 }]}>
                No registraste gastos en este período.
              </Text>
            ) : (
              <>
                <View
                  style={styles.donutWrap}
                  accessible
                  accessibilityLabel={`Gastos del período: ${formatMoney(data.expense, 0)}. Mayor categoría: ${topCategory.category}`}
                >
                  <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
                    <G rotation={-90} origin={`${DONUT_SIZE / 2}, ${DONUT_SIZE / 2}`}>
                      <Circle
                        cx={DONUT_SIZE / 2}
                        cy={DONUT_SIZE / 2}
                        r={RADIUS}
                        stroke={theme.border}
                        strokeWidth={STROKE}
                        fill="none"
                      />
                      {segments.map((seg) => (
                        <Circle
                          key={seg.category}
                          cx={DONUT_SIZE / 2}
                          cy={DONUT_SIZE / 2}
                          r={RADIUS}
                          stroke={seg.color}
                          strokeWidth={STROKE}
                          fill="none"
                          strokeDasharray={`${seg.length} ${CIRCUMFERENCE}`}
                          strokeDashoffset={seg.offset}
                        />
                      ))}
                    </G>
                  </Svg>
                  <View style={styles.donutCenter} pointerEvents="none">
                    <Text style={[styles.donutLabel, { color: theme.textSecondary }]}>Total gastado</Text>
                    <Text style={[styles.donutAmount, { color: theme.text }]}>{formatMoney(data.expense, 0)}</Text>
                  </View>
                </View>

                {data.categories.map((c) => {
                  const meta = getCategoryMeta(c.category);
                  const share = c.amount / data.expense;
                  return (
                    <View key={c.category} style={styles.legendRow}>
                      <View style={[styles.legendIcon, { backgroundColor: c.color + "22" }]}>
                        <Ionicons name={c.category === "Otras" ? "ellipsis-horizontal" : meta.icon} size={16} color={c.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.legendName, { color: theme.text }]}>{c.category}</Text>
                        <Text style={[styles.legendPercent, { color: theme.textSecondary }]}>{percentLabel(share)}</Text>
                      </View>
                      <Text style={[styles.legendAmount, { color: theme.text }]}>{formatMoney(c.amount, 0)}</Text>
                    </View>
                  );
                })}
              </>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Últimos 6 meses</Text>
            <View style={styles.barsRow}>
              {data.months.map((m) => (
                <View key={m.label + m.current} style={styles.barColumn}>
                  <View style={styles.barPair}>
                    <View
                      style={[
                        styles.bar,
                        {
                          backgroundColor: theme.success,
                          height: m.income > 0 ? Math.max((m.income / maxBar) * CHART_HEIGHT, 4) : 0,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        {
                          backgroundColor: theme.danger,
                          height: m.expense > 0 ? Math.max((m.expense / maxBar) * CHART_HEIGHT, 4) : 0,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barLabel,
                      { color: m.current ? theme.text : theme.textSecondary, fontWeight: m.current ? "700" : "400" },
                    ]}
                  >
                    {m.label}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.legendInline}>
              <View style={styles.legendInlineItem}>
                <View style={[styles.dot, { backgroundColor: theme.success }]} />
                <Text style={[styles.legendInlineText, { color: theme.textSecondary }]}>Ingresos</Text>
              </View>
              <View style={styles.legendInlineItem}>
                <View style={[styles.dot, { backgroundColor: theme.danger }]} />
                <Text style={[styles.legendInlineText, { color: theme.textSecondary }]}>Gastos</Text>
              </View>
            </View>
          </View>

          {data.expense > 0 && topCategory && (
            <View style={[styles.insight, { backgroundColor: theme.primary + "14" }]}>
              <Ionicons name="bulb-outline" size={20} color={theme.primary} />
              <Text style={[styles.insightText, { color: theme.text }]}>
                Tu mayor gasto es <Text style={{ fontWeight: "700" }}>{topCategory.category}</Text> (
                {percentLabel(topCategory.amount / data.expense)} del total).
              </Text>
            </View>
          )}

          <Text style={[styles.footnote, { color: theme.textSecondary }]}>
            No incluye plazos fijos ni préstamos.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { fontSize: 13, marginTop: 2, marginBottom: 20 },
  segmented: { flexDirection: "row", borderRadius: 12, padding: 4, marginBottom: 16 },
  segment: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 9 },
  segmentText: { fontSize: 13, fontWeight: "600" },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14 },
  summaryIcon: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  summaryLabel: { fontSize: 12, marginBottom: 2 },
  summaryAmount: { fontSize: 20, fontWeight: "bold" },
  netRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  netLabel: { fontSize: 13 },
  netAmount: { fontSize: 16, fontWeight: "bold" },
  emptyBox: { alignItems: "center", marginTop: 32, gap: 8, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
  emptyText: { fontSize: 13, textAlign: "center" },
  card: { borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 16 },
  donutWrap: { alignSelf: "center", width: DONUT_SIZE, height: DONUT_SIZE, marginBottom: 20 },
  donutCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  donutLabel: { fontSize: 12 },
  donutAmount: { fontSize: 22, fontWeight: "bold", marginTop: 2 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  legendIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  legendName: { fontSize: 14, fontWeight: "600" },
  legendPercent: { fontSize: 12, marginTop: 1 },
  legendAmount: { fontSize: 14, fontWeight: "600" },
  barsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  barColumn: { flex: 1, alignItems: "center" },
  barPair: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: CHART_HEIGHT },
  bar: { width: 11, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barLabel: { fontSize: 11, marginTop: 8 },
  legendInline: { flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 16 },
  legendInlineItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendInlineText: { fontSize: 12 },
  insight: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 14, marginBottom: 12 },
  insightText: { flex: 1, fontSize: 13, lineHeight: 19 },
  footnote: { fontSize: 11, textAlign: "center", marginTop: 4 },
});
