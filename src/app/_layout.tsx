import { useEffect } from "react";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import { useAuthStore } from "../store/authStore";

export default function RootLayout() {
  const { session, isLoading, initialize } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!navigationState?.key) return; 
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/login");
    } else if (session && inAuthGroup) {
      router.replace("/home");
    }
  }, [session, isLoading, segments, navigationState?.key]);

  if (isLoading) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}