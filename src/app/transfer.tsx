import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAccountStore } from "../store/accountStore";
import { useThemeStore } from "../store/themeStore";
import { showAlert } from "../utils/appAlert";
import { formatMoney, parseAmount } from "../utils/format";

export default function TransferScreen() {
  const [alias, setAlias] = useState("");
  const [amountText, setAmountText] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme } = useThemeStore();

  const { accounts, transferMoney, fetchAccounts } = useAccountStore();
  const mainAccount = accounts[0];
  const amount = parseAmount(amountText);
  const inputStyle = [styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }];

  function handleContinue() {
    const destination = alias.trim();
    if (!mainAccount) {
      showAlert("Error", "No se pudo cargar tu cuenta. Volvé a intentar en unos segundos.");
      return;
    }
    if (!destination) {
      showAlert("Error", "Ingresá el alias o CBU del destinatario");
      return;
    }
    if (amount === null || amount <= 0) {
      showAlert("Error", "Ingresá un monto válido");
      return;
    }
    if (amount > mainAccount.balance) {
      showAlert("Fondos insuficientes", `Tu saldo disponible es ${formatMoney(mainAccount.balance)}.`);
      return;
    }

    showAlert("Confirmar transferencia", `Vas a transferir ${formatMoney(amount)} a ${destination}.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Transferir", onPress: () => send(destination, amount) },
    ]);
  }

  async function send(destination: string, value: number) {
    setLoading(true);
    const { error } = await transferMoney(mainAccount.id, destination, value, description);
    setLoading(false);

    if (error) {
      showAlert("Error en la transferencia", error);
      return;
    }
    await fetchAccounts();
    router.back();
    showAlert("¡Listo!", `Transferiste ${formatMoney(value)} a ${destination}`);
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Transferir</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={[styles.balanceCard, { backgroundColor: theme.surface }]}>
        <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Saldo disponible</Text>
        <Text style={[styles.balanceAmount, { color: theme.text }]}>
          {mainAccount ? formatMoney(mainAccount.balance) : "—"}
        </Text>
      </View>

      <Text style={[styles.label, { color: theme.textSecondary }]}>DESTINATARIO</Text>
      <TextInput
        style={inputStyle}
        placeholder="Alias o CBU"
        placeholderTextColor={theme.textSecondary}
        value={alias}
        onChangeText={setAlias}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={[styles.label, { color: theme.textSecondary }]}>MONTO</Text>
      <TextInput
        style={inputStyle}
        placeholder="0,00"
        placeholderTextColor={theme.textSecondary}
        value={amountText}
        onChangeText={(t) => setAmountText(t.replace(/[^0-9.,]/g, ""))}
        keyboardType="decimal-pad"
      />
      {amount !== null && amount > 0 && (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>Vas a transferir {formatMoney(amount)}</Text>
      )}

      <Text style={[styles.label, { color: theme.textSecondary }]}>DESCRIPCIÓN (OPCIONAL)</Text>
      <TextInput
        style={inputStyle}
        placeholder="Ej: Alquiler, cena, regalo"
        placeholderTextColor={theme.textSecondary}
        value={description}
        onChangeText={setDescription}
        maxLength={80}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary, opacity: loading ? 0.6 : 1 }]}
        onPress={handleContinue}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Continuar con la transferencia"
      >
        <Text style={styles.buttonText}>{loading ? "Procesando..." : "Continuar"}</Text>
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
  balanceCard: { borderRadius: 14, padding: 16, marginBottom: 8 },
  balanceLabel: { fontSize: 12, marginBottom: 4 },
  balanceAmount: { fontSize: 24, fontWeight: "bold" },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 16 },
  hint: { fontSize: 12, marginTop: 6 },
  button: { borderRadius: 12, padding: 16, alignItems: "center", marginTop: 32 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
