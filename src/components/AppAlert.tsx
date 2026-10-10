import { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAlertStore } from "../store/alertStore";
import { useThemeStore } from "../store/themeStore";

type Kind = "success" | "error" | "confirm" | "info";

function getKind(title: string, buttonCount: number): Kind {
  const t = title.toLowerCase();
  if (t.includes("error")) return "error";
  if (t.includes("listo")) return "success";
  if (buttonCount > 1) return "confirm";
  return "info";
}

const ICONS: Record<Kind, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark",
  error: "close",
  confirm: "help",
  info: "information",
};

export default function AppAlert() {
  const { visible, title, message, buttons, hide } = useAlertStore();
  const { theme } = useThemeStore();
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.9);
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }).start();
    }
  }, [visible]);

  const kind = getKind(title, buttons.length);
  const color = kind === "success" ? theme.success : kind === "error" ? theme.danger : theme.primary;
  const cleanTitle = title.replace(/[✅❌📩]/g, "").trim();

  function handlePress(onPress?: () => void) {
    hide();
    if (onPress) setTimeout(onPress, 150);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={hide}>
      <Pressable style={styles.overlay} onPress={hide}>
        <Animated.View style={[styles.card, { backgroundColor: theme.card, transform: [{ scale }] }]}>
          <Pressable onPress={() => {}}>
            <View style={styles.body}>
              <View style={[styles.iconCircle, { backgroundColor: color + "22" }]}>
                <Ionicons name={ICONS[kind]} size={30} color={color} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>{cleanTitle}</Text>
              {!!message && <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>}
            </View>

            <View style={[styles.buttonRow, { borderTopColor: theme.border }]}>
              {buttons.map((btn, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    index < buttons.length - 1 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: theme.border },
                  ]}
                  onPress={() => handlePress(btn.onPress)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: btn.style === "destructive" ? theme.danger : theme.primary },
                      btn.style === "cancel" && { color: theme.textSecondary, fontWeight: "400" },
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 32 },
  card: { width: "100%", maxWidth: 330, borderRadius: 20, overflow: "hidden" },
  body: { alignItems: "center", paddingTop: 24, paddingHorizontal: 20, paddingBottom: 22 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 18, fontWeight: "bold", textAlign: "center" },
  message: { fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },
  buttonRow: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth },
  button: { flex: 1, paddingVertical: 15, alignItems: "center" },
  buttonText: { fontSize: 16, fontWeight: "600" },
});