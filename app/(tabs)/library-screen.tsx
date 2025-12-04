import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Search, Star, TrendingUp, Filter } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Novel {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  cover_image_url: string;
  rating: number;
  total_ratings: number;
  views: number;
  reading_progress?: {
    progress_percentage: number;
  };
}

export default function LibraryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [books, setBooks] = useState<Novel[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent'>('popular');

  const categories = ['All', 'Romance', 'Mystery', 'Fantasy', 'Sci-Fi', 'Thriller'];

  useFocusEffect(
    React.useCallback(() => {
      loadBooks();
    }, [selectedCategory, sortBy])
  );

  const loadBooks = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('novels')
        .select('id, title, author, description, category, cover_image_url, rating, total_ratings, views')
        .eq('is_public', true);

      // Filter by category
      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }

      // Sort
      if (sortBy === 'popular') {
        query = query.order('views', { ascending: false });
      } else if (sortBy === 'rating') {
        query = query.order('rating', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data: booksData, error } = await query;

      if (error) throw error;

      if (booksData) {
        // Get reading progress for all books
        const bookIds = booksData.map(book => book.id);
        const { data: progressData } = await supabase
          .from('reading_progress')
          .select('book_id, progress_percentage')
          .eq('user_id', user.id)
          .in('book_id', bookIds);

        // Merge progress with books
        const booksWithProgress = booksData.map(book => ({
          ...book,
          reading_progress: progressData?.find(p => p.book_id === book.id),
        }));

        setBooks(booksWithProgress);
        setFilteredBooks(booksWithProgress);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBooks();
    setRefreshing(false);
  };

  // Search filter
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(
        book =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBooks(filtered);
    }
  }, [searchQuery, books]);

  const handleBookPress = async (bookId: string) => {
    // Increment views
    try {
      await supabase.rpc('increment_book_views', { book_id: bookId });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }

    console.log('Navigating to book details:', bookId);
    // Navigate to book details
    router.push({
      pathname: '/book-details',
      params: { bookId: bookId }
    } as any);
  };

  const renderGridItem = ({ item }: { item: Novel }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => handleBookPress(item.id)}
    >
      <View style={styles.gridImageContainer}>
        <Image 
          source={{ uri: item.cover_image_url }} 
          style={styles.gridImage}
          defaultSource={require('@/assets/images/book-placeholder.png')}
        />
        {item.reading_progress && item.reading_progress.progress_percentage > 0 && (
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>
              {Math.round(item.reading_progress.progress_percentage)}%
            </Text>
          </View>
        )}
        <View style={styles.ratingBadge}>
          <Star size={12} color="#FFD700" fill="#FFD700" />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={styles.gridTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.gridAuthor} numberOfLines={1}>
        {item.author}
      </Text>
      <View style={styles.gridStats}>
        <View style={styles.statItem}>
          <TrendingUp size={12} color="#666" />
          <Text style={styles.statText}>{item.views}</Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: Novel }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleBookPress(item.id)}
    >
      <Image 
        source={{ uri: item.cover_image_url }} 
        style={styles.listImage}
        defaultSource={require('@/assets/images/book-placeholder.png')}
      />
      <View style={styles.listContent}>
        <Text style={styles.listTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.listAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        <Text style={styles.listDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.listFooter}>
          <View style={styles.listRating}>
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <Text style={styles.listRatingText}>
              {item.rating.toFixed(1)} ({item.total_ratings})
            </Text>
          </View>
          <View style={styles.listCategory}>
            <Text style={styles.listCategoryText}>{item.category}</Text>
          </View>
        </View>
        {item.reading_progress && item.reading_progress.progress_percentage > 0 && (
          <View style={styles.listProgressBar}>
            <View
              style={[
                styles.listProgressFill,
                { width: `${item.reading_progress.progress_percentage}%` },
              ]}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search books, authors..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              category === selectedCategory && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                category === selectedCategory && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'popular' && styles.sortButtonActive]}
          onPress={() => setSortBy('popular')}
        >
          <TrendingUp size={16} color={sortBy === 'popular' ? '#007AFF' : '#666'} />
          <Text style={[styles.sortText, sortBy === 'popular' && styles.sortTextActive]}>
            Popular
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
          onPress={() => setSortBy('rating')}
        >
          <Star size={16} color={sortBy === 'rating' ? '#007AFF' : '#666'} />
          <Text style={[styles.sortText, sortBy === 'rating' && styles.sortTextActive]}>
            Top Rated
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]}
          onPress={() => setSortBy('recent')}
        >
          <Filter size={16} color={sortBy === 'recent' ? '#007AFF' : '#666'} />
          <Text style={[styles.sortText, sortBy === 'recent' && styles.sortTextActive]}>
            Recent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Books Grid */}
      <FlatList
        data={filteredBooks}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id}
        numColumns={1}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <BookOpen size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No books found</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try a different search term'
                : 'Check back later for new books'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  categoryScroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    gap: 6,
  },
  sortButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  sortText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  sortTextActive: {
    color: '#007AFF',
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  gridItem: {
    flex: 1,
    margin: 8,
    maxWidth: '47%',
  },
  gridImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  gridImage: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 12,
  },
  progressBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  gridAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  gridStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#666',
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    flex: 1,
    justifyContent: 'space-between',
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  listImage: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  listAuthor: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  listDescription: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
    marginBottom: 8,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  listCategory: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
  },
  listProgressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  listProgressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});