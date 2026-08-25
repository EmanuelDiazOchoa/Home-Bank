import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAccountStore } from "../store/accountStore";

export default function TransferScreen() {
  const [alias, setAlias] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { accounts, transferMoney, fetchAccounts } = useAccountStore();
  const mainAccount = accounts[0];

  async function handleTransfer() {
    if (!alias || !amount) {
      Alert.alert("Error", "Completá el alias y el monto");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Error", "Ingresá un monto válido");
      return;
    }

    setLoading(true);
    const { error } = await transferMoney(mainAccount.id, alias, numericAmount, description);
    setLoading(false);

    if (error) {
      Alert.alert("Error en la transferencia", error);
    } else {
      Alert.alert("¡Listo! ✅", "Transferencia realizada con éxito", [
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
    <View style={styles.container}>
      <Text style={styles.title}>Nueva transferencia</Text>

      <Text style={styles.balanceText}>
        Saldo disponible: ${mainAccount?.balance.toLocaleString("es-AR")}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Alias o CBU del destinatario"
        value={alias}
        onChangeText={setAlias}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Monto"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Descripción (opcional)"
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={styles.button} onPress={handleTransfer} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Procesando..." : "Transferir"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  balanceText: { fontSize: 14, color: "#666", marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#0066FF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});