// components/author/ReadingOrderSelector.tsx
import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { List, Shuffle } from 'lucide-react-native';

export type ReadingOrder = 'sequential' | 'collection';

interface ReadingOrderSelectorProps {
  value: ReadingOrder;
  onChange: (order: ReadingOrder) => void;
  theme: any;
}

const OPTIONS: { key: ReadingOrder; label: string; subtitle: string; Icon: any }[] = [
  {
    key: 'sequential',
    label: 'Sequential',
    subtitle: 'Stories read in a fixed order',
    Icon: List,
  },
  {
    key: 'collection',
    label: 'Collection',
    subtitle: 'Stories can be read in any order',
    Icon: Shuffle,
  },
];

const ReadingOrderSelector = memo(({ value, onChange, theme }: ReadingOrderSelectorProps) => (
  <View style={styles.wrapper}>
    <Text style={[styles.label, { color: theme.textSecondary }]}>READING ORDER</Text>
    <View style={styles.row}>
      {OPTIONS.map(opt => (
        <OrderOption
          key={opt.key}
          option={opt}
          active={value === opt.key}
          onPress={onChange}
          theme={theme}
        />
      ))}
    </View>
  </View>
));

ReadingOrderSelector.displayName = 'ReadingOrderSelector';
export default ReadingOrderSelector;

interface OrderOptionProps {
  option: typeof OPTIONS[number];
  active: boolean;
  onPress: (key: ReadingOrder) => void;
  theme: any;
}

const OrderOption = memo(({ option, active, onPress, theme }: OrderOptionProps) => {
  const handlePress = useCallback(() => onPress(option.key), [onPress, option.key]);
  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.option,
        {
          backgroundColor: theme.surface,
          borderColor: active ? theme.primary : theme.border,
        },
      ]}
    >
      <option.Icon
        size={20}
        color={active ? theme.primary : theme.textSecondary}
        style={styles.optionIcon}
      />
      <Text style={[styles.optionLabel, { color: active ? theme.primary : theme.text }]}>
        {option.label}
      </Text>
      <Text style={[styles.optionSub, { color: theme.textSecondary }]}>
        {option.subtitle}
      </Text>
    </Pressable>
  );
});
OrderOption.displayName = 'OrderOption';

const styles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 12 },
  option: {
    flex: 1,
    
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  optionIcon: { marginBottom: 6 },
  optionLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  optionSub: { fontSize: 11, textAlign: 'center' },
});