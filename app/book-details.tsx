// app/book-details.tsx - Updated with theme support
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Eye, Book, MessageCircle, Play } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';

interface BookDetails {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  cover_image_url: string;
  rating: number;
  total_ratings: number;
  views: number;
  total_pages: number;
  file_url: string | null;
}

interface ReadingProgress {
  progress_percentage: number;
  current_page: number;
}

export default function BookDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookId = params.bookId as string;
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInLibrary, setIsInLibrary] = useState(false);

  const styles = getStyles(theme, isDark);

  useEffect(() => {
    if (bookId) {
      loadBookDetails();
    } else {
      setLoading(false);
    }
  }, [bookId]);

  const loadBookDetails = async () => {
    if (!bookId || !user) return;

    try {
      const { data: bookData, error: bookError } = await supabase
        .from('novels')
        .select('*')
        .eq('id', bookId)
        .single();

      if (bookError) throw bookError;
      setBook(bookData);

      const { data: progressData } = await supabase
        .from('reading_progress')
        .select('progress_percentage, current_page')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .single();

      if (progressData) {
        setProgress(progressData);
        setIsInLibrary(true);
      }

    } catch (error) {
      console.error('Error loading book details:', error);
      Alert.alert('Error', 'Failed to load book details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = async () => {
    if (!user || !book) return;

    try {
      const { error } = await supabase
        .from('reading_progress')
        .insert({
          user_id: user.id,
          book_id: book.id,
          current_page: 0,
          progress_percentage: 0,
        });

      if (error) throw error;

      setIsInLibrary(true);
      Alert.alert('Success', 'Book added to your library!');
    } catch (error) {
      console.error('Error adding to library:', error);
      Alert.alert('Error', 'Failed to add book to library');
    }
  };

  const handleStartReading = () => {
    if (!book) return;
    
    if (!isInLibrary) {
      Alert.alert(
        'Add to Library',
        'Add this book to your library to start reading?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add & Read',
            onPress: async () => {
              await handleAddToLibrary();
              router.push(`/reader?bookId=${book.id}`);
            },
          },
        ]
      );
    } else {
      router.push(`/reader?bookId=${book.id}`);
    }
  };

  const handleViewComments = () => {
    if (!book) return;
    router.push({
      pathname: '/book-comments',
      params: { bookId: book.id, bookTitle: book.title },
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Book not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Book Cover & Info */}
        <View style={styles.bookHeader}>
          <Image
            source={{ uri: book.cover_image_url }}
            style={styles.coverImage}
            defaultSource={require('@/assets/images/book-placeholder.png')}
          />
          <View style={styles.bookHeaderInfo}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>{book.author}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Star size={16} color="#FFD700" fill="#FFD700" />
                <Text style={styles.statText}>
                  {book.rating.toFixed(1)} ({book.total_ratings})
                </Text>
              </View>
              <View style={styles.statItem}>
                <Eye size={16} color={theme.textSecondary} />
                <Text style={styles.statText}>{book.views} views</Text>
              </View>
            </View>

            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>{book.category}</Text>
            </View>
          </View>
        </View>

        {/* Progress Card */}
        {isInLibrary && progress && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressPercentage}>
                {Math.round(progress.progress_percentage)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress.progress_percentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Page {progress.current_page} of {book.total_pages}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartReading}
          >
            <Play size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>
              {isInLibrary ? 'Continue Reading' : 'Start Reading'}
            </Text>
          </TouchableOpacity>

          {!isInLibrary && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleAddToLibrary}
            >
              <Book size={20} color={theme.primary} />
              <Text style={styles.secondaryButtonText}>Add to Library</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleViewComments}
          >
            <MessageCircle size={20} color={theme.primary} />
            <Text style={styles.secondaryButtonText}>Comments</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this book</Text>
          <Text style={styles.description}>{book.description}</Text>
        </View>

        {/* Book Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Book Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Author</Text>
            <Text style={styles.infoValue}>{book.author}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{book.category}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pages</Text>
            <Text style={styles.infoValue}>{book.total_pages}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rating</Text>
            <Text style={styles.infoValue}>
              {book.rating.toFixed(1)} ({book.total_ratings} ratings)
            </Text>
          </View>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 8,
  },
  bookHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  coverImage: {
    width: 200,
    height: 300,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bookHeaderInfo: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  categoryContainer: {
    backgroundColor: theme.primary + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  progressCard: {
    marginHorizontal: 24,
    padding: 20,
    backgroundColor: theme.surface,
    borderRadius: 16,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.border,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  actionContainer: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: theme.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  errorText: {
    fontSize: 18,
    color: theme.textSecondary,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});