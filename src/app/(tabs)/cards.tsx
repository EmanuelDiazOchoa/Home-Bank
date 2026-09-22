import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Switch, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCardStore } from "../../store/cardStore";
import { useAccountStore } from "../../store/accountStore";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";

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

    Alert.alert("Nueva tarjeta", "¿Qué tipo de tarjeta querés agregar?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Débito",
        onPress: async () => {
          const { error } = await addCard(mainAccount.id, session.user.id, "debit");
          if (error) Alert.alert("Error", error);
        },
      },
      {
        text: "Crédito",
        onPress: async () => {
          const { error } = await addCard(mainAccount.id, session.user.id, "credit");
          if (error) Alert.alert("Error", error);
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
        <Text style={[styles.title, { color: theme.text }]}>Mis tarjetas</Text>
        <TouchableOpacity onPress={handleAddCard} accessibilityRole="button" accessibilityLabel="Agregar tarjeta">
          <Ionicons name="add-circle" size={30} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {cards.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>No tenés tarjetas todavía.</Text>
      ) : (
        cards.map((card) => (
          <View
            key={card.id}
            style={[styles.card, { backgroundColor: theme.card }, card.is_blocked && styles.cardBlocked]}
          >
            <View style={styles.cardTopRow}>
              <Text style={[styles.cardType, { color: theme.textSecondary }]}>
                {card.card_type === "debit" ? "TARJETA DE DÉBITO" : "TARJETA DE CRÉDITO"}
              </Text>
              <TouchableOpacity onPress={() => toggleReveal(card.id)}>
                <Ionicons
                  name={revealed[card.id] ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <Text style={[styles.cardNumber, { color: theme.text }]}>
              {maskCardNumber(card.card_number, !!revealed[card.id])}
            </Text>

            <View style={styles.cardFooter}>
              <View>
                <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>TITULAR</Text>
                <Text style={[styles.cardValue, { color: theme.text }]}>{card.card_holder}</Text>
              </View>
              <View>
                <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>VENCE</Text>
                <Text style={[styles.cardValue, { color: theme.text }]}>{card.expiry_date}</Text>
              </View>
              {card.card_type === "credit" && (
                <View>
                  <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>LÍMITE</Text>
                  <Text style={[styles.cardValue, { color: theme.text }]}>
                    ${card.credit_limit.toLocaleString("es-AR")}
                  </Text>
                </View>
              )}
            </View>

            {card.is_blocked && (
              <View style={[styles.blockedBadge, { backgroundColor: theme.danger + "33" }]}>
                <Text style={[styles.blockedText, { color: theme.danger }]}>🔒 BLOQUEADA</Text>
              </View>
            )}

            <View style={[styles.toggleRow, { borderTopColor: theme.border }]}>
              <Text style={[styles.toggleLabel, { color: theme.text }]}>
                {card.is_blocked ? "Desbloquear tarjeta" : "Bloquear tarjeta"}
              </Text>
              <Switch
                value={card.is_blocked}
                onValueChange={(value) => { toggleBlockCard(card.id, value); }}
                trackColor={{ false: theme.border, true: theme.danger }}
              />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold" },
  empty: { textAlign: "center", marginTop: 40 },
  card: { borderRadius: 16, padding: 20, marginBottom: 20 },
  cardBlocked: { opacity: 0.6 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  cardType: { fontSize: 12, letterSpacing: 1 },
  cardNumber: { fontSize: 20, letterSpacing: 1, marginBottom: 24 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { fontSize: 10, marginBottom: 4 },
  cardValue: { fontSize: 14, fontWeight: "600" },
  blockedBadge: { position: "absolute", top: 20, right: 50, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  blockedText: { fontSize: 11, fontWeight: "bold" },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  toggleLabel: { fontSize: 13 },
});