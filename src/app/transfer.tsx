import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAccountStore } from "../store/accountStore";
import { useThemeStore } from "../store/themeStore";
import { showAlert } from "../utils/appAlert";

export default function TransferScreen() {
  const [alias, setAlias] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme } = useThemeStore();

  const { accounts, transferMoney, fetchAccounts } = useAccountStore();
  const mainAccount = accounts[0];

  async function handleTransfer() {
    if (!alias || !amount) {
      showAlert("Error", "Completá el alias y el monto");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showAlert("Error", "Ingresá un monto válido");
      return;
    }

    setLoading(true);
    const { error } = await transferMoney(mainAccount.id, alias, numericAmount, description);
    setLoading(false);

    if (error) {
      showAlert("Error en la transferencia", error);
    } else {
      showAlert("¡Listo! ✅", "Transferencia realizada con éxito", [
        {
          text: "OK",
          onPress: async () => {
            await fetchAccounts();
            router.back();
          },
        },
      ]);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={{ color: theme.primary, fontSize: 16 }}>← Volver</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: theme.text }]}>Nueva transferencia</Text>

      <Text style={[styles.balanceText, { color: theme.textSecondary }]}>
        Saldo disponible: ${mainAccount?.balance.toLocaleString("es-AR")}
      </Text>

      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
        placeholder="Alias o CBU del destinatario"
        placeholderTextColor={theme.textSecondary}
        value={alias}
        onChangeText={setAlias}
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
        placeholder="Monto"
        placeholderTextColor={theme.textSecondary}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
        placeholder="Descripción (opcional)"
        placeholderTextColor={theme.textSecondary}
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={handleTransfer}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Confirmar transferencia"
      >
        <Text style={styles.buttonText}>{loading ? "Procesando..." : "Transferir"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  backButton: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  balanceText: { fontSize: 14, marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});