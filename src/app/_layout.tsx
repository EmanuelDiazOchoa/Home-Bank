import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../store/authStore";
import AppAlert from "../components/AppAlert";
import AnimatedSplash from "../components/AnimatedSplash";

export default function RootLayout() {
  const { session, isLoading, initialize } = useAuthStore();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [splashDone, setSplashDone] = useState(false);
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
      setHasSeenOnboarding(true);
      AsyncStorage.setItem("hasSeenOnboarding", "true");
      router.replace("/onboarding");
      return;
    }

    if (!session && !inAuthGroup && !inOnboarding) {
      router.replace("/login");
    } else if (session && inAuthGroup) {
      router.replace("/home");
    }
  }, [session, isLoading, segments, navigationState?.key, hasSeenOnboarding]);

  const appReady = !isLoading && hasSeenOnboarding !== null;

  return (
    <>
      {appReady && <Stack screenOptions={{ headerShown: false }} />}
      <AppAlert />
      {!splashDone && <AnimatedSplash ready={appReady} onFinish={() => setSplashDone(true)} />}
    </>
  );
}