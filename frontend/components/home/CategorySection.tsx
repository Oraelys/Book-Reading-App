// components/home/CategorySection.tsx
import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface CategorySectionProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  theme: any;
}

const CategorySection = memo(({
  categories,
  selectedCategory,
  onSelectCategory,
  theme,
}: CategorySectionProps) => (
  <View style={styles.wrapper}>
    <Text style={[styles.label, { color: theme.text }]}>Categories</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {categories.map((cat) => (
        <CategoryChip
          key={cat}
          category={cat}
          isSelected={cat === selectedCategory}
          onPress={onSelectCategory}
          theme={theme}
        />
      ))}
    </ScrollView>
  </View>
));
CategorySection.displayName = 'CategorySection';
export default CategorySection;

interface ChipProps {
  category: string;
  isSelected: boolean;
  onPress: (cat: string) => void;
  theme: any;
}

const CategoryChip = memo(({ category, isSelected, onPress, theme }: ChipProps) => {
  const handlePress = useCallback(() => onPress(category), [onPress, category]);
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? theme.primary : theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
        },
      ]}
      onPress={handlePress}
    >
      <Text style={[styles.chipText, { color: isSelected ? '#fff' : theme.text }]}>
        {category}
      </Text>
    </TouchableOpacity>
  );
});
CategoryChip.displayName = 'CategoryChip';

const styles = StyleSheet.create({
  wrapper: { marginBottom: 24, marginTop: 24 },
  label: { fontSize: 18, fontWeight: '700', marginBottom: 14, paddingHorizontal: 20 },
  row: { paddingHorizontal: 20, gap: 8 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
});