import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { getLocalBooks, saveLocalBook } from '@/lib/localBooks';
import { LocalBook } from '@/lib/local-books-type';

export default function ReaderScreen() {
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [book, setBook] = useState<LocalBook | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages] = useState(100); // Placeholder for demo

  // Load book and progress
  useEffect(() => {
    const loadBook = async () => {
      if (!bookId) return;
      const books = await getLocalBooks();
      const selected = books.find((b) => b.id === bookId);
      if (!selected) {
        router.back();
        return;
      }
      setBook(selected);
      setCurrentPage(selected.progress ? Math.round(selected.progress * totalPages) : 0);
    };
    loadBook();
  }, [bookId]);

  const updateProgress = async (page: number) => {
    if (!book) return;
    const progress = page / totalPages;
    const updatedBook = { ...book, progress };
    setBook(updatedBook);
    setCurrentPage(page);
    await saveLocalBook(updatedBook); // Save progress
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) updateProgress(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) updateProgress(currentPage - 1);
  };

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
            <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
            <Text style={styles.pageInfo}>Page {currentPage} of {totalPages}</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageContent}>
            This is page {currentPage} of {book.title}.
            {'\n\n'}
            Actual content would display PDF/EPUB/TXT content here.
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={handlePreviousPage}
              disabled={currentPage === 0}
              style={[styles.controlButton, currentPage === 0 && styles.controlButtonDisabled]}
            >
              <ChevronLeft size={24} color={currentPage === 0 ? '#ccc' : '#007AFF'} />
              <Text style={[styles.controlText, currentPage === 0 && styles.controlTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNextPage}
              disabled={currentPage >= totalPages}
              style={[styles.controlButton, currentPage >= totalPages && styles.controlButtonDisabled]}
            >
              <Text style={[styles.controlText, currentPage >= totalPages && styles.controlTextDisabled]}>
                Next
              </Text>
              <ChevronRight size={24} color={currentPage >= totalPages ? '#ccc' : '#007AFF'} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { padding: 8, marginRight: 12 },
  headerInfo: { flex: 1 },
  bookTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  pageInfo: { fontSize: 12, color: '#666', marginTop: 2 },
  content: { flex: 1, paddingHorizontal: 24, paddingVertical: 32 },
  pageContent: { fontSize: 16, lineHeight: 24, color: '#1a1a1a' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  progressBar: { height: 4, backgroundColor: '#e0e0e0' },
  progressFill: { height: '100%', backgroundColor: '#007AFF' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16 },
  controlButton: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  controlButtonDisabled: { opacity: 0.4 },
  controlText: { fontSize: 16, color: '#007AFF', marginHorizontal: 4 },
  controlTextDisabled: { color: '#ccc' },
});
