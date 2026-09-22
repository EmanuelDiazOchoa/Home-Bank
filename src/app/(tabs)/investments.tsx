import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useInvestmentStore } from "../../store/investmentStore";
import { useLoanStore } from "../../store/loanStore";
import { useAccountStore } from "../../store/accountStore";
import { useThemeStore } from "../../store/themeStore";


const FIXED_TERM_RATE = 40;
const LOAN_RATE = 60;

export default function InvestmentsScreen() {
  const [activeTab, setActiveTab] = useState<"investment" | "loan">("investment");
  const [investAmount, setInvestAmount] = useState("");
  const [termDays, setTermDays] = useState("30");
  const [loanAmount, setLoanAmount] = useState("");
  const [installments, setInstallments] = useState("6");

  const { investments, fetchInvestments, createInvestment } = useInvestmentStore();
  const { loans, fetchLoans, requestLoan } = useLoanStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { theme } = useThemeStore();
  const mainAccount = accounts[0];

  useEffect(() => {
    fetchInvestments();
    fetchLoans();
  }, []);

  function calculateInvestmentReturn() {
    const amount = parseFloat(investAmount) || 0;
    const days = parseInt(termDays) || 0;
    const interest = amount * (FIXED_TERM_RATE / 100) * (days / 365);
    return { interest, total: amount + interest };
  }

  function calculateLoanInstallment() {
    const amount = parseFloat(loanAmount) || 0;
    const numInstallments = parseInt(installments) || 1;
    const totalWithInterest = amount * (1 + LOAN_RATE / 100);
    return totalWithInterest / numInstallments;
  }

  async function handleInvest() {
    const amount = parseFloat(investAmount);
    const days = parseInt(termDays);
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Ingresá un monto válido");
      return;
    }
    const { error } = await createInvestment(mainAccount.id, amount, FIXED_TERM_RATE, days);
    if (error) {
      Alert.alert("Error", error);
    } else {
      await fetchAccounts();
      setInvestAmount("");
      Alert.alert("¡Listo! ✅", "Plazo fijo constituido correctamente");
    }
  }

  async function handleLoan() {
    const amount = parseFloat(loanAmount);
    const numInstallments = parseInt(installments);
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Ingresá un monto válido");
      return;
    }
    const { error } = await requestLoan(mainAccount.id, amount, LOAN_RATE, numInstallments);
    if (error) {
      Alert.alert("Error", error);
    } else {
      await fetchAccounts();
      setLoanAmount("");
      Alert.alert("¡Listo! ✅", "Préstamo acreditado en tu cuenta");
    }
  }

  const { interest, total } = calculateInvestmentReturn();
  const installmentAmount = calculateLoanInstallment();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Inversiones y préstamos</Text>

      <View style={[styles.tabSwitch, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "investment" && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab("investment")}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "investment" }}
        >
          <Text style={[styles.tabText, { color: activeTab === "investment" ? "#fff" : theme.textSecondary }]}>
            Plazo fijo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "loan" && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab("loan")}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "loan" }}
        >
          <Text style={[styles.tabText, { color: activeTab === "loan" ? "#fff" : theme.textSecondary }]}>
            Préstamos
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "investment" ? (
        <View style={styles.form}>
          <Text style={[styles.rateInfo, { color: theme.textSecondary }]}>TNA: {FIXED_TERM_RATE}%</Text>

          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholder="Monto a invertir"
            placeholderTextColor={theme.textSecondary}
            value={investAmount}
            onChangeText={setInvestAmount}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholder="Plazo en días"
            placeholderTextColor={theme.textSecondary}
            value={termDays}
            onChangeText={setTermDays}
            keyboardType="numeric"
          />

          {investAmount ? (
            <View style={[styles.simulationBox, { backgroundColor: theme.primary + "1A" }]}>
              <Text style={{ color: theme.text }}>Interés estimado: ${interest.toFixed(2)}</Text>
              <Text style={[styles.simulationTotal, { color: theme.primary }]}>
                Total al vencimiento: ${total.toFixed(2)}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleInvest}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Constituir plazo fijo</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Mis plazos fijos</Text>
          {investments.length === 0 ? (
  <View style={styles.emptyBox}>
    <Ionicons name="trending-up-outline" size={32} color={theme.textSecondary} />
    <Text style={[styles.empty, { color: theme.textSecondary }]}>No tenés inversiones activas.</Text>
  </View>
) : (
            investments.map((inv) => (
              <View key={inv.id} style={[styles.listItem, { backgroundColor: theme.surface }]}>
                <Text style={[styles.listItemTitle, { color: theme.text }]}>
                  ${inv.amount.toLocaleString("es-AR")}
                </Text>
                <Text style={[styles.listItemSubtitle, { color: theme.textSecondary }]}>
                  {inv.term_days} días • Vence: {new Date(inv.maturity_date).toLocaleDateString("es-AR")}
                </Text>
              </View>
            ))
          )}
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={[styles.rateInfo, { color: theme.textSecondary }]}>TEA: {LOAN_RATE}%</Text>

          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholder="Monto a solicitar"
            placeholderTextColor={theme.textSecondary}
            value={loanAmount}
            onChangeText={setLoanAmount}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            placeholder="Cantidad de cuotas"
            placeholderTextColor={theme.textSecondary}
            value={installments}
            onChangeText={setInstallments}
            keyboardType="numeric"
          />

          {loanAmount ? (
            <View style={[styles.simulationBox, { backgroundColor: theme.primary + "1A" }]}>
              <Text style={{ color: theme.text }}>
                {installments} cuotas de ${installmentAmount.toFixed(2)}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleLoan}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Solicitar préstamo</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Mis préstamos</Text>
          {loans.length === 0 ? (
  <View style={styles.emptyBox}>
    <Ionicons name="cash-outline" size={32} color={theme.textSecondary} />
    <Text style={[styles.empty, { color: theme.textSecondary }]}>No tenés préstamos activos.</Text>
  </View>
) : (
            loans.map((loan) => (
              <View key={loan.id} style={[styles.listItem, { backgroundColor: theme.surface }]}>
                <Text style={[styles.listItemTitle, { color: theme.text }]}>
                  ${loan.amount.toLocaleString("es-AR")}
                </Text>
                <Text style={[styles.listItemSubtitle, { color: theme.textSecondary }]}>
                  {loan.installments} cuotas de ${loan.installment_amount.toFixed(2)}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  tabSwitch: { flexDirection: "row", marginBottom: 20, borderRadius: 10, padding: 4 },
  tabButton: { flex: 1, padding: 10, alignItems: "center", borderRadius: 8 },
  tabText: { fontWeight: "600" },
  form: { marginBottom: 40 },
  rateInfo: { fontSize: 14, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 16 },
  simulationBox: { borderRadius: 8, padding: 14, marginBottom: 16 },
  simulationTotal: { fontSize: 16, fontWeight: "bold", marginTop: 4 },
  button: { borderRadius: 8, padding: 16, alignItems: "center", marginBottom: 24 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  emptyBox: { alignItems: "center", marginTop: 40, gap: 8 },
  empty: { textAlign: "center" },
  listItem: { borderRadius: 8, padding: 14, marginBottom: 10 },
  listItemTitle: { fontSize: 16, fontWeight: "bold" },
  listItemSubtitle: { fontSize: 13, marginTop: 2 },
});