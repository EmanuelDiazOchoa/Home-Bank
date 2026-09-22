import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((state) => state.signIn);
  const { theme } = useThemeStore();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Error", "Completá todos los campos");
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) Alert.alert("Error al iniciar sesión", error);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.logoBox, { backgroundColor: theme.primary }]}>
        <Ionicons name="business" size={32} color="#fff" />
      </View>

      <Text style={[styles.title, { color: theme.text }]}>Home Bank</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Iniciá sesión para continuar</Text>

      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
        placeholder="Email"
        placeholderTextColor={theme.textSecondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
        placeholder="Contraseña"
        placeholderTextColor={theme.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.primary }]}
        onPress={handleLogin}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Ingresar"
      >
        <Text style={styles.buttonText}>{loading ? "Ingresando..." : "Ingresar"}</Text>
      </TouchableOpacity>

      <Link href="/register" style={styles.link}>
        <Text style={{ color: theme.textSecondary }}>
          ¿No tenés cuenta? <Text style={{ color: theme.primary, fontWeight: "600" }}>Registrate</Text>
        </Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: "center", marginBottom: 36 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { marginTop: 24, alignSelf: "center" },
});