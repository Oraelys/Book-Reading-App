import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmptyTabStateProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  subtitle: string;
  theme: any;
}

function EmptyTabState({ icon: Icon, title, subtitle, theme }: EmptyTabStateProps) {
  return (
    <View style={styles.container}>
      <Icon size={52} color={theme.border} />
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 40, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center' },
});

export default memo(EmptyTabState);