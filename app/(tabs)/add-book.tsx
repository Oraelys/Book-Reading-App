import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Upload } from 'lucide-react-native';

export default function AddBookScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const pickDocument = async () => {
    try {
      setLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/epub+zip'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];

      const fileName = file.name;
      const fileSize = file.size || 0;
      const mimeType = file.mimeType || 'application/pdf';

      let fileUri = file.uri;

      if (Platform.OS === 'web') {
        fileUri = file.uri;
      } else {
        const fileInfo = await FileSystem.getInfoAsync(file.uri);
        if (!fileInfo.exists) {
          throw new Error('File does not exist');
        }
        fileUri = fileInfo.uri;
      }

      const { data, error } = await supabase
      .from('novels')
      .insert({
       user_id: user?.id,
       title: fileName.replace(/\.[^/.]+$/, ''),
       file_uri: fileUri,  // Changed from file_uri
       total_pages: 0,
       file_size: fileSize,      // Changed from file_size
       type: mimeType,      // Changed from mime_type
    })
       .select()
       .single();

      if (error) throw error;

      await supabase.from('reading_progress').insert({
        user_id: user?.id,
        book_id: data.id,
        current_page: 0,
        progress_percentage: 0,
      });

      setLoading(false);

      if (Platform.OS === 'web') {
        Alert.alert('Success', 'Book added successfully!');
      }

      router.push('/(tabs)');
    } 
    catch (error) {
      console.error('Error picking document:', error);
      setLoading(false);
      if (Platform.OS === 'web') {
        Alert.alert('Error', 'Failed to add book. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Upload size={64} color="#007AFF" />
        <Text style={styles.title}>Add a Book</Text>
        <Text style={styles.subtitle}>
          Select a PDF or EPUB file from your device
        </Text>

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

        <Text style={styles.hint}>
          Supported formats: PDF, EPUB
        </Text>
      </View>
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
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
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
