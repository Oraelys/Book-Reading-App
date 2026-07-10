import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export interface SegmentedTabOption {
  key: string;
  label: string;
}

interface SegmentedTabsProps {
  options: SegmentedTabOption[];
  activeKey: string;
  onChange: (key: string) => void;
  theme: any;
}

function SegmentedTabs({ options, activeKey, onChange, theme }: SegmentedTabsProps) {
  return (
    <View style={styles.row}>
      {options.map(opt => (
        <Tab key={opt.key} option={opt} active={opt.key === activeKey} onPress={onChange} theme={theme} />
      ))}
    </View>
  );
}

interface TabProps {
  option: SegmentedTabOption;
  active: boolean;
  onPress: (key: string) => void;
  theme: any;
}

const Tab = memo(function Tab({ option, active, onPress, theme }: TabProps) {
  const handlePress = useCallback(() => onPress(option.key), [onPress, option.key]);

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.chip,
        active
          ? { backgroundColor: theme.primary, borderColor: theme.primary }
          : { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.label, { color: active ? '#FFFFFF' : theme.textSecondary }]}>
        {option.label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  label: { fontSize: 14, fontWeight: '600' },
});

export default memo(SegmentedTabs);