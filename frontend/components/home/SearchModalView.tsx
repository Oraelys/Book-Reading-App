// components/home/SearchModalView.tsx
import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, BookOpen } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Novel } from '@/types/home';
import { SearchResultItem } from './ListItems';

const CATEGORIES = ['All', 'Romance', 'Mystery', 'Fantasy', 'Sci-Fi', 'Thriller', 'Horror', 'Adventure'];

interface SearchModalViewProps {
  visible: boolean;
  onClose: () => void;
  onBookPress: (id: string) => void;
  onBookLongPress: (book: Novel) => void;
  theme: any;
  styles: any;
}

const keyExtractor = (item: Novel) => item.id;

// The modal owns ALL search state internally — changes to searchQuery/results
// never bubble up to the parent HomeScreen and cannot trigger its re-render.
const SearchModalView = memo(({
  visible, onClose, onBookPress, onBookLongPress, theme, styles,
}: SearchModalViewProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Novel[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchCategory, setSearchCategory] = useState('All');

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSearchResults([]);
      setSearchCategory('All');
    }
  }, [visible]);

  // Debounced search — identical logic to original
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, searchCategory]);

  const performSearch = useCallback(async () => {
    setSearching(true);
    try {
      let query = supabase
        .from('novels')
        .select('id, title, author, description, category, cover_image_url, rating, total_ratings, views')
        .eq('is_public', true);

      const searchTerm = searchQuery.trim();
      // Search title, description, and both author column variants
      query = query.or(
        `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,author_name.ilike.%${searchTerm}%`
      );

      if (searchCategory !== 'All') {
        query = query.eq('category', searchCategory);
      }

      query = query.order('rating', { ascending: false }).limit(20);

      const { data, error } = await query;
      if (error) {
        console.error('Search error:', error.message, error.details);
        throw error;
      }
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching books:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery, searchCategory]);

  const handleClearQuery = useCallback(() => setSearchQuery(''), []);

  const handleBookPress = useCallback((id: string) => {
    onClose();
    onBookPress(id);
  }, [onClose, onBookPress]);

  const renderSearchResult = useCallback(({ item }: { item: Novel }) => (
    <SearchResultItem
      item={item}
      onPress={handleBookPress}
      onLongPress={onBookLongPress}
      theme={theme}
      styles={styles}
    />
  ), [handleBookPress, onBookLongPress, theme, styles]);

  const searchInputStyle = useMemo(() => [
    styles.searchModalInput,
    { backgroundColor: theme.surface },
  ], [styles.searchModalInput, theme.surface]);

  const inputTextStyle = useMemo(() => [
    styles.searchInput,
    { color: theme.text },
  ], [styles.searchInput, theme.text]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.searchModal, { backgroundColor: theme.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.searchModalHeader, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.searchModalTitle, { color: theme.text }]}>Search Books</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Input */}
        <View style={searchInputStyle}>
          <Search size={20} color={theme.placeholder} />
          <TextInput
            style={inputTextStyle}
            placeholder="Search by title, author, or description..."
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearQuery}>
              <X size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.searchCategoryContainer}
        >
          {CATEGORIES.map((category) => (
            <SearchCategoryChip
              key={category}
              category={category}
              isSelected={category === searchCategory}
              onPress={setSearchCategory}
              theme={theme}
              styles={styles}
            />
          ))}
        </ScrollView>

        {/* Results area */}
        {searching ? (
          <View style={styles.searchLoading}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : searchQuery.trim().length < 2 ? (
          <View style={styles.searchEmpty}>
            <Search size={64} color={theme.border} />
            <Text style={[styles.searchEmptyTitle, { color: theme.text }]}>Search for books</Text>
            <Text style={[styles.searchEmptyText, { color: theme.textSecondary }]}>
              Enter at least 2 characters to search
            </Text>
          </View>
        ) : searchResults.length === 0 ? (
          <View style={styles.searchEmpty}>
            <BookOpen size={64} color={theme.border} />
            <Text style={[styles.searchEmptyTitle, { color: theme.text }]}>No books found</Text>
            <Text style={[styles.searchEmptyText, { color: theme.textSecondary }]}>
              Try a different search term or category
            </Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.searchResultsList}
            showsVerticalScrollIndicator={false}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={5}
            removeClippedSubviews={true}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
});

SearchModalView.displayName = 'SearchModalView';
export default SearchModalView;

// ---------------------------------------------------------------------------
// Internal chip — memo'd so category chips don't all re-render on query change
// ---------------------------------------------------------------------------
interface SearchCategoryChipProps {
  category: string;
  isSelected: boolean;
  onPress: (cat: string) => void;
  theme: any;
  styles: any;
}

const SearchCategoryChip = memo(({
  category, isSelected, onPress, theme, styles,
}: SearchCategoryChipProps) => {
  const handlePress = useCallback(() => onPress(category), [onPress, category]);
  return (
    <TouchableOpacity
      style={[
        styles.searchCategoryChip,
        {
          backgroundColor: isSelected ? theme.primary : theme.surface,
          borderColor: theme.border,
        },
      ]}
      onPress={handlePress}
    >
      <Text
        style={[
          styles.searchCategoryText,
          { color: isSelected ? '#fff' : theme.text },
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );
});
SearchCategoryChip.displayName = 'SearchCategoryChip';