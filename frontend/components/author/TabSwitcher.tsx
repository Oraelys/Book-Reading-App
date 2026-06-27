// components/author/TabSwitcher.tsx
import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TabSwitcherProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  theme: any;
}

const TabSwitcher = memo(({ tabs, activeTab, onChange, theme }: TabSwitcherProps) => (
  <View style={[styles.wrapper, { backgroundColor: theme.surface }]}>
    {tabs.map(tab => (
      <TabButton
        key={tab}
        label={tab}
        isActive={tab === activeTab}
        onPress={onChange}
        theme={theme}
      />
    ))}
  </View>
));

TabSwitcher.displayName = 'TabSwitcher';
export default TabSwitcher;

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onPress: (tab: string) => void;
  theme: any;
}

const TabButton = memo(({ label, isActive, onPress, theme }: TabButtonProps) => {
  const handlePress = useCallback(() => onPress(label), [onPress, label]);
  return (
    <TouchableOpacity
      style={[
        styles.tab,
        isActive && { backgroundColor: theme.primary },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.tabLabel,
          { color: isActive ? '#fff' : theme.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});
TabButton.displayName = 'TabButton';

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});