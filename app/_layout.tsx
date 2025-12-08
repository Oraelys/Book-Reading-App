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
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for auth to load
        if (loading) return;
        
        // Wait minimum 2 seconds for splash screen
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setAppIsReady(true);
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, [loading]);

  useEffect(() => {
    if (!appIsReady) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inAuth = segments[0] === 'login' || segments[0] === 'register';
    const inBookDetails = segments[0] === 'book-details';
    const inReader = segments[0] === 'reader';
    const inBookComments = segments[0] === 'book-comments';

    console.log('Navigation check:', { user: !!user, segments, appIsReady });

    // Navigate from splash screen
    if (!user && !inAuth) {
      console.log('Navigating to login');
      router.replace('/login');
    } else if (user && !inAuthGroup && !inAuth && !inBookDetails && !inReader && !inBookComments) {
      console.log('Navigating to tabs');
      router.replace('/(tabs)');
    }

    // Hide the native splash
    SplashScreen.hideAsync();
  }, [appIsReady, user, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="reader" />
      <Stack.Screen name="book-comments" />
      <Stack.Screen name="book-details" />
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="search-books" />
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