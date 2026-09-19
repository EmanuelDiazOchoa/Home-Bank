import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "../../store/themeStore";

export default function TabsLayout() {
  const { theme } = useThemeStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          tabBarAccessibilityLabel: "Inicio",
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: "Tarjetas",
          tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />,
          tabBarAccessibilityLabel: "Tarjetas",
        }}
      />
      <Tabs.Screen
        name="bills"
        options={{
          title: "Pagos",
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
          tabBarAccessibilityLabel: "Pagos y servicios",
        }}
      />
      <Tabs.Screen
        name="investments"
        options={{
          title: "Inversiones",
          tabBarIcon: ({ color, size }) => <Ionicons name="trending-up" size={size} color={color} />,
          tabBarAccessibilityLabel: "Inversiones y préstamos",
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Análisis",
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart" size={size} color={color} />,
          tabBarAccessibilityLabel: "Análisis de gastos",
        }}
      />
    </Tabs>
  );
}