import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, TrendingUp, Star } from 'lucide-react-native';

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
    current_page: number;
  };
}

interface UserProfile {
  username: string;
  profile_picture_url: string | null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [continueReading, setContinueReading] = useState<Novel[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<Novel[]>([]);
  const [popularBooks, setPopularBooks] = useState<Novel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readingGoal, setReadingGoal] = useState({ current: 0, total: 10 });

  const categories = ['All', 'Romance', 'Mystery', 'Fantasy', 'Sci-Fi', 'Thriller'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCategory !== 'All') {
      loadBooksByCategory(selectedCategory);
    } else {
      loadFeaturedBooks();
    }
  }, [selectedCategory]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, profile_picture_url')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load books user is currently reading
      await loadContinueReading();
      
      // Load featured books
      await loadFeaturedBooks();
      
      // Load popular books
      await loadPopularBooks();

      // Calculate reading goal
      await calculateReadingGoal();

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContinueReading = async () => {
    if (!user) return;

    try {
      // Get books with reading progress
      const { data: progressData } = await supabase
        .from('reading_progress')
        .select(`
          book_id,
          progress_percentage,
          current_page,
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
        .eq('user_id', user.id)
        .gt('progress_percentage', 0)
        .lt('progress_percentage', 100)
        .order('last_read', { ascending: false })
        .limit(3);

      if (progressData) {
        const books = progressData
          .filter(item => item.novels)
          .map(item => ({
            ...(item.novels as any),
            reading_progress: {
              progress_percentage: item.progress_percentage,
              current_page: item.current_page,
            },
          }));
        setContinueReading(books);
      }
    } catch (error) {
      console.error('Error loading continue reading:', error);
    }
  };

  const loadFeaturedBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('novels')
        .select('id, title, author, description, category, cover_image_url, rating, total_ratings, views')
        .eq('is_featured', true)
        .eq('is_public', true)
        .order('views', { ascending: false })
        .limit(10);

      if (error) throw error;
      setFeaturedBooks(data || []);
    } catch (error) {
      console.error('Error loading featured books:', error);
    }
  };

  const loadPopularBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('novels')
        .select('id, title, author, description, category, cover_image_url, rating, total_ratings, views')
        .eq('is_public', true)
        .order('views', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPopularBooks(data || []);
    } catch (error) {
      console.error('Error loading popular books:', error);
    }
  };

  const loadBooksByCategory = async (category: string) => {
    try {
      const { data, error } = await supabase
        .from('novels')
        .select('id, title, author, description, category, cover_image_url, rating, total_ratings, views')
        .eq('category', category)
        .eq('is_public', true)
        .order('rating', { ascending: false })
        .limit(10);

      if (error) throw error;
      setFeaturedBooks(data || []);
    } catch (error) {
      console.error('Error loading books by category:', error);
    }
  };

  const calculateReadingGoal = async () => {
    if (!user) return;

    try {
      const { count } = await supabase
        .from('reading_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('progress_percentage', 100);

      setReadingGoal({ current: count || 0, total: 10 });
    } catch (error) {
      console.error('Error calculating reading goal:', error);
    }
  };

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderBookCard = ({ item }: { item: Novel }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => handleBookPress(item.id)}
    >
      <View style={styles.bookCoverContainer}>
        <Image 
          source={{ uri: item.cover_image_url }} 
          style={styles.bookCover}
          defaultSource={require('@/assets/images/book-placeholder.png')}
        />
        {item.reading_progress && item.reading_progress.progress_percentage > 0 && (
          <View style={styles.readBadge}>
            <Text style={styles.readBadgeText}>
              {Math.round(item.reading_progress.progress_percentage)}%
            </Text>
          </View>
        )}
        <View style={styles.ratingBadge}>
          <Star size={12} color="#FFD700" fill="#FFD700" />
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={styles.bookCardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.bookCardAuthor} numberOfLines={1}>
        {item.author}
      </Text>
    </TouchableOpacity>
  );

  const renderContinueReadingCard = ({ item }: { item: Novel }) => (
    <TouchableOpacity
      style={styles.continueCard}
      onPress={() => handleBookPress(item.id)}
    >
      <Image 
        source={{ uri: item.cover_image_url }} 
        style={styles.continueCover}
        defaultSource={require('@/assets/images/book-placeholder.png')}
      />
      <View style={styles.continueInfo}>
        <Text style={styles.continueTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.continueAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        {item.reading_progress && (
          <>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${item.reading_progress.progress_percentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
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
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const username = profile?.username || user?.email?.split('@')[0] || 'Reader';
  const progressPercentage = (readingGoal.current / readingGoal.total) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={['#007AFF']}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello {username}!</Text>
            <Text style={styles.subGreeting}>Let's start reading</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile-screen')}
          >
            {profile?.profile_picture_url ? (
              <Image 
                source={{ uri: profile.profile_picture_url }} 
                style={styles.profilePic} 
              />
            ) : (
              <View style={styles.profilePicPlaceholder}>
                <Text style={styles.profileInitial}>
                  {username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Reading Goal Card */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>Your Goal</Text>
            <TouchableOpacity>
              <Text style={styles.goalEdit}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.goalProgress}>
            <View style={styles.goalStats}>
              <Text style={styles.goalCount}>
                {readingGoal.current}/{readingGoal.total}
              </Text>
              <Text style={styles.goalLabel}>Books</Text>
            </View>
            <View style={styles.goalBarContainer}>
              <View style={styles.goalBar}>
                <View
                  style={[
                    styles.goalBarFill,
                    { width: `${Math.min(progressPercentage, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.goalPercentage}>
                {Math.round(progressPercentage)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Continue Reading Section */}
        {continueReading.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue Reading</Text>
            </View>
            <FlatList
              data={continueReading}
              renderItem={renderContinueReadingCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.continueList}
            />
          </View>
        )}

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
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
        </View>

        {/* Featured/Category Books Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'All' ? 'Featured Books' : selectedCategory}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/library-screen')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {featuredBooks.length === 0 ? (
            <View style={styles.emptyPopular}>
              <BookOpen size={48} color="#ddd" />
              <Text style={styles.emptyText}>No books in this category yet</Text>
            </View>
          ) : (
            <FlatList
              data={featuredBooks}
              renderItem={renderBookCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularList}
            />
          )}
        </View>

        {/* Popular Books Section */}
        {selectedCategory === 'All' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Books</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/library-screen')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={popularBooks.slice(0, 5)}
              renderItem={renderBookCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularList}
            />
          </View>
        )}

        {/* Empty State */}
        {continueReading.length === 0 && featuredBooks.length === 0 && (
          <View style={styles.emptyState}>
            <BookOpen size={64} color="#ddd" />
            <Text style={styles.emptyTitle}>Discover Amazing Books</Text>
            <Text style={styles.emptySubtitle}>
              Browse our library to start your reading journey
            </Text>
            <TouchableOpacity
              style={styles.addBookButton}
              onPress={() => router.push('/(tabs)/library-screen')}
            >
              <Text style={styles.addBookButtonText}>Browse Library</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
  },
  profileButton: {
    marginLeft: 16,
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profilePicPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  goalCard: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    marginBottom: 24,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  goalEdit: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalStats: {
    marginRight: 16,
  },
  goalCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  goalLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  goalBarContainer: {
    flex: 1,
  },
  goalBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 8,
  },
  goalBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  goalPercentage: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  seeAll: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  continueList: {
    gap: 12,
  },
  continueCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  continueCover: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
  },
  continueInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  continueTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  continueAuthor: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#666',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
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
  popularList: {
    gap: 16,
    paddingRight: 20,
  },
  bookCard: {
    width: 140,
  },
  bookCoverContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  bookCover: {
    width: 140,
    height: 200,
    borderRadius: 12,
  },
  readBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readBadgeText: {
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
  bookCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  bookCardAuthor: {
    fontSize: 12,
    color: '#666',
  },
  emptyPopular: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  addBookButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addBookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});