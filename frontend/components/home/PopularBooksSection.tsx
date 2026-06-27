// components/home/PopularBooksSection.tsx
import React, { memo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import EnhancedBookCard from '@/components/EnhancedBookCard';
import { Novel } from '@/types/home';

interface PopularBooksSectionProps {
  books: Novel[];
  onBookPress: (id: string) => void;
  onBookLongPress: (book: Novel) => void;
  onSeeAll: () => void;
  theme: any;
  styles: any;
}

// Slice is stable — the parent passes popularBooks.slice(0,5) via useMemo
const keyExtractor = (item: Novel) => item.id;

const PopularBooksSection = memo(({
  books, onBookPress, onBookLongPress, onSeeAll, theme, styles,
}: PopularBooksSectionProps) => {
  const renderItem = useCallback(({ item }: { item: Novel }) => (
    <EnhancedBookCard
      book={item}
      onPress={() => onBookPress(item.id)}
      onLongPress={() => onBookLongPress(item)}
    />
  ), [onBookPress, onBookLongPress]);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Popular Books</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={books}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.popularList}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={false}
      />
    </View>
  );
});

PopularBooksSection.displayName = 'PopularBooksSection';
export default PopularBooksSection;