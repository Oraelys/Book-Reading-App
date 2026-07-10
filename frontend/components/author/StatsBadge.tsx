import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatBadgeProps {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  value: string | number;
  theme: any;
}

function StatBadge({ icon: Icon, value, theme }: StatBadgeProps) {
  return (
    <View style={styles.row}>
      <Icon size={14} color={theme.textSecondary} />
      <Text style={[styles.text, { color: theme.textSecondary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { fontSize: 12, fontWeight: '600' },
});

export default memo(StatBadge);