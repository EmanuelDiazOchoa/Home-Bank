import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../store/authStore";
import AppAlert from "../components/AppAlert";

export default function RootLayout() {
  const { session, isLoading, initialize } = useAuthStore();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    initialize();
    checkOnboarding();
  }, []);

  async function checkOnboarding() {
    const value = await AsyncStorage.getItem("hasSeenOnboarding");
    setHasSeenOnboarding(value === "true");
  }

  useEffect(() => {
    if (!navigationState?.key) return;
    if (isLoading || hasSeenOnboarding === null) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    if (!hasSeenOnboarding && !inOnboarding) {
      setHasSeenOnboarding(true); // 👈 actualiza el estado local YA, no solo el storage
      AsyncStorage.setItem("hasSeenOnboarding", "true");
      router.replace("/onboarding");
      return; // 👈 corta acá para no evaluar las condiciones de abajo en el mismo ciclo
    }

    if (!session && !inAuthGroup && !inOnboarding) {
      router.replace("/login");
    } else if (session && inAuthGroup) {
      router.replace("/home");
    }
  }, [session, isLoading, segments, navigationState?.key, hasSeenOnboarding]);

  if (isLoading || hasSeenOnboarding === null) return null;

  return (
  <>
    <Stack screenOptions={{ headerShown: false }} />
    <AppAlert />
  </>
);
}