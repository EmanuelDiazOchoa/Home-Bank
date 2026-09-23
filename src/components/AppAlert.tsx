import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from "react-native";
import { useAlertStore } from "../store/alertStore";
import { useThemeStore } from "../store/themeStore";

export default function AppAlert() {
  const { visible, title, message, buttons, hide } = useAlertStore();
  const { theme } = useThemeStore();

  function handlePress(onPress?: () => void) {
    hide();
    if (onPress) setTimeout(onPress, 150);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={hide}>
      <Pressable style={styles.overlay} onPress={hide}>
        <Pressable style={[styles.card, { backgroundColor: theme.card }]} onPress={() => {}}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {!!message && <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>}

          <View style={styles.buttonRow}>
            {buttons.map((btn, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  index < buttons.length - 1 && [styles.buttonBorder, { borderRightColor: theme.border }],
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
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  card: { width: "100%", maxWidth: 320, borderRadius: 16, paddingTop: 20, overflow: "hidden" },
  title: { fontSize: 17, fontWeight: "bold", textAlign: "center", paddingHorizontal: 20 },
  message: { fontSize: 14, textAlign: "center", marginTop: 8, paddingHorizontal: 20, lineHeight: 20 },
  buttonRow: { flexDirection: "row", marginTop: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#00000022" },
  button: { flex: 1, paddingVertical: 14, alignItems: "center" },
  buttonBorder: { borderRightWidth: StyleSheet.hairlineWidth },
  buttonText: { fontSize: 16, fontWeight: "600" },
});