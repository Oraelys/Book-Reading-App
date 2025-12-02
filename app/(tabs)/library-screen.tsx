import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import { BookOpen, Trash2, Plus } from 'lucide-react-native';
import { getLocalBooks, saveLocalBook, deleteLocalBook } from '@/lib/localBooks';
import { useRouter, useFocusEffect } from 'expo-router';
import { LocalBook } from '@/lib/local-books-type';

// Dummy books for initial testing
const DUMMY_BOOKS: LocalBook[] = [
  {
    id: '1',
    title: 'Sample PDF',
    fileUri: 'file:///dummy/path/sample.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024,
    createdAt: new Date().toISOString(),
    progress: 0.2, // 20% read
  },
  {
    id: '2',
    title: 'Sample EPUB',
    fileUri: 'file:///dummy/path/sample.epub',
    mimeType: 'application/epub+zip',
    fileSize: 2048,
    createdAt: new Date().toISOString(),
    progress: 0.6, // 60% read
  },
];

export default function LibraryWithAddBook() {
  const router = useRouter();
  const [books, setBooks] = useState<LocalBook[]>([]);
  const [loading, setLoading] = useState(true);
 

  // Load books from storage or initialize with dummy data
  const loadBooks = async () => {
    let storedBooks = await getLocalBooks();
    if (!storedBooks || storedBooks.length === 0) {
      // Initialize with dummy books
      for (let book of DUMMY_BOOKS) {
        await saveLocalBook(book);
      }
      storedBooks = DUMMY_BOOKS;
    }
    setBooks(storedBooks);
    setLoading(false);
  };

  useFocusEffect(() => {
    loadBooks();
  });

  // Pick a file without making a copy
  const pickDocument = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/epub+zip', 'text/plain'],
        copyToCacheDirectory: false, // Do not copy
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];

      const book: LocalBook = {
        id: Crypto.randomUUID(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        fileUri: file.uri, // Use original location
        mimeType: file.mimeType || 'application/pdf',
        fileSize: file.size ?? 0,
        createdAt: new Date().toISOString(),
        progress: 0, // Start at 0% read
      };

      await saveLocalBook(book);
      await loadBooks();

      Alert.alert('Success', 'Book added to library!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Unable to add book.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteLocalBook(id);
    loadBooks();
  };

  const handleOpenBook = (book: LocalBook) => {
    // Navigate to your reader screen and pass URI and progress
    router.push(`/reader?bookId=${book.id}`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>My Library</Text>

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.bookCard} onPress={() => handleOpenBook(item)}>
            <View style={styles.bookCover}>
              <BookOpen size={40} color="#666" />
            </View>

            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>{item.title}</Text>
              <Text style={styles.count}>
                {item.mimeType} | {Math.round((item.progress ?? 0) * 100)}% read
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { flex: item.progress ?? 0 },
                  ]}
                />
                <View
                  style={[
                    styles.progressEmpty,
                    { flex: 1 - (item.progress ?? 0) },
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Trash2 size={20} color="#ff3b30" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={pickDocument}>
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 28, fontWeight: '700', marginVertical: 16 },
  bookCard: {
    flexDirection: 'row',
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    alignItems: 'center',
  },
  bookCover: {
    width: 60,
    height: 80,
    backgroundColor: '#e9e9e9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  count: { fontSize: 12, color: '#666' },
  progressBar: {
    flexDirection: 'row',
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginTop: 6,
  },
  progressFill: { backgroundColor: '#007AFF', borderRadius: 3 },
  progressEmpty: { backgroundColor: '#e0e0e0', borderRadius: 3 },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});
