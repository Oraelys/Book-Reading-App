// app/(tabs)/create-novel.tsx - Updated with theme support
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
import { useTheme } from '@/contexts/ThemeContexts';
import { supabase } from '@/lib/supabase';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, Image as ImageIcon } from 'lucide-react-native';

export default function CreateNovelScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const styles = getStyles(theme, isDark);

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
                <ImageIcon size={48} color={theme.textSecondary} />
                <Text style={styles.imagePlaceholderText}>
                  Tap to add cover image
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Novel Title"
            placeholderTextColor={theme.placeholder}
            value={title}
            onChangeText={setTitle}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="Author Name"
            placeholderTextColor={theme.placeholder}
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

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.text,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  note: {
    fontSize: 13,
    color: theme.textSecondary,
    fontStyle: 'italic',
    marginBottom: 24,
    opacity: 0.7,
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
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  imagePlaceholderText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: theme.surface,
    color: theme.text,
  },
  button: {
    backgroundColor: theme.primary,
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
    color: theme.primary,
    fontSize: 16,
  },
  error: {
    color: theme.error,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
});