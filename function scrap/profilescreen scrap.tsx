// app/user-profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MessageCircle, BookOpen, Star } from 'lucide-react-native';
import { ChatService, Profile } from '@/services/chatservices';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';
import { supabase } from '@/lib/supabase';

interface UserBook {
  id: string;
  title: string;
  author: string;
  cover_image_url: string;
  rating: number;
  progress_percentage: number;
}

interface UserStats {
  total_books: number;
  completed_books: number;
  reading_books: number;
  average_progress: number;
}

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { theme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<UserBook[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total_books: 0,
    completed_books: 0,
    reading_books: 0,
    average_progress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'reading' | 'completed'>('reading');

  const styles = getStyles(theme);

  useEffect(() => {
    if (userId) {
      loadProfileData();
    }
  }, [userId]);

  const loadProfileData = async () => {
    if (!userId) return;

    try {
      // Load profile
      const profileData = await ChatService.getUserById(userId);
      setProfile(profileData);

      // Load user's reading progress and books
      const { data: progressData, error } = await supabase
        .from('reading_progress')
        .select(`
          progress_percentage,
          current_page,
          last_read,
          novels:book_id (
            id,
            title,
            author,
            cover_image_url,
            rating
          )
        `)
        .eq('user_id', userId)
        .order('last_read', { ascending: false });

      if (error) throw error;

      if (progressData) {
        const userBooks: UserBook[] = progressData
          .filter(item => item.novels)
          .map(item => ({
            ...(item.novels as any),
            progress_percentage: item.progress_percentage,
          }));

        setBooks(userBooks);

        // Calculate stats
        const completed = userBooks.filter(b => b.progress_percentage >= 100).length;
        const reading = userBooks.filter(b => b.progress_percentage > 0 && b.progress_percentage < 100).length;
        const avgProgress = userBooks.length > 0
          ? userBooks.reduce((sum, b) => sum + b.progress_percentage, 0) / userBooks.length
          : 0;

        setStats({
          total_books: userBooks.length,
          completed_books: completed,
          reading_books: reading,
          average_progress: avgProgress,
        });
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!userId || !profile) return;

    setStartingChat(true);
    try {
      const roomId = await ChatService.getOrCreateDMRoom(userId);
      if (roomId) {
        router.push(`/chat-room?roomId=${roomId}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setStartingChat(false);
    }
  };

  const handleBookPress = (bookId: string) => {
    router.push(`/book-details?bookId=${bookId}`);
  };

  const renderBookItem = ({ item }: { item: UserBook }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => handleBookPress(item.id)}
    >
      <Image
        source={{ uri: item.cover_image_url }}
        style={styles.bookCover}
        defaultSource={require('@/assets/images/book-placeholder.png')}
      />
      <View style={styles.bookInfo}>
        <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.bookAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
          {item.author}
        </Text>
        <View style={styles.bookFooter}>
          <View style={styles.ratingContainer}>
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <Text style={[styles.ratingText, { color: theme.text }]}>
              {item.rating.toFixed(1)}
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: theme.primary }]}>
              {Math.round(item.progress_percentage)}%
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const readingBooks = books.filter(b => b.progress_percentage > 0 && b.progress_percentage < 100);
  const completedBooks = books.filter(b => b.progress_percentage >= 100);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: profile.avatar_url || 'https://via.placeholder.com/120' }}
            style={styles.avatar}
          />
          <Text style={[styles.username, { color: theme.text }]}>
            {profile.username}
          </Text>
          <Text style={[styles.userTag, { color: theme.textSecondary }]}>
            {profile.user_tag}
          </Text>
          {profile.bio && (
            <Text style={[styles.bio, { color: theme.textSecondary }]}>
              {profile.bio}
            </Text>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <BookOpen size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {stats.total_books}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total Books
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Star size={24} color="#FFD700" />
            <Text style={[styles.statValue, { color: theme.text }]}>
              {stats.completed_books}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Completed
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {Math.round(stats.average_progress)}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Avg Progress
            </Text>
          </View>
        </View>

        {/* Action Button */}
        {!isOwnProfile && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={handleStartChat}
              disabled={startingChat}
            >
              {startingChat ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MessageCircle size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Send Message</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Books Section */}
        <View style={styles.booksSection}>
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'reading' && [styles.tabActive, { borderBottomColor: theme.primary }]
              ]}
              onPress={() => setActiveTab('reading')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'reading' ? theme.primary : theme.textSecondary }
              ]}>
                Reading ({readingBooks.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'completed' && [styles.tabActive, { borderBottomColor: theme.primary }]
              ]}
              onPress={() => setActiveTab('completed')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'completed' ? theme.primary : theme.textSecondary }
              ]}>
                Completed ({completedBooks.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Books List */}
          {activeTab === 'reading' ? (
            readingBooks.length > 0 ? (
              <FlatList
                data={readingBooks}
                renderItem={renderBookItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.booksList}
              />
            ) : (
              <View style={styles.emptyBooks}>
                <BookOpen size={48} color={theme.border} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No books currently reading
                </Text>
              </View>
            )
          ) : (
            completedBooks.length > 0 ? (
              <FlatList
                data={completedBooks}
                renderItem={renderBookItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.booksList}
              />
            ) : (
              <View style={styles.emptyBooks}>
                <Star size={48} color={theme.border} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No completed books yet
                </Text>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: theme.border,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  userTag: {
    fontSize: 15,
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  actionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  booksSection: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  booksList: {
    padding: 20,
    gap: 12,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 12,
  },
  bookCover: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 13,
    marginBottom: 8,
  },
  bookFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    backgroundColor: theme.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyBooks: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
  },
});