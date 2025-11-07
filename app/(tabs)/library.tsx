import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { BookWithProgress } from '@/types/database';
import { BookOpen, Trash2 } from 'lucide-react-native';

export default function LibraryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [books, setBooks] = useState<BookWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    if (!user) return;

    try {
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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

        setBooks(booksWithProgress);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to delete this book?')) {
        await deleteBook(bookId);
      }
    } else {
      Alert.alert(
        'Delete Book',
        'Are you sure you want to delete this book?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteBook(bookId),
          },
        ]
      );
    }
  };

  const deleteBook = async (bookId: string) => {
    try {
      const { error } = await supabase.from('books').delete().eq('id', bookId);

      if (error) throw error;

      setBooks((prev) => prev.filter((book) => book.id !== bookId));
    } catch (error) {
      console.error('Error deleting book:', error);
    }
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
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteBook(item.id)}
      >
        <Trash2 size={20} color="#ff3b30" />
      </TouchableOpacity>
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
      <View style={styles.header}>
        <Text style={styles.title}>My Library</Text>
        <Text style={styles.count}>
          {books.length} {books.length === 1 ? 'book' : 'books'}
        </Text>
      </View>

      {books.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BookOpen size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>Your library is empty</Text>
          <Text style={styles.emptyText}>
            Add books to start building your collection
          </Text>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBookItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  count: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
