// components/home/BookSection.tsx
// One major-genre section: heading + horizontal FlatList of BookCards.
import React, { memo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import EnhancedBookCard from '@/components/EnhancedBookCard';
import { Novel } from '@/types/home';

interface BookSectionProps {
  label: string;          // display heading, e.g. "Your Next Read", "Romance", "Mystery"
  category: string;       // major genre used for "See All" navigation
  books: Novel[];
  onBookPress: (id: string) => void;
  onBookLongPress: (book: Novel) => void;
  onSeeAll: (category: string) => void;
  theme: any;
}

const keyExtractor = (item: Novel) => item.id;

const BookSection = memo(({
  label, category, books, onBookPress, onBookLongPress, onSeeAll, theme,
}: BookSectionProps) => {
  const handleSeeAll = useCallback(() => onSeeAll(category), [onSeeAll, category]);

  const renderBook = useCallback(
    ({ item }: { item: Novel }) => (
      <EnhancedBookCard
        book={item}
        onPress={() => onBookPress(item.id)}
        onLongPress={() => onBookLongPress(item)}
      />
    ),
    [onBookPress, onBookLongPress],
  );

  if (books.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.heading, { color: theme.text }]}>{label}</Text>
        <TouchableOpacity onPress={handleSeeAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={books}
        renderItem={renderBook}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={false}
      />
    </View>
  );
});

BookSection.displayName = 'BookSection';
export default BookSection;

const styles = StyleSheet.create({
  section: { marginBottom: 28 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  heading: { fontSize: 17, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 20, gap: 14 },
});