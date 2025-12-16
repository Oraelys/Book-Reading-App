// app/(tabs)/library-screen.tsx - Updated with theme support
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
import { BookOpen, Search, Star, TrendingUp, Filter, Plus } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';

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
  reading_progress: {
    progress_percentage: number;
    current_page: number;
    last_read: string;
  };
}

export default function LibraryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [books, setBooks] = useState<Novel[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'title'>('recent');

  const categories = ['All', 'Romance', 'Mystery', 'Fantasy', 'Sci-Fi', 'Thriller'];

  const styles = getStyles(theme, isDark);

  useFocusEffect(
    React.useCallback(() => {
      loadUserBooks();
    }, [selectedCategory, sortBy])
  );

  const loadUserBooks = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('reading_progress')
        .select(`
          progress_percentage,
          current_page,
          last_read,
          novels:book_id (
            id,
            title,
            author,
            description,
            category,
            cover_image_url,
            rating,
            total_ratings,
            views
          )
        `)
        .eq('user_id', user.id);

      if (sortBy === 'recent') {
        query = query.order('last_read', { ascending: false });
      } else if (sortBy === 'progress') {
        query = query.order('progress_percentage', { ascending: false });
      }

      const { data: progressData, error } = await query;

      if (error) throw error;

      if (progressData) {
        let booksWithProgress = progressData
          .filter(item => item.novels)
          .map(item => ({
            ...(item.novels as any),
            reading_progress: {
              progress_percentage: item.progress_percentage,
              current_page: item.current_page,
              last_read: item.last_read,
            },
          }));

        if (selectedCategory !== 'All') {
          booksWithProgress = booksWithProgress.filter(
            book => book.category === selectedCategory
          );
        }

        if (sortBy === 'title') {
          booksWithProgress.sort((a, b) => a.title.localeCompare(b.title));
        }

        setBooks(booksWithProgress);
        setFilteredBooks(booksWithProgress);
      }
    } catch (error) {
      console.error('Error loading user books:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserBooks();
    setRefreshing(false);
  };

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
    try {
      await supabase.rpc('increment_book_views', { book_id: bookId });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }

    router.push({
      pathname: '/book-details',
      params: { bookId: bookId }
    } as any);
  };

  const handleBrowseAllBooks = () => {
    router.push('/search-books' as any);
  };

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
        {item.reading_progress && (
          <>
            <View style={styles.listProgressBar}>
              <View
                style={[
                  styles.listProgressFill,
                  { width: `${item.reading_progress.progress_percentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {Math.round(item.reading_progress.progress_percentage)}% complete
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Library</Text>
        <Text style={styles.headerSubtitle}>{books.length} books</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={theme.placeholder} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your library..."
          placeholderTextColor={theme.placeholder}
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
          style={[styles.sortButton, sortBy === 'recent' && styles.sortButtonActive]}
          onPress={() => setSortBy('recent')}
        >
          <TrendingUp size={16} color={sortBy === 'recent' ? '#fff' : theme.textSecondary} />
          <Text style={[styles.sortText, sortBy === 'recent' && styles.sortTextActive]}>
            Recent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'progress' && styles.sortButtonActive]}
          onPress={() => setSortBy('progress')}
        >
          <Star size={16} color={sortBy === 'progress' ? '#fff' : theme.textSecondary} />
          <Text style={[styles.sortText, sortBy === 'progress' && styles.sortTextActive]}>
            Progress
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'title' && styles.sortButtonActive]}
          onPress={() => setSortBy('title')}
        >
          <Filter size={16} color={sortBy === 'title' ? '#fff' : theme.textSecondary} />
          <Text style={[styles.sortText, sortBy === 'title' && styles.sortTextActive]}>
            Title
          </Text>
        </TouchableOpacity>
      </View>

      {/* Books List */}
      <FlatList
        data={filteredBooks}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <BookOpen size={64} color={theme.border} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No books found' : 'Your library is empty'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try a different search term'
                : 'Browse and add books to start reading'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={handleBrowseAllBooks}
              >
                <Plus size={20} color="#fff" />
                <Text style={styles.browseButtonText}>Browse Books</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: theme.surface,
    borderRadius: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.text,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    paddingBottom: 23,
    gap: 8,
    height: 60,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: theme.surface,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: theme.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
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
    backgroundColor: theme.surface,
    borderRadius: 16,
    gap: 6,
  },
  sortButtonActive: {
    backgroundColor: theme.primary,
  },
  sortText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  sortTextActive: {
    color: '#fff',
  },
  listContentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
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
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  listAuthor: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 6,
  },
  listDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
    opacity: 0.8,
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
    color: theme.text,
  },
  listCategory: {
    backgroundColor: theme.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  listCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.primary,
  },
  listProgressBar: {
    height: 4,
    backgroundColor: theme.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  listProgressFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: theme.textSecondary,
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
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});