import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const signUp = useAuthStore((state) => state.signUp);
  const router = useRouter();
  const { theme } = useThemeStore();

  async function handleRegister() {
    if (!fullName || !email || !password) {
      Alert.alert("Error", "Completá todos los campos");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error, needsConfirmation } = await signUp(email, password, fullName);
    setLoading(false);

    if (error) {
      Alert.alert("Error al registrarse", error);
    } else if (needsConfirmation) {
      Alert.alert(
        "Revisá tu email 📩",
        "Te enviamos un link de confirmación. Confirmalo y después iniciá sesión.",
        [{ text: "Ir a iniciar sesión", onPress: () => router.replace("/login") }]
      );
    } else {
      router.replace("/home");
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.logoBox, { backgroundColor: theme.primary }]}>
        <Ionicons name="business" size={32} color="#fff" />
      </View>

      <Text style={[styles.title, { color: theme.text }]}>Crear cuenta</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Sumate a Home Bank en menos de un minuto
      </Text>

      <TextInput
        style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
        placeholder="Nombre completo"
        placeholderTextColor={theme.textSecondary}
        value={fullName}
        onChangeText={setFullName}
      />
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
        onPress={handleRegister}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Crear cuenta"
      >
        <Text style={styles.buttonText}>{loading ? "Creando..." : "Crear cuenta"}</Text>
      </TouchableOpacity>

      <Link href="/login" style={styles.link}>
        <Text style={{ color: theme.textSecondary }}>
          ¿Ya tenés cuenta? <Text style={{ color: theme.primary, fontWeight: "600" }}>Ingresá</Text>
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