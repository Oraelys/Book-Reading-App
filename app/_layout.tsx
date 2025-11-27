import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inAuth = segments[0] === 'login' || segments[0] === 'register';
    
    // The splash screen (index) will handle its own navigation
    // We only need to protect tab routes when user is not authenticated
    if (!user && inAuthGroup) {
      router.replace('/login');
    } else if (user && !inAuthGroup && !inAuth && segments[0] !== 'reader' && segments[0] !== 'book-comments') {
      router.replace('/(tabs)');
    }

    setIsNavigationReady(true);

    // Hide the native splash after a short delay
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 100);
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="reader" />
      <Stack.Screen name="book-comments" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}