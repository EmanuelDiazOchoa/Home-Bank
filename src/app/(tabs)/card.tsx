import { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useCardStore } from "../../store/cardStore";

function maskCardNumber(number: string) {
  const clean = number.replace(/\D/g, "");
  const last4 = clean.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

export default function CardsScreen() {
  const { cards, isLoading, fetchCards, toggleBlockCard } = useCardStore();

  useEffect(() => {
    fetchCards();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis tarjetas</Text>

      {cards.length === 0 ? (
        <Text style={styles.empty}>No tenés tarjetas todavía.</Text>
      ) : (
        cards.map((card) => (
          <View
            key={card.id}
            style={[styles.card, card.is_blocked && styles.cardBlocked]}
          >
            <Text style={styles.cardType}>
              {card.card_type === "debit"
                ? "TARJETA DE DÉBITO"
                : "TARJETA DE CRÉDITO"}
            </Text>
            <Text style={styles.cardNumber}>
              {maskCardNumber(card.card_number)}
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
            </View>

            {card.is_blocked && (
              <View style={styles.blockedBadge}>
                <Text style={styles.blockedText}>🔒 BLOQUEADA</Text>
              </View>
            )}

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>
                {card.is_blocked ? "Desbloquear tarjeta" : "Bloquear tarjeta"}
              </Text>
              <Switch
                value={card.is_blocked}
                onValueChange={(value) => {
                  toggleBlockCard(card.id, value);
                }}
                trackColor={{ false: "#ddd", true: "#FF3B30" }}
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
  empty: { color: "#999", textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: "#1A1A2E",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardBlocked: { opacity: 0.5 },
  cardType: { color: "#aaa", fontSize: 12, letterSpacing: 1, marginBottom: 20 },
  cardNumber: {
    color: "#fff",
    fontSize: 22,
    letterSpacing: 2,
    marginBottom: 24,
  },
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { color: "#888", fontSize: 10, marginBottom: 4 },
  cardValue: { color: "#fff", fontSize: 14, fontWeight: "600" },
  blockedBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(255,59,48,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  blockedText: { color: "#FF3B30", fontSize: 11, fontWeight: "bold" },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  toggleLabel: { color: "#fff", fontSize: 13 },
});
