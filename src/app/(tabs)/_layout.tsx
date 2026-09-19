import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: "Inicio" }} />
      <Tabs.Screen name="cards" options={{ title: "Tarjetas" }} />
      <Tabs.Screen name="bills" options={{ title: "Pagos" }} />
      <Tabs.Screen name="investments" options={{ title: "Inversiones" }} />
      <Tabs.Screen name="analytics" options={{ title: "Análisis" }} />
    </Tabs>
  );
}