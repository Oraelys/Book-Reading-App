import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, Image as ImageIcon } from 'lucide-react-native';

export default function CreateNovelScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickCoverImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCoverImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Failed to pick image');
    }
  };

  const handleCreateNovel = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!author.trim()) {
      setError('Please enter an author name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: insertError } = await supabase
        .from('books')
        .insert({
          user_id: user?.id,
          title: title.trim(),
          author: author.trim(),
          file_uri: '',
          total_pages: 0,
          file_size: 0,
          mime_type: 'text/novel',
          cover_image: coverImage || '',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await supabase.from('reading_progress').insert({
        user_id: user?.id,
        book_id: data.id,
        current_page: 0,
        progress_percentage: 0,
      });

      setLoading(false);

      if (Platform.OS === 'web') {
        alert('Novel created successfully!');
      } else {
        Alert.alert('Success', 'Novel created successfully!');
      }

      router.push('/(tabs)');
    } catch (error) {
      console.error('Error creating novel:', error);
      setError('Failed to create novel. Please try again.');
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create a Novel</Text>
        <Text style={styles.subtitle}>Add your own story to your library</Text>
        <Text style={styles.note}>Note: Cover images are stored locally and may not sync across devices</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.form}>
          <TouchableOpacity
            style={styles.imagePickerContainer}
            onPress={pickCoverImage}
          >
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={styles.coverPreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImageIcon size={48} color="#666" />
                <Text style={styles.imagePlaceholderText}>
                  Tap to add cover image
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Novel Title"
            value={title}
            onChangeText={setTitle}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Author Name"
            value={author}
            onChangeText={setAuthor}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCreateNovel}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Novel</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  note: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  imagePickerContainer: {
    width: '100%',
    height: 300,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  imagePlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  error: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
});
