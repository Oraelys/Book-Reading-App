import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Upload } from 'lucide-react-native';
import { saveLocalBook } from '@/lib/localBooks';
import * as Crypto from 'expo-crypto';

export default function AddBookScreen() {
  const [loading, setLoading] = useState(false);

  const pickDocument = async () => {
    try {
      setLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/epub+zip', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];

      // Safe fallback for TypeScript autocomplete issues
      const cacheDir =
        (FileSystem as any).cacheDirectory ?? FileSystem.documentDirectory;

      const folder = cacheDir + 'books/';

      const folderInfo = await FileSystem.getInfoAsync(folder);

      if (!folderInfo.exists) {
        await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
      }

      const newUri = folder + file.name;

      // Copy file into books folder
      await FileSystem.copyAsync({
        from: file.uri,
        to: newUri,
      });

      // Create book object
      const book = {
        id: Crypto.randomUUID(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        fileUri: newUri,
        mimeType: file.mimeType || 'application/pdf',
        fileSize: file.size ?? 0,
        createdAt: new Date().toISOString(),
      };

      // Save to storage
      await saveLocalBook(book);

      Alert.alert('Success', 'Book added to library!');
      setLoading(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Unable to add book.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Upload size={64} color="#007AFF" />
          <Text style={styles.title}>Add a Book</Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={pickDocument}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Choose File</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>PDF, EPUB & TXT supported</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 8,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 16,
  },
});
