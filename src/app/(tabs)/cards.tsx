import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Switch, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCardStore } from "../../store/cardStore";
import { useAccountStore } from "../../store/accountStore";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import { showAlert } from "../../utils/appAlert";

function maskCardNumber(number: string, revealed: boolean) {
  if (revealed) return number.replace(/(\d{4})(?=\d)/g, "$1 ");
  const last4 = number.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

export default function CardsScreen() {
  const { cards, isLoading, fetchCards, toggleBlockCard, addCard } = useCardStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { session } = useAuthStore();
  const { theme } = useThemeStore();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCards();
    fetchAccounts();
  }, []);

  function toggleReveal(cardId: string) {
    setRevealed((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  }

  function handleAddCard() {
    const mainAccount = accounts[0];
    if (!mainAccount || !session) return;

     showAlert("Nueva tarjeta", "¿Qué tipo de tarjeta querés agregar?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Débito",
        onPress: async () => {
          const { error } = await addCard(mainAccount.id, session.user.id, "debit");
          if (error) showAlert("Error", error);
        },
      },
      {
        text: "Crédito",
        onPress: async () => {
          const { error } = await addCard(mainAccount.id, session.user.id, "credit");
          if (error) showAlert("Error", error);
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Mis tarjetas</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {cards.length} {cards.length === 1 ? "tarjeta activa" : "tarjetas activas"}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={handleAddCard}
          accessibilityRole="button"
          accessibilityLabel="Agregar tarjeta"
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {cards.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="card-outline" size={32} color={theme.textSecondary} />
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No tenés tarjetas todavía.</Text>
        </View>
      ) : (
        cards.map((card) => (
          <LinearGradient
            key={card.id}
            colors={
              card.card_type === "credit"
                ? ["#2C2C3E", "#1A1A2E"]
                : [theme.primary, theme.primaryLight]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, card.is_blocked && styles.cardBlocked]}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.cardType}>
                {card.card_type === "debit" ? "TARJETA DE DÉBITO" : "TARJETA DE CRÉDITO"}
              </Text>
              <TouchableOpacity onPress={() => toggleReveal(card.id)}>
                <Ionicons
                  name={revealed[card.id] ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.cardNumber}>
              {maskCardNumber(card.card_number, !!revealed[card.id])}
            </Text>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.cardLabel}>TITULAR</Text>
                <Text style={styles.cardValue}>{card.card_holder}</Text>
              </View>
              <View>
                <Text style={styles.cardLabel}>VENCE</Text>
                <Text style={styles.cardValue}>{card.expiry_date}</Text>
              </View>
              {card.card_type === "credit" && (
                <View>
                  <Text style={styles.cardLabel}>LÍMITE</Text>
                  <Text style={styles.cardValue}>${card.credit_limit.toLocaleString("es-AR")}</Text>
                </View>
              )}
            </View>

            {card.is_blocked && (
              <View style={styles.blockedBadge}>
                <Ionicons name="lock-closed" size={12} color="#fff" />
                <Text style={styles.blockedText}>BLOQUEADA</Text>
              </View>
            )}

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>
                {card.is_blocked ? "Desbloquear tarjeta" : "Bloquear tarjeta"}
              </Text>
              <Switch
                value={card.is_blocked}
                onValueChange={(value) => { toggleBlockCard(card.id, value); }}
                trackColor={{ false: "rgba(255,255,255,0.3)", true: theme.danger }}
              />
            </View>
          </LinearGradient>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { fontSize: 13, marginTop: 2 },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyBox: { alignItems: "center", marginTop: 40, gap: 8 },
  empty: { textAlign: "center" },
  card: { borderRadius: 18, padding: 20, marginBottom: 20 },
  cardBlocked: { opacity: 0.55 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  cardType: { color: "#fff", opacity: 0.85, fontSize: 12, letterSpacing: 1 },
  cardNumber: { color: "#fff", fontSize: 20, letterSpacing: 1, marginBottom: 24, fontWeight: "600" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { color: "#fff", opacity: 0.7, fontSize: 10, marginBottom: 4 },
  cardValue: { color: "#fff", fontSize: 14, fontWeight: "600" },
  blockedBadge: {
    position: "absolute",
    top: 20,
    right: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  blockedText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  toggleLabel: { color: "#fff", fontSize: 13 },
});