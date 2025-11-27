import { colors } from "@/constants/theme (1)";
import React, { useEffect } from "react";
import { StatusBar, StyleSheet, Text, View, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Navigate after auth is ready
      const timer = setTimeout(() => {
        if (user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      }, 2000); // Show splash for 2 seconds

      return () => clearTimeout(timer);
    }
  }, [loading, user]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.neutral900} />
      <Image
        source={require("../assets/images/favicon.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>NovelNest</Text>
      <Text style={styles.subtitle}>Your Reading Companion</Text>
      <ActivityIndicator 
        size="large" 
        color="#fff" 
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.neutral900,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginTop: 24,
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    marginTop: 8,
  },
  loader: {
    marginTop: 40,
  },
});