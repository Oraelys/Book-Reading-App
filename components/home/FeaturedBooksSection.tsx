// components/home/FeaturedBooksSection.tsx
import React, { memo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import EnhancedBookCard from '@/components/EnhancedBookCard';
import { Novel } from '@/types/home';

interface FeaturedBooksSectionProps {
  books: Novel[];
  selectedCategory: string;
  onBookPress: (id: string) => void;
  onBookLongPress: (book: Novel) => void;
  onSeeAll: () => void;
  theme: any;
  styles: any;
}

const keyExtractor = (item: Novel) => item.id;

const FeaturedBooksSection = memo(({
  books, selectedCategory, onBookPress, onBookLongPress, onSeeAll, theme, styles,
}: FeaturedBooksSectionProps) => {
  const renderItem = useCallback(({ item }: { item: Novel }) => (
    <EnhancedBookCard
      book={item}
      onPress={() => onBookPress(item.id)}
      onLongPress={() => onBookLongPress(item)}
    />
  ), [onBookPress, onBookLongPress]);

  const title = selectedCategory === 'All' ? 'Featured Books' : selectedCategory;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color: theme.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {books.length === 0 ? (
        <View style={styles.emptyPopular}>
          <BookOpen size={48} color={theme.border} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No books in this category yet
          </Text>
        </View>
      ) : (
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
      )}
    </View>
  );
});

FeaturedBooksSection.displayName = 'FeaturedBooksSection';
export default FeaturedBooksSection;