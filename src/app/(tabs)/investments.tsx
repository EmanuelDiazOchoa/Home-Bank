import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useInvestmentStore } from "../../store/investmentStore";
import { useLoanStore } from "../../store/loanStore";
import { useAccountStore } from "../../store/accountStore";

const FIXED_TERM_RATE = 40; // TNA simulada, %
const LOAN_RATE = 60; // tasa simulada, %

export default function InvestmentsScreen() {
  const [activeTab, setActiveTab] = useState<"investment" | "loan">("investment");

  // Plazo fijo
  const [investAmount, setInvestAmount] = useState("");
  const [termDays, setTermDays] = useState("30");

  // Préstamo
  const [loanAmount, setLoanAmount] = useState("");
  const [installments, setInstallments] = useState("6");

  const { investments, fetchInvestments, createInvestment } = useInvestmentStore();
  const { loans, fetchLoans, requestLoan } = useLoanStore();
  const { accounts, fetchAccounts } = useAccountStore();
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Inversiones y préstamos</Text>

      <View style={styles.tabSwitch}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "investment" && styles.tabButtonActive]}
          onPress={() => setActiveTab("investment")}
        >
          <Text style={[styles.tabText, activeTab === "investment" && styles.tabTextActive]}>Plazo fijo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "loan" && styles.tabButtonActive]}
          onPress={() => setActiveTab("loan")}
        >
          <Text style={[styles.tabText, activeTab === "loan" && styles.tabTextActive]}>Préstamos</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "investment" ? (
        <View style={styles.form}>
          <Text style={styles.rateInfo}>TNA: {FIXED_TERM_RATE}%</Text>

          <TextInput
            style={styles.input}
            placeholder="Monto a invertir"
            value={investAmount}
            onChangeText={setInvestAmount}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Plazo en días"
            value={termDays}
            onChangeText={setTermDays}
            keyboardType="numeric"
          />

          {investAmount ? (
            <View style={styles.simulationBox}>
              <Text style={styles.simulationText}>Interés estimado: ${interest.toFixed(2)}</Text>
              <Text style={styles.simulationTotal}>Total al vencimiento: ${total.toFixed(2)}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.button} onPress={handleInvest}>
            <Text style={styles.buttonText}>Constituir plazo fijo</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Mis plazos fijos</Text>
          {investments.length === 0 ? (
            <Text style={styles.empty}>No tenés inversiones activas.</Text>
          ) : (
            investments.map((inv) => (
              <View key={inv.id} style={styles.listItem}>
                <Text style={styles.listItemTitle}>${inv.amount.toLocaleString("es-AR")}</Text>
                <Text style={styles.listItemSubtitle}>
                  {inv.term_days} días • Vence: {new Date(inv.maturity_date).toLocaleDateString("es-AR")}
                </Text>
              </View>
            ))
          )}
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.rateInfo}>TEA: {LOAN_RATE}%</Text>

          <TextInput
            style={styles.input}
            placeholder="Monto a solicitar"
            value={loanAmount}
            onChangeText={setLoanAmount}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Cantidad de cuotas"
            value={installments}
            onChangeText={setInstallments}
            keyboardType="numeric"
          />

          {loanAmount ? (
            <View style={styles.simulationBox}>
              <Text style={styles.simulationText}>
                {installments} cuotas de ${installmentAmount.toFixed(2)}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.button} onPress={handleLoan}>
            <Text style={styles.buttonText}>Solicitar préstamo</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Mis préstamos</Text>
          {loans.length === 0 ? (
            <Text style={styles.empty}>No tenés préstamos activos.</Text>
          ) : (
            loans.map((loan) => (
              <View key={loan.id} style={styles.listItem}>
                <Text style={styles.listItemTitle}>${loan.amount.toLocaleString("es-AR")}</Text>
                <Text style={styles.listItemSubtitle}>
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
  tabSwitch: { flexDirection: "row", marginBottom: 20, backgroundColor: "#eee", borderRadius: 10, padding: 4 },
  tabButton: { flex: 1, padding: 10, alignItems: "center", borderRadius: 8 },
  tabButtonActive: { backgroundColor: "#0066FF" },
  tabText: { color: "#666", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  form: { marginBottom: 40 },
  rateInfo: { fontSize: 14, color: "#888", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  simulationBox: { backgroundColor: "#F0F7FF", borderRadius: 8, padding: 14, marginBottom: 16 },
  simulationText: { fontSize: 14, color: "#333" },
  simulationTotal: { fontSize: 16, fontWeight: "bold", color: "#0066FF", marginTop: 4 },
  button: { backgroundColor: "#0066FF", borderRadius: 8, padding: 16, alignItems: "center", marginBottom: 24 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  empty: { color: "#999", textAlign: "center" },
  listItem: { backgroundColor: "#f9f9f9", borderRadius: 8, padding: 14, marginBottom: 10 },
  listItemTitle: { fontSize: 16, fontWeight: "bold" },
  listItemSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },
});