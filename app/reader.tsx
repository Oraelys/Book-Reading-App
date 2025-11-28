import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Book, ReadingProgress } from '@/types/database';
import { ArrowLeft, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReaderScreen() {
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages] = useState(100);

  useEffect(() => {
    loadBook();
  }, [bookId]);

  const loadBook = async () => {
    if (!bookId || !user) return;

    try {
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (bookError) throw bookError;
      if (!bookData) {
        router.back();
        return;
      }

      setBook(bookData);

      const { data: progressData, error: progressError } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (progressError) throw progressError;

      if (progressData) {
        setProgress(progressData);
        setCurrentPage(progressData.current_page);
      }

      await supabase
        .from('books')
        .update({ last_opened_at: new Date().toISOString() })
        .eq('id', bookId);
    } catch (error) {
      console.error('Error loading book:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (page: number) => {
    if (!bookId || !user) return;

    const percentage = (page / totalPages) * 100;

    try {
      const { error } = await supabase
        .from('reading_progress')
        .upsert({
          user_id: user.id,
          book_id: bookId,
          current_page: page,
          progress_percentage: percentage,
          last_read_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      updateProgress(newPage);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      updateProgress(newPage);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.centerContainer}>
        <Text>Book not found</Text>
      </View>
    );
  }

  const progressPercentage = (currentPage / totalPages) * 100;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push(`/book-comments?bookId=${bookId}&bookTitle=${encodeURIComponent(book.title)}`)}
          style={styles.commentsButton}
        >
          <MessageCircle size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageContent}>
          This is page {currentPage} of {book.title}.
          {'\n\n'}
          In a real implementation, this would display the actual content from the
          PDF or EPUB file. You would use a library like react-native-pdf or
          @epubjs-react-native/core to render the actual book content.
          {'\n\n'}
          For now, this is a placeholder to demonstrate the reading interface and
          progress tracking functionality.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPercentage}%` },
            ]}
          />
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={handlePreviousPage}
            disabled={currentPage === 0}
            style={[
              styles.controlButton,
              currentPage === 0 && styles.controlButtonDisabled,
            ]}
          >
            <ChevronLeft
              size={24}
              color={currentPage === 0 ? '#ccc' : '#007AFF'}
            />
            <Text
              style={[
                styles.controlText,
                currentPage === 0 && styles.controlTextDisabled,
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNextPage}
            disabled={currentPage >= totalPages}
            style={[
              styles.controlButton,
              currentPage >= totalPages && styles.controlButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.controlText,
                currentPage >= totalPages && styles.controlTextDisabled,
              ]}
            >
              Next
            </Text>
            <ChevronRight
              size={24}
              color={currentPage >= totalPages ? '#ccc' : '#007AFF'}
            />
          </TouchableOpacity>
        </View>
      </View>
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
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  commentsButton: {
    padding: 8,
    marginLeft: 12,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pageInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  pageContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1a1a1a',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  controlButtonDisabled: {
    opacity: 0.4,
  },
  controlText: {
    fontSize: 16,
    color: '#007AFF',
    marginHorizontal: 4,
  },
  controlTextDisabled: {
    color: '#ccc',
  },
});
