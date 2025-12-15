import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContexts';

export default function StatusViewerScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={[styles.fullscreen, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={28} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Status Viewer</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            This feature is coming soon!
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const fullscreenStyles = StyleSheet.create({
  fullscreen: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});