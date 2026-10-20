import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBillStore } from "../store/billStore";
import { useThemeStore } from "../store/themeStore";
import { showAlert } from "../utils/appAlert";
import { formatMoney, parseAmount } from "../utils/format";
import {
  addDaysISO,
  endOfMonthISO,
  formatDateAR,
  getDaysUntil,
  maskARDate,
  parseARDate,
} from "../utils/dates";
import { BILL_CATEGORIES, getCategoryMeta } from "../constants/billCategories";


const QUICK_DATES = [
  { label: "Hoy", get: () => addDaysISO(0) },
  { label: "En 7 días", get: () => addDaysISO(7) },
  { label: "En 15 días", get: () => addDaysISO(15) },
  { label: "Fin de mes", get: () => endOfMonthISO() },
];

export default function NewBillScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const createBill = useBillStore((state) => state.createBill);

  const [company, setCompany] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [amountText, setAmountText] = useState("");
  const [dateText, setDateText] = useState(formatDateAR(addDaysISO(10)));
  const [loading, setLoading] = useState(false);

  const amount = parseAmount(amountText);
  const inputStyle = [styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }];

  async function handleSubmit() {
    if (company.trim().length < 2) {
      showAlert("Error", "Ingresá el nombre del servicio (mínimo 2 letras)");
      return;
    }
    if (!category) {
      showAlert("Error", "Elegí una categoría");
      return;
    }
    if (amount === null || amount <= 0) {
      showAlert("Error", "Ingresá un importe válido");
      return;
    }
    if (amount > 10000000) {
      showAlert("Error", "El importe máximo por servicio es $10.000.000");
      return;
    }
    const dueDate = parseARDate(dateText);
    if (!dueDate) {
      showAlert("Error", "Ingresá una fecha válida con el formato DD/MM/AAAA");
      return;
    }
    const days = getDaysUntil(dueDate);
    if (days < -90 || days > 365) {
      showAlert("Error", "El vencimiento debe estar entre los últimos 90 días y el próximo año");
      return;
    }

    setLoading(true);
    const { error } = await createBill(company.trim(), category, amount, dueDate);
    setLoading(false);

    if (error) {
      showAlert("Error", error);
      return;
    }
    router.back();
    showAlert("¡Listo!", `${company.trim()} se agregó a tus servicios`);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Nuevo servicio</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={[styles.label, { color: theme.textSecondary }]}>NOMBRE DEL SERVICIO</Text>
      <TextInput
        style={inputStyle}
        placeholder="Ej: Edenor, Personal, Alquiler"
        placeholderTextColor={theme.textSecondary}
        value={company}
        onChangeText={setCompany}
        maxLength={40}
      />

      <Text style={[styles.label, { color: theme.textSecondary }]}>CATEGORÍA</Text>
      <View style={styles.categoryGrid}>
        {BILL_CATEGORIES.map((c) => {
          const meta = getCategoryMeta(c);
          const selected = category === c;
          return (
            <TouchableOpacity
              key={c}
              style={[
                styles.categoryChip,
                { backgroundColor: theme.surface, borderColor: selected ? meta.color : "transparent" },
              ]}
              onPress={() => setCategory(c)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Categoría ${c}`}
            >
              <View style={[styles.categoryIcon, { backgroundColor: meta.color + "22" }]}>
                <Ionicons name={meta.icon} size={20} color={meta.color} />
              </View>
              <Text style={[styles.categoryLabel, { color: selected ? theme.text : theme.textSecondary }]}>{c}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.label, { color: theme.textSecondary }]}>IMPORTE</Text>
      <TextInput
        style={inputStyle}
        placeholder="0,00"
        placeholderTextColor={theme.textSecondary}
        value={amountText}
        onChangeText={(t) => setAmountText(t.replace(/[^0-9.,]/g, ""))}
        keyboardType="decimal-pad"
      />
      {amount !== null && amount > 0 && (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>Se cargará {formatMoney(amount)}</Text>
      )}

      <Text style={[styles.label, { color: theme.textSecondary }]}>VENCIMIENTO</Text>
      <TextInput
        style={inputStyle}
        placeholder="DD/MM/AAAA"
        placeholderTextColor={theme.textSecondary}
        value={dateText}
        onChangeText={(t) => setDateText(maskARDate(t))}
        keyboardType="number-pad"
        maxLength={10}
      />
      <View style={styles.quickRow}>
        {QUICK_DATES.map((q) => (
          <TouchableOpacity
            key={q.label}
            style={[styles.quickChip, { backgroundColor: theme.surface }]}
            onPress={() => setDateText(formatDateAR(q.get()))}
            accessibilityRole="button"
          >
            <Text style={[styles.quickLabel, { color: theme.primary }]}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.submit, { backgroundColor: theme.primary, opacity: loading ? 0.6 : 1 }]}
        onPress={handleSubmit}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Agregar servicio"
      >
        <Text style={styles.submitText}>{loading ? "Agregando..." : "Agregar servicio"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 56, paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  backButton: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 16 },
  hint: { fontSize: 12, marginTop: 6 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryChip: {
    width: "31%",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: "center",
    gap: 6,
  },
  categoryIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  categoryLabel: { fontSize: 12, fontWeight: "600" },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  quickChip: { borderRadius: 16, paddingVertical: 7, paddingHorizontal: 14 },
  quickLabel: { fontSize: 12, fontWeight: "600" },
  submit: { borderRadius: 12, padding: 16, alignItems: "center", marginTop: 32 },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
