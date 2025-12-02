import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  PanResponder,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { getLocalBookById, saveLocalBook } from '@/lib/localBooks';
import { LocalBook } from '@/lib/local-books-type';

export default function ReaderScreen() {
  const router = useRouter();
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const [book, setBook] = useState<LocalBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileContent, setFileContent] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  
  // Swipe gesture handling
  const pan = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Load books from storage or initialize with dummy data
  const loadBooks = async () => {
    let storedBooks = await getLocalBookById(bookId);
    if (!storedBooks || storedBooks.length === 0) {
      // Initialize with dummy books
      for (let book of DUMMY_BOOKS) {
        await saveLocalBook(book);
      }
      storedBooks = DUMMY_BOOKS;
    }
    setBook(storedBooks);
    setLoading(false);
  };

  // Swipe gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Prevent swiping past boundaries
        if ((currentPage === 0 && gestureState.dx > 0) || 
            (currentPage >= pages.length - 1 && gestureState.dx < 0)) {
          return;
        }
        pan.setValue(gestureState.dx);
        
        // Fade effect during swipe
        const fadeValue = 1 - Math.abs(gestureState.dx) / 300;
        opacity.setValue(Math.max(0.3, fadeValue));
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = 75;
        
        if (gestureState.dx > swipeThreshold && currentPage > 0) {
          // Swipe right - previous page
          animatePageChange(() => handlePreviousPage());
        } else if (gestureState.dx < -swipeThreshold && currentPage < pages.length - 1) {
          // Swipe left - next page
          animatePageChange(() => handleNextPage());
        } else {
          // Reset if swipe wasn't strong enough
          Animated.parallel([
            Animated.spring(pan, {
              toValue: 0,
              useNativeDriver: true,
              friction: 8,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const animatePageChange = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(pan, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      opacity.setValue(1);
    });
  };

  // Load book and read file content
  useEffect(() => {
    loadBookAndContent();
  }, [bookId]);

  const loadBookAndContent = async () => {
    if (!bookId) {
      console.log('No bookId provided');
      setError('No book ID provided');
      setLoading(false);
      return;
    }

    try {
      console.log('Loading book with ID:', bookId);
      
      // Get book metadata from storage
      const bookData = await getLocalBookById(bookId);
      
      if (!bookData) {
        console.log('Book not found with ID:', bookId);
        setError('Book not found in library');
        setLoading(false);
        return;
      }

      console.log('Book found:', bookData.title);
      console.log('File URI:', bookData.fileUri);
      setBook(bookData);

      // Read file content directly from device
      await readFileContent(bookData);
      
    } catch (error) {
      console.error('Error loading book:', error);
      // setError(`Error loading book: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const readFileContent = async (bookData: LocalBook) => {
    try {
      const { fileUri, mimeType } = bookData;

      console.log('Reading file from:', fileUri);

      // Handle different file types
      if (mimeType === 'text/plain' || fileUri.endsWith('.txt')) {
        // Read text files directly using fetch for content:// URIs
        let content: string;
        
        if (fileUri.startsWith('content://')) {
          // For Android content URIs, use fetch
          const response = await fetch(fileUri);
          content = await response.text();
        } else if (fileUri.startsWith('file://')) {
          // For file:// URIs, use fetch
          const response = await fetch(fileUri);
          content = await response.text();
        } else {
          // Fallback: try fetch anyway
          const response = await fetch(fileUri);
          content = await response.text();
        }
        
        console.log('File content length:', content.length);
        
        // Split into pages (roughly 1000 characters per page)
        const pagesArray = splitIntoPages(content, 1000);
        setPages(pagesArray);
        setFileContent(content);
        
        // Set current page based on saved progress AFTER pages are set
        const startPage = bookData.progress 
          ? Math.round(bookData.progress * pagesArray.length)
          : 0;
        setCurrentPage(Math.min(startPage, pagesArray.length - 1));
        
      } else if (mimeType === 'application/pdf' || fileUri.endsWith('.pdf')) {
        // For PDF files
        const pdfPages = [
          'PDF Preview', 
          'This is a PDF file. PDF rendering requires react-native-pdf library.', 
          'Install: npm install react-native-pdf', 
          'Then implement proper PDF rendering.',
          '',
          'File location: ' + fileUri
        ];
        setPages(pdfPages);
        setFileContent('PDF file loaded from: ' + fileUri);
        
        const startPage = bookData.progress 
          ? Math.round(bookData.progress * pdfPages.length)
          : 0;
        setCurrentPage(Math.min(startPage, pdfPages.length - 1));
        
      } else if (mimeType === 'application/epub+zip' || fileUri.endsWith('.epub')) {
        // For EPUB files
        const epubPages = [
          'EPUB Preview', 
          'This is an EPUB file. EPUB rendering requires @epubjs-react-native/core library.', 
          'Install: npm install @epubjs-react-native/core', 
          'Then implement proper EPUB rendering.',
          '',
          'File location: ' + fileUri
        ];
        setPages(epubPages);
        setFileContent('EPUB file loaded from: ' + fileUri);
        
        const startPage = bookData.progress 
          ? Math.round(bookData.progress * epubPages.length)
          : 0;
        setCurrentPage(Math.min(startPage, epubPages.length - 1));
        
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

    } catch (error) {
      console.error('Error reading file:', error);
      
      if (error.message?.includes('no longer exists') || error.message?.includes('not found')) {
        Alert.alert(
          'File Not Found',
          'The original file has been moved or deleted. Please re-add it to your library.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else if (error.message?.includes('Failed to fetch')) {
        Alert.alert(
          'File Access Error',
          'Unable to access the file. It may have been moved or you may need to grant permissions.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
      
      throw error;
    }
  };

  const splitIntoPages = (text: string, charsPerPage: number): string[] => {
    const pages = [];
    for (let i = 0; i < text.length; i += charsPerPage) {
      pages.push(text.substring(i, i + charsPerPage));
    }
    return pages.length > 0 ? pages : [''];
  };

  const updateProgress = async (page: number) => {
    if (!book || pages.length === 0) return;
    
    const progress = page / pages.length;
    const updatedBook = { ...book, progress };
    
    setBook(updatedBook);
    setCurrentPage(page);
    
    try {
      await saveLocalBook(updatedBook);
      console.log('Progress saved:', { page, progress: Math.round(progress * 100) + '%' });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pages.length - 1) {
      updateProgress(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      updateProgress(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading book...</Text>
      </View>
    );
  }

  if (error || !book) {
    return (
      <SafeAreaView style={styles.centerContainer} edges={['top']}>
        <Text style={styles.errorTitle}>📚 Book Not Found</Text>
        <Text style={styles.errorText}>
          {error || 'The book you\'re looking for doesn\'t exist or has been deleted.'}
        </Text>
        <TouchableOpacity 
          style={styles.backToLibraryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backToLibraryText}>Back to Library</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalPages = pages.length;
  const progressPercentage = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

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
              Page {currentPage + 1} of {totalPages}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={{
              opacity: opacity,
              transform: [{ translateX: pan }],
            }}
            {...panResponder.panHandlers}
          >
            <Text style={styles.pageContent}>
              {pages[currentPage] || 'Content not available'}
            </Text>
          </Animated.View>
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

          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {Math.round(progressPercentage)}% complete
            </Text>
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

            <Text style={styles.pageCounter}>
              {currentPage + 1} / {totalPages}
            </Text>

            <TouchableOpacity
              onPress={handleNextPage}
              disabled={currentPage >= totalPages - 1}
              style={[
                styles.controlButton,
                currentPage >= totalPages - 1 && styles.controlButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.controlText,
                  currentPage >= totalPages - 1 && styles.controlTextDisabled,
                ]}
              >
                Next
              </Text>
              <ChevronRight
                size={24}
                color={currentPage >= totalPages - 1 ? '#ccc' : '#007AFF'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
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
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  backToLibraryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToLibraryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  placeholder: {
    width: 40,
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
    lineHeight: 28,
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
  progressInfo: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
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
  pageCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});