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
import { BookWithProgress } from '@/types/database';
import { BookOpen, TrendingUp, Clock, Star } from 'lucide-react-native';

interface UserProfile {
  username: string;
  profile_picture_url: string | null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentBooks, setRecentBooks] = useState<BookWithProgress[]>([]);
  const [popularBooks, setPopularBooks] = useState<BookWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readingGoal, setReadingGoal] = useState({ current: 3, total: 10 });

  useEffect(() => {
    loadData();
  }, []);

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

      // Load recent books
      const { data: booksData, error: booksError } = await supabase
        .from('novels')
        .select('*')
        .eq('user_id', user.id)
        .order('last_opened', { ascending: false, nullsFirst: false })
        .limit(3);

      if (booksError) throw booksError;

      if (booksData && booksData.length > 0) {
        const bookIds = booksData.map((book) => book.id);

        const { data: progressData } = await supabase
          .from('reading_progress')
          .select('*')
          .in('book_id', bookIds);

        const booksWithProgress = booksData.map((book) => ({
          ...book,
          reading_progress: progressData?.find((p) => p.book_id === book.id),
        }));

        setRecentBooks(booksWithProgress);
      }

      // Load popular books (mock data for now)
      // In production, you'd fetch this from a trending/popular table
      setPopularBooks([]);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderBookCard = ({ item }: { item: BookWithProgress }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => router.push(`/reader?bookId=${item.id}`)}
    >
      <View style={styles.bookCoverContainer}>
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.bookCover} />
        ) : (
          <View style={styles.bookCoverPlaceholder}>
            <BookOpen size={32} color="#999" />
          </View>
        )}
        {item.reading_progress && item.reading_progress.progress_percentage > 0 && (
          <View style={styles.readBadge}>
            <Text style={styles.readBadgeText}>
              {Math.round(item.reading_progress.progress_percentage)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.bookCardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      {item.author && (
        <Text style={styles.bookCardAuthor} numberOfLines={1}>
          {item.author}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderSmallBookCard = ({ item }: { item: BookWithProgress }) => (
    <TouchableOpacity
      style={styles.smallBookCard}
      onPress={() => router.push(`/reader?bookId=${item.id}`)}
    >
      <View style={styles.smallBookCover}>
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.smallCoverImage} />
        ) : (
          <BookOpen size={24} color="#999" />
        )}
      </View>
      <View style={styles.smallBookInfo}>
        <Text style={styles.smallBookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.author && (
          <Text style={styles.smallBookAuthor} numberOfLines={1}>
            {item.author}
          </Text>
        )}
        {item.reading_progress && (
          <View style={styles.smallProgressBar}>
            <View
              style={[
                styles.smallProgressFill,
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
                    { width: `${progressPercentage}%` },
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
        {recentBooks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue Reading</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/library-screen')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentBooks}
              renderItem={renderSmallBookCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.continueList}
            />
          </View>
        )}

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoryContainer}>
            {['All', 'Romance', 'Mystery', 'Fantasy', 'Sci-Fi'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  category === 'All' && styles.categoryChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === 'All' && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Books Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Books</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {popularBooks.length === 0 ? (
            <View style={styles.emptyPopular}>
              <TrendingUp size={48} color="#ddd" />
              <Text style={styles.emptyText}>No popular books yet</Text>
              <TouchableOpacity 
                style={styles.exploreButton}
                onPress={() => router.push('/(tabs)/library-screen')}
              >
                <Text style={styles.exploreButtonText}>Add Books</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={popularBooks}
              renderItem={renderBookCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularList}
            />
          )}
        </View>

        {/* Empty State */}
        {recentBooks.length === 0 && (
          <View style={styles.emptyState}>
            <BookOpen size={64} color="#ddd" />
            <Text style={styles.emptyTitle}>Start Your Reading Journey</Text>
            <Text style={styles.emptySubtitle}>
              Add your first book to begin
            </Text>
            <TouchableOpacity
              style={styles.addBookButton}
              onPress={() => router.push('/(tabs)/library-screen')}
            >
              <Text style={styles.addBookButtonText}>Add Book</Text>
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
  smallBookCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  smallBookCover: {
    width: 60,
    height: 80,
    backgroundColor: '#e8e8e8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  smallCoverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  smallBookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  smallBookTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  smallBookAuthor: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  smallProgressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  smallProgressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  bookCoverPlaceholder: {
    width: 140,
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 16,
  },
  exploreButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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