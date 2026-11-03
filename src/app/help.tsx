import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "../store/themeStore";
import { showAlert } from "../utils/appAlert";

const REPO_URL = "https://github.com/EmanuelDiazOchoa/Home-Bank";

const FAQ = [
  {
    q: "¿El dinero de la app es real?",
    a: "No. Home Bank es una aplicación de demostración: el dinero es simulado y no está conectada a ningún banco. La lógica de las operaciones sí funciona de verdad.",
  },
  {
    q: "¿Con cuánto saldo empiezo?",
    a: "Cada cuenta nueva arranca con $50.000 simulados, una tarjeta de débito y tres servicios de ejemplo para probar los pagos.",
  },
  {
    q: "¿Dónde veo mi alias y mi CBU?",
    a: "En la tarjeta azul de la pantalla de Inicio. Con cualquiera de los dos te pueden transferir.",
  },
  {
    q: "¿Cómo hago una transferencia?",
    a: "Desde Inicio tocá Transferir. Ingresá el alias o CBU completo del destinatario (por ejemplo nombre.apellido.homebank), el monto y confirmá. Antes de enviar te muestra un resumen.",
  },
  {
    q: "¿Cómo agrego un servicio para pagar?",
    a: "En Pagos tocá el botón +. Elegí el nombre, la categoría, el importe y la fecha de vencimiento. Después podés pagarlo desde la misma lista.",
  },
  {
    q: "¿Puedo borrar un servicio?",
    a: "Sí, mientras esté pendiente: tocá la papelera de esa tarjeta. Los servicios ya pagados quedan como historial y no se pueden borrar.",
  },
  {
    q: "¿Qué significa el número de la campana?",
    a: "Cuenta los servicios vencidos o que vencen en los próximos 5 días. Si la tocás, te lleva a Pagos.",
  },
  {
    q: "¿Cómo bloqueo mi tarjeta?",
    a: "En Tarjetas, activá el interruptor Bloquear tarjeta. Podés desbloquearla cuando quieras. Con el ojo podés mostrar u ocultar el número, y con + sumar una tarjeta de débito o de crédito.",
  },
  {
    q: "¿Cómo funcionan el plazo fijo y los préstamos?",
    a: "Son simulaciones. El plazo fijo usa una TNA simulada del 40% y los préstamos una TEA simulada del 60%; las tasas las define el sistema, no el usuario. El préstamo máximo es de $1.000.000.",
  },
  {
    q: "¿Cómo cambio el modo oscuro o el color?",
    a: "En Ajustes, sección Apariencia. Podés elegir modo claro u oscuro y entre 5 colores.",
  },
  {
    q: "¿Quién puede ver mis datos?",
    a: "Solo vos. Cada usuario ve únicamente sus propias cuentas y movimientos, y las operaciones con dinero se validan en el servidor.",
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  async function openRepo() {
    try {
      await Linking.openURL(REPO_URL);
    } catch {
      showAlert("Error", "No se pudo abrir el enlace.");
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ayuda y soporte</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PREGUNTAS FRECUENTES</Text>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        {FAQ.map((item, index) => {
          const open = openIndex === index;
          return (
            <View key={item.q}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
              <TouchableOpacity
                style={styles.question}
                onPress={() => setOpenIndex(open ? null : index)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
              >
                <Text style={[styles.questionText, { color: theme.text }]}>{item.q}</Text>
                <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} />
              </TouchableOpacity>
              {open && <Text style={[styles.answer, { color: theme.textSecondary }]}>{item.a}</Text>}
            </View>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>¿NECESITÁS ALGO MÁS?</Text>
      <View style={[styles.card, styles.contactCard, { backgroundColor: theme.surface }]}>
        <View style={[styles.contactIcon, { backgroundColor: theme.primary + "22" }]}>
          <Ionicons name="information-circle-outline" size={22} color={theme.primary} />
        </View>
        <Text style={[styles.contactText, { color: theme.textSecondary }]}>
          Home Bank es un proyecto de demostración, por eso no hay un equipo de soporte real. Podés ver el código y la
          documentación en GitHub.
        </Text>
        <TouchableOpacity
          style={[styles.repoButton, { backgroundColor: theme.primary }]}
          onPress={openRepo}
          accessibilityRole="button"
          accessibilityLabel="Ver el proyecto en GitHub"
        >
          <Ionicons name="logo-github" size={18} color="#fff" />
          <Text style={styles.repoButtonText}>Ver el proyecto en GitHub</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 56, paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  backButton: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  card: { borderRadius: 14, marginBottom: 24, overflow: "hidden" },
  divider: { height: 1, marginLeft: 16 },
  question: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 16 },
  questionText: { flex: 1, fontSize: 15, fontWeight: "600" },
  answer: { fontSize: 14, lineHeight: 21, paddingHorizontal: 16, paddingBottom: 16 },
  contactCard: { padding: 16, alignItems: "center" },
  contactIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  contactText: { fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 16 },
  repoButton: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 20 },
  repoButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});