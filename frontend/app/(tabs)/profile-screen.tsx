
// app/(tabs)/profile-screen.tsx - Fixed version
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  LogOut,
  User,
  Mail,
  ShieldCheck,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';
import { supabase } from '@/lib/supabase';
import { apiRequest, ApiError } from '@/lib/api';

interface Profile {
  username: string;
  user_tag: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, isDark, themeMode, setThemeMode } = useTheme();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total_books: 0,
    completed_books: 0,
    reading_books: 0,
  });

  const [authorizationTesting, setAuthorizationTesting] = useState(false);
  const [authorizationResult, setAuthorizationResult] = useState<string | null>(
    null,
  );

  const styles = getStyles(theme, isDark);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, user_tag, email, avatar_url, bio')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);

        // Create default profile if it doesn't exist.
        const username = user.email?.split('@')[0] || 'user';

        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username,
            user_tag: `@${username}`,
            email: user.email || '',
            avatar_url: null,
          })
          .select('username, user_tag, email, avatar_url, bio')
          .single();

        if (newProfile) {
          setProfile(newProfile);
        }
      } else {
        setProfile(profileData);
      }

      // Load reading statistics.
      const { data: progressData } = await supabase
        .from('reading_progress')
        .select('progress_percentage')
        .eq('user_id', user.id);

      if (progressData) {
        const completed = progressData.filter(
          (p) => p.progress_percentage >= 100,
        ).length;

        const reading = progressData.filter(
          (p) =>
            p.progress_percentage > 0 && p.progress_percentage < 100,
        ).length;

        setStats({
          total_books: progressData.length,
          completed_books: completed,
          reading_books: reading,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizationTest = async () => {
    setAuthorizationTesting(true);
    setAuthorizationResult(null);

    try {
      /*
       * apiRequest() automatically:
       * 1. Gets the current Supabase session.
       * 2. Gets session.access_token.
       * 3. Sends Authorization: Bearer <token>.
       *
       * We deliberately do not display the token.
       */
      await apiRequest('/content/admin/imported');

      setAuthorizationResult(
        '200 — Admin authorization granted.',
      );
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setAuthorizationResult(
            `401 — Authentication required. ${error.message}`,
          );
        } else if (error.status === 403) {
          setAuthorizationResult(
            `403 — Access denied. ${error.message}`,
          );
        } else {
          setAuthorizationResult(
            `${error.status} — ${error.message}`,
          );
        }
      } else if (error instanceof Error) {
        setAuthorizationResult(
          `Error — ${error.message}`,
        );
      } else {
        setAuthorizationResult('Error — Authorization test failed.');
      }
    } finally {
      setAuthorizationTesting(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ],
    );
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'auto') => {
    setThemeMode(mode);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
      edges={['top']}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.text },
            ]}
          >
            Profile
          </Text>

          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: theme.primary },
                ]}
              >
                <User size={48} color="#fff" />
              </View>
            )}
          </View>

          <Text
            style={[
              styles.username,
              { color: theme.text },
            ]}
          >
            {profile?.username || 'User'}
          </Text>

          <Text
            style={[
              styles.userTag,
              { color: theme.textSecondary },
            ]}
          >
            {profile?.user_tag || '@user'}
          </Text>

          {profile?.bio && (
            <Text
              style={[
                styles.bio,
                { color: theme.textSecondary },
              ]}
            >
              {profile.bio}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surface },
            ]}
          >
            <Text
              style={[
                styles.statValue,
                { color: theme.text },
              ]}
            >
              {stats.total_books}
            </Text>

            <Text
              style={[
                styles.statLabel,
                { color: theme.textSecondary },
              ]}
            >
              Total Books
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surface },
            ]}
          >
            <Text
              style={[
                styles.statValue,
                { color: theme.text },
              ]}
            >
              {stats.reading_books}
            </Text>

            <Text
              style={[
                styles.statLabel,
                { color: theme.textSecondary },
              ]}
            >
              Reading
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surface },
            ]}
          >
            <Text
              style={[
                styles.statValue,
                { color: theme.text },
              ]}
            >
              {stats.completed_books}
            </Text>

            <Text
              style={[
                styles.statLabel,
                { color: theme.textSecondary },
              ]}
            >
              Completed
            </Text>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text },
            ]}
          >
            Account
          </Text>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.surface },
            ]}
          >
            <View style={styles.infoRow}>
              <Mail
                size={20}
                color={theme.textSecondary}
              />

              <View style={styles.infoContent}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  Email
                </Text>

                <Text
                  style={[
                    styles.infoValue,
                    { color: theme.text },
                  ]}
                >
                  {profile?.email ||
                    user?.email ||
                    'Not set'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Temporary Authorization Test */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text },
            ]}
          >
            Development Testing
          </Text>

          <View
            style={[
              styles.authTestCard,
              { backgroundColor: theme.surface },
            ]}
          >
            <View style={styles.authTestHeader}>
              <ShieldCheck
                size={22}
                color={theme.primary}
              />

              <View style={styles.authTestHeaderText}>
                <Text
                  style={[
                    styles.authTestTitle,
                    { color: theme.text },
                  ]}
                >
                  Admin Authorization Test
                </Text>

                <Text
                  style={[
                    styles.authTestDescription,
                    { color: theme.textSecondary },
                  ]}
                >
                  Tests the current account against the
                  protected admin endpoint.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.authTestButton,
                {
                  backgroundColor: authorizationTesting
                    ? theme.textSecondary
                    : theme.primary,
                },
              ]}
              onPress={handleAuthorizationTest}
              disabled={authorizationTesting}
            >
              {authorizationTesting ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                />
              ) : (
                <ShieldCheck
                  size={20}
                  color="#fff"
                />
              )}

              <Text style={styles.authTestButtonText}>
                {authorizationTesting
                  ? 'Testing...'
                  : 'Test Authorization'}
              </Text>
            </TouchableOpacity>

            {authorizationResult && (
              <View
                style={[
                  styles.authResult,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.authResultText,
                    { color: theme.text },
                  ]}
                >
                  {authorizationResult}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Theme Settings */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.text },
            ]}
          >
            Appearance
          </Text>

          <View
            style={[
              styles.themeContainer,
              { backgroundColor: theme.surface },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === 'light' && {
                  backgroundColor: theme.primary,
                },
              ]}
              onPress={() => handleThemeChange('light')}
            >
              <Sun
                size={24}
                color={
                  themeMode === 'light'
                    ? '#fff'
                    : theme.text
                }
              />

              <Text
                style={[
                  styles.themeText,
                  {
                    color:
                      themeMode === 'light'
                        ? '#fff'
                        : theme.text,
                  },
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === 'dark' && {
                  backgroundColor: theme.primary,
                },
              ]}
              onPress={() => handleThemeChange('dark')}
            >
              <Moon
                size={24}
                color={
                  themeMode === 'dark'
                    ? '#fff'
                    : theme.text
                }
              />

              <Text
                style={[
                  styles.themeText,
                  {
                    color:
                      themeMode === 'dark'
                        ? '#fff'
                        : theme.text,
                  },
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === 'auto' && {
                  backgroundColor: theme.primary,
                },
              ]}
              onPress={() => handleThemeChange('auto')}
            >
              <Monitor
                size={24}
                color={
                  themeMode === 'auto'
                    ? '#fff'
                    : theme.text
                }
              />

              <Text
                style={[
                  styles.themeText,
                  {
                    color:
                      themeMode === 'auto'
                        ? '#fff'
                        : theme.text,
                  },
                ]}
              >
                Auto
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.signOutButton,
              { backgroundColor: theme.error },
            ]}
            onPress={handleSignOut}
          >
            <LogOut size={20} color="#fff" />

            <Text style={styles.signOutText}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (
  theme: any,
  isDark: boolean,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },

    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },

    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
    },

    settingsButton: {
      padding: 8,
    },

    profileSection: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 24,
    },

    avatarContainer: {
      marginBottom: 16,
    },

    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: theme.border,
    },

    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: theme.border,
    },

    username: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 4,
    },

    userTag: {
      fontSize: 16,
      marginBottom: 12,
    },

    bio: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },

    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 24,
    },

    statCard: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },

    statValue: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 4,
    },

    statLabel: {
      fontSize: 12,
      textAlign: 'center',
    },

    section: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
    },

    infoCard: {
      padding: 16,
      borderRadius: 12,
    },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    infoContent: {
      flex: 1,
    },

    infoLabel: {
      fontSize: 12,
      marginBottom: 4,
    },

    infoValue: {
      fontSize: 15,
      fontWeight: '600',
    },

    authTestCard: {
      padding: 16,
      borderRadius: 12,
    },

    authTestHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 16,
    },

    authTestHeaderText: {
      flex: 1,
    },

    authTestTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },

    authTestDescription: {
      fontSize: 13,
      lineHeight: 19,
    },

    authTestButton: {
      minHeight: 46,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    authTestButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },

    authResult: {
      marginTop: 12,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
    },

    authResultText: {
      fontSize: 13,
      lineHeight: 19,
    },

    themeContainer: {
      flexDirection: 'row',
      padding: 8,
      borderRadius: 12,
      gap: 8,
    },

    themeOption: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      gap: 4,
    },

    themeText: {
      fontSize: 12,
      fontWeight: '600',
    },

    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },

    signOutText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });


