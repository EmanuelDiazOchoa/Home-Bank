import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuthStore } from "../../store/authStore";

export default function HomeScreen() {
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido! 🏦</Text>
      <Text style={styles.subtitle}>Login funcionando correctamente</Text>

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 32 },
  button: {
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    padding: 16,
    paddingHorizontal: 32,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});