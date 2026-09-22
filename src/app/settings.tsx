import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "../store/themeStore";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import { COLOR_SCHEME_LABELS, COLOR_SCHEME_PREVIEW, ColorScheme } from "../theme/colors";

export default function SettingsScreen() {
  const { theme, mode, scheme, toggleMode, setScheme } = useThemeStore();
  const { signOut } = useAuthStore();
  const { fullName } = useProfileStore();
  const router = useRouter();

  const schemes = Object.keys(COLOR_SCHEME_LABELS) as ColorScheme[];

  function confirmSignOut() {
    Alert.alert("Cerrar sesión", "¿Seguro que querés salir de tu cuenta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ajustes</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Perfil */}
      <View style={[styles.profileCard, { backgroundColor: theme.primary }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{fullName?.charAt(0)?.toUpperCase() || "U"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{fullName || "Usuario"}</Text>
          <Text style={styles.profileSubtitle}>Ver perfil y datos personales</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </View>

      {/* Sección: Seguridad */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SEGURIDAD</Text>
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <SettingsRow
          icon="lock-closed-outline"
          label="Cambiar contraseña"
          theme={theme}
          onPress={() => Alert.alert("Próximamente", "Esta función estará disponible pronto.")}
        />
        <Divider theme={theme} />
        <SettingsRow
          icon="finger-print-outline"
          label="Biometría"
          theme={theme}
          rightLabel="Próximamente"
          onPress={() => Alert.alert("Próximamente", "Autenticación biométrica en desarrollo.")}
        />
        <Divider theme={theme} />
        <SettingsRow
          icon="phone-portrait-outline"
          label="Dispositivos vinculados"
          theme={theme}
          onPress={() => Alert.alert("Próximamente", "Esta función estará disponible pronto.")}
          isLast
        />
      </View>

      {/* Sección: Apariencia */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>APARIENCIA</Text>
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <View style={styles.switchRow}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: theme.primary + "22" }]}>
              <Ionicons name="moon-outline" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Modo oscuro</Text>
          </View>
          <TouchableOpacity
            style={[styles.modeToggle, { backgroundColor: mode === "dark" ? theme.primary : theme.border }]}
            onPress={toggleMode}
            accessibilityRole="switch"
            accessibilityLabel="Modo oscuro"
          >
            <View
              style={[styles.modeToggleCircle, { transform: [{ translateX: mode === "dark" ? 20 : 0 }] }]}
            />
          </TouchableOpacity>
        </View>

        <Divider theme={theme} />

        <View style={styles.colorSection}>
          <Text style={[styles.colorSectionLabel, { color: theme.textSecondary }]}>Color principal</Text>
          <View style={styles.colorGrid}>
            {schemes.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.colorItem}
                onPress={() => setScheme(s)}
                accessibilityRole="button"
                accessibilityLabel={`Color ${COLOR_SCHEME_LABELS[s]}`}
              >
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: COLOR_SCHEME_PREVIEW[s] },
                    scheme === s && [styles.colorSwatchSelected, { borderColor: theme.text }],
                  ]}
                >
                  {scheme === s && <Ionicons name="checkmark" size={18} color="#fff" />}
                </View>
                <Text style={[styles.colorItemLabel, { color: theme.textSecondary }]}>
                  {COLOR_SCHEME_LABELS[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Sección: Soporte */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SOPORTE</Text>
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <SettingsRow
          icon="help-circle-outline"
          label="Centro de ayuda"
          theme={theme}
          onPress={() => Alert.alert("Próximamente", "Esta función estará disponible pronto.")}
        />
        <Divider theme={theme} />
        <SettingsRow
          icon="chatbubble-ellipses-outline"
          label="Contactar soporte"
          theme={theme}
          onPress={() => Alert.alert("Próximamente", "Esta función estará disponible pronto.")}
        />
        <Divider theme={theme} />
        <SettingsRow
          icon="information-circle-outline"
          label="Acerca de Home Bank"
          theme={theme}
          rightLabel="v1.0.0"
          onPress={() => {}}
          isLast
        />
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity
        style={[styles.signOutButton, { backgroundColor: theme.danger + "1A" }]}
        onPress={confirmSignOut}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
      >
        <Ionicons name="log-out-outline" size={18} color={theme.danger} />
        <Text style={[styles.signOutText, { color: theme.danger }]}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SettingsRow({
  icon,
  label,
  theme,
  onPress,
  rightLabel,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  theme: any;
  onPress: () => void;
  rightLabel?: string;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: theme.primary + "22" }]}>
          <Ionicons name={icon} size={18} color={theme.primary} />
        </View>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {rightLabel && <Text style={[styles.rowRightLabel, { color: theme.textSecondary }]}>{rightLabel}</Text>}
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

function Divider({ theme }: { theme: any }) {
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    marginBottom: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  profileName: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  profileSubtitle: { color: "#fff", opacity: 0.85, fontSize: 12, marginTop: 2 },

  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  section: { borderRadius: 14, marginBottom: 24, overflow: "hidden" },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowRightLabel: { fontSize: 13 },
  rowLabel: { fontSize: 15 },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: { height: 1, marginLeft: 56 },

  modeToggle: { width: 48, height: 28, borderRadius: 14, padding: 2, justifyContent: "center" },
  modeToggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff" },

  colorSection: { paddingVertical: 14, paddingHorizontal: 14 },
  colorSectionLabel: { fontSize: 12, marginBottom: 12 },
  colorGrid: { flexDirection: "row", justifyContent: "space-between" },
  colorItem: { alignItems: "center", gap: 6 },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  colorSwatchSelected: { borderWidth: 2 },
  colorItemLabel: { fontSize: 10 },

  signOutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  signOutText: { fontWeight: "bold", fontSize: 15 },
});