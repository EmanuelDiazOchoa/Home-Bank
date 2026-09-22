import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import PagerView from "react-native-pager-view";
import { useRouter } from "expo-router";
import { useThemeStore } from "../store/themeStore";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    emoji: "🏦",
    title: "Bienvenido a Home Bank",
    description: "Tu banco digital simulado, con todas las funciones de un banco real.",
  },
  {
    emoji: "💸",
    title: "Transferí en segundos",
    description: "Enviá dinero a otras cuentas por alias, de forma instantánea y segura.",
  },
  {
    emoji: "📊",
    title: "Controlá tus finanzas",
    description: "Pagá servicios, invertí en plazo fijo y analizá tus gastos, todo en un solo lugar.",
  },
];

export default function OnboardingScreen() {
  const [pageIndex, setPageIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const router = useRouter();
  const { theme } = useThemeStore();

  function goToNext() {
    if (pageIndex < SLIDES.length - 1) {
      pagerRef.current?.setPage(pageIndex + 1);
    } else {
      finishOnboarding();
    }
  }

  function finishOnboarding() {
    router.replace("/login");
  }

  const isLastSlide = pageIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.skipButton} onPress={finishOnboarding}>
        <Text style={[styles.skipText, { color: theme.textSecondary }]}>Omitir</Text>
      </TouchableOpacity>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setPageIndex(e.nativeEvent.position)}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text style={[styles.title, { color: theme.text }]}>{slide.title}</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {slide.description}
            </Text>
          </View>
        ))}
      </PagerView>

      <View style={styles.dotsContainer}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === pageIndex ? theme.primary : theme.border,
                width: index === pageIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.nextButton, { backgroundColor: theme.primary }]}
        onPress={goToNext}
        accessibilityRole="button"
        accessibilityLabel={isLastSlide ? "Comenzar" : "Siguiente"}
      >
        <Text style={styles.nextButtonText}>{isLastSlide ? "Comenzar" : "Siguiente"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipButton: { alignSelf: "flex-end", padding: 20, paddingTop: 60 },
  skipText: { fontSize: 15, fontWeight: "600" },
  pager: { flex: 1, width },
  slide: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emoji: { fontSize: 80, marginBottom: 32 },
  title: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 16 },
  description: { fontSize: 16, textAlign: "center", lineHeight: 24 },
  dotsContainer: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 24 },
  dot: { height: 8, borderRadius: 4 },
  nextButton: {
    marginHorizontal: 24,
    marginBottom: 40,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  nextButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});