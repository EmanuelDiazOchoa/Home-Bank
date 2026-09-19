import { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Switch } from "react-native";
import { useCardStore } from "../../store/cardStore";
import { useThemeStore } from "../../store/themeStore";

function maskCardNumber(number: string) {
  const clean = number.replace(/\D/g, "");
  const last4 = clean.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

export default function CardsScreen() {
  const { cards, isLoading, fetchCards, toggleBlockCard } = useCardStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    fetchCards();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Mis tarjetas</Text>

      {cards.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>No tenés tarjetas todavía.</Text>
      ) : (
        cards.map((card) => (
          <View
            key={card.id}
            style={[styles.card, { backgroundColor: theme.card }, card.is_blocked && styles.cardBlocked]}
            accessible
            accessibilityLabel={`Tarjeta ${card.card_type === "debit" ? "de débito" : "de crédito"}, terminada en ${card.card_number.slice(-4)}, ${card.is_blocked ? "bloqueada" : "activa"}`}
          >
            <Text style={[styles.cardType, { color: theme.textSecondary }]}>
              {card.card_type === "debit" ? "TARJETA DE DÉBITO" : "TARJETA DE CRÉDITO"}
            </Text>
            <Text style={[styles.cardNumber, { color: theme.text }]}>{maskCardNumber(card.card_number)}</Text>

            <View style={styles.cardFooter}>
              <View>
                <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>TITULAR</Text>
                <Text style={[styles.cardValue, { color: theme.text }]}>{card.card_holder}</Text>
              </View>
              <View>
                <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>VENCE</Text>
                <Text style={[styles.cardValue, { color: theme.text }]}>{card.expiry_date}</Text>
              </View>
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
                onValueChange={(value) => {
                  toggleBlockCard(card.id, value);
                }}
                trackColor={{ false: theme.border, true: theme.danger }}
                accessibilityLabel={card.is_blocked ? "Desbloquear tarjeta" : "Bloquear tarjeta"}
                accessibilityRole="switch"
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
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 24 },
  empty: { textAlign: "center", marginTop: 40 },
  card: { borderRadius: 16, padding: 20, marginBottom: 20 },
  cardBlocked: { opacity: 0.6 },
  cardType: { fontSize: 12, letterSpacing: 1, marginBottom: 20 },
  cardNumber: { fontSize: 22, letterSpacing: 2, marginBottom: 24 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { fontSize: 10, marginBottom: 4 },
  cardValue: { fontSize: 14, fontWeight: "600" },
  blockedBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
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