import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContexts';

export default function CreateStatusScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Create Status</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <ImageIcon size={64} color={theme.border} />
        <Text style={[styles.title, { color: theme.text }]}>Share Your Status</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          This feature is coming soon!
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}