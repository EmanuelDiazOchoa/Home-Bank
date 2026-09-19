import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useThemeStore } from "../store/themeStore";
import { COLOR_SCHEME_LABELS, COLOR_SCHEME_PREVIEW, ColorScheme } from "../theme/colors";

export default function SettingsScreen() {
  const { theme, mode, scheme, toggleMode, setScheme } = useThemeStore();
  const router = useRouter();

  const schemes = Object.keys(COLOR_SCHEME_LABELS) as ColorScheme[];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: theme.primary, fontSize: 16 }}>← Volver</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>Apariencia</Text>

      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: theme.text }]}>Modo oscuro</Text>
          <TouchableOpacity
            style={[styles.modeToggle, { backgroundColor: mode === "dark" ? theme.primary : theme.border }]}
            onPress={toggleMode}
          >
            <View
              style={[
                styles.modeToggleCircle,
                { transform: [{ translateX: mode === "dark" ? 20 : 0 }] },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Color principal</Text>
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        {schemes.map((s) => (
          <TouchableOpacity
            key={s}
            style={styles.colorRow}
            onPress={() => setScheme(s)}
          >
            <View style={styles.colorLeft}>
              <View style={[styles.colorSwatch, { backgroundColor: COLOR_SCHEME_PREVIEW[s] }]} />
              <Text style={[styles.rowLabel, { color: theme.text }]}>{COLOR_SCHEME_LABELS[s]}</Text>
            </View>
            {scheme === s && <Text style={{ color: theme.primary, fontSize: 18 }}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8, marginTop: 20, opacity: 0.7 },
  section: { borderRadius: 12, padding: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  rowLabel: { fontSize: 16 },
  modeToggle: { width: 48, height: 28, borderRadius: 14, padding: 2, justifyContent: "center" },
  modeToggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff" },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  colorLeft: { flexDirection: "row", alignItems: "center" },
  colorSwatch: { width: 24, height: 24, borderRadius: 12, marginRight: 14 },
});