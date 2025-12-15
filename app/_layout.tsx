// app/_layout.tsx
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContexts';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
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
    const publicScreens = ['book-details', 'reader', 'book-comments', 'chat-room', 'search-users', 'user-profile', 'create-group', 'create-status', 'status-viewer'];
    const inPublicScreen = publicScreens.includes(segments[0] as string);

    console.log('Navigation check:', { user: !!user, segments, appIsReady });

    // Navigate from splash screen
    if (!user && !inAuth) {
      console.log('Navigating to login');
      router.replace('/login');
    } else if (user && !inAuthGroup && !inAuth && !inPublicScreen) {
      console.log('Navigating to tabs');
      router.replace('/(tabs)');
    }

    // Hide the native splash
    SplashScreen.hideAsync();
  }, [appIsReady, user, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="reader" />
        <Stack.Screen name="book-comments" />
        <Stack.Screen name="book-details" />
        <Stack.Screen name="search-books" />
        <Stack.Screen name="chat-room" />
        <Stack.Screen name="search-users" />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="user-profile" />
        <Stack.Screen name="create-group" />
        <Stack.Screen name="create-status" />
        <Stack.Screen name="status-viewer" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}