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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { BookWithProgress } from '@/types/database';
import { BookOpen, LogOut } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [recentBooks, setRecentBooks] = useState<BookWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecentBooks();
  }, []);

  const loadRecentBooks = async () => {
    if (!user) return;

    try {
      const { data: booksData, error: booksError } = await supabase
        .from('novels')
        .select('*')
        .eq('user_id', user.id)
        .order('last_opened', { ascending: false, nullsFirst: false })
        .limit(5);

      if (booksError) throw booksError;

      if (booksData && booksData.length > 0) {
        const bookIds = booksData.map((book) => book.id);

        const { data: progressData, error: progressError } = await supabase
          .from('reading_progress')
          .select('*')
          .in('book_id', bookIds);

        if (progressError) throw progressError;

        const booksWithProgress = booksData.map((book) => ({
          ...book,
          reading_progress: progressData?.find((p) => p.book_id === book.id),
        }));

        setRecentBooks(booksWithProgress);
      } else {
        setRecentBooks([]);
      }
    } catch (error) {
      console.error('Error loading recent books:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentBooks();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const renderBookItem = ({ item }: { item: BookWithProgress }) => (
    
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => router.push(`/reader?bookId=${item.id}`)}
    >
      <View style={styles.bookCover}>
        {item.cover_image ? (
          <Image source={{ uri: item.cover_image }} style={styles.coverImage} />
        ) : (
          <BookOpen size={40} color="#666" />
        )}
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.author && (
          <Text style={styles.bookAuthor} numberOfLines={1}>
            {item.author}
          </Text>
        )}
        {item.reading_progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${item.reading_progress.progress_percentage}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(item.reading_progress.progress_percentage)}%
            </Text>
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
    
    <View style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
          <LogOut size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {recentBooks.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <BookOpen size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No books yet</Text>
              <Text style={styles.emptyText}>
                Add your first book to start reading
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
              colors={['#007AFF']}
            />
          }
        />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Continue Reading</Text>
          <FlatList
            data={recentBooks}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#007AFF"
                colors={['#007AFF']}
              />
            }
          />
        </>
      )}
      </SafeAreaView >
    </View>
    
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
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  bookCard: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  bookCover: {
    width: 80,
    height: 100,
    backgroundColor: '#e9e9e9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    width: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});