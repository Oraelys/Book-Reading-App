// app/_layout.tsx
import 'react-native-gesture-handler'; // must be first import
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { StatusBar } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContexts';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

// Stack screens (outside the (tabs) group) that a logged-in user is allowed
// to be on without getting redirected back to (tabs). Add any new top-level
// app/ screen here as soon as you create it, or this guard will bounce
// users straight back out of it.
const AUTHENTICATED_STACK_SCREENS = [
  'book-details',
  'reader',
  'book-comments',
  'chat-room',
  'search-users',
  'user-profile',
  'create-group',
  'create-status',
  'status-viewer',
  'search-books',
  'stories-management',
  'create-novel',
  'create-series',
];

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
    const inAuthenticatedStackScreen = AUTHENTICATED_STACK_SCREENS.includes(segments[0] as string);

    console.log('Navigation check:', { user: !!user, segments, appIsReady });

    // Navigate from splash screen
    if (!user && !inAuth) {
      console.log('Navigating to login');
      router.replace('/login');
    } else if (user && !inAuthGroup && !inAuth && !inAuthenticatedStackScreen) {
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
      <Stack.Screen name="search-books" />
      <Stack.Screen name="chat-room" />
      <Stack.Screen name="search-users" />
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="user-profile" />
      <Stack.Screen name="create-group" />
      <Stack.Screen name="create-status" />
      <Stack.Screen name="stories-management" />
      <Stack.Screen name="create-novel" />
      <Stack.Screen name="create-series" /> 
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}