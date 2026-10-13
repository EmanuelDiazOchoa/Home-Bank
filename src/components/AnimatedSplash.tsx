import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

export default function AnimatedSplash({ ready, onFinish }: { ready: boolean; onFinish: () => void }) {
  const logoScale = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleShift = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
      Animated.timing(titleShift, { toValue: 0, duration: 600, delay: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoScale, { toValue: 1.25, duration: 400, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, 1100);
    return () => clearTimeout(timer);
  }, [ready]);

  return (
    <Animated.View style={[styles.container, { opacity: overlayOpacity }]}>
      <Animated.Image
        source={require("../../assets/splash-icon.png")}
        style={[styles.logo, { transform: [{ scale: logoScale }] }]}
        resizeMode="contain"
      />
      <Animated.Text style={[styles.title, { opacity: titleOpacity, transform: [{ translateY: titleShift }] }]}>
        Home Bank
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0F6EFD",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    elevation: 100,
  },
  logo: { width: 220, height: 220 },
  title: { position: "absolute", top: "50%", marginTop: 90, color: "#fff", fontSize: 24, fontWeight: "bold", letterSpacing: 0.5 },
});