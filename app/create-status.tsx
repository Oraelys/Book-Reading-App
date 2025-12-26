// app/create-status.tsx - Functional Status Creation
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  TextInput,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContexts';
import { ChatService } from '@/services/chatservices';
import * as ImagePicker from 'expo-image-picker';

export default function CreateStatusScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [caption, setCaption] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [creating, setCreating] = useState(false);

  const styles = getStyles(theme);

  const pickMedia = async (type: 'image' | 'video') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'image' 
          ? ImagePicker.MediaTypeOptions.Images 
          : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 30,
      });

      if (!result.canceled && result.assets[0]) {
        setMediaUri(result.assets[0].uri);
        setMediaType(type);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const handlePost = async () => {
    if (!mediaUri || !mediaType) {
      Alert.alert('Error', 'Please select a photo or video');
      return;
    }

    if (!caption.trim()) {
      Alert.alert('Error', 'Please add a caption');
      return;
    }

    setCreating(true);
    try {
      await ChatService.createStatus(caption.trim(), mediaType);
      Alert.alert('Success', 'Status posted!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error creating status:', error);
      Alert.alert('Error', 'Failed to post status');
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Status</Text>
          <TouchableOpacity 
            onPress={handlePost}
            disabled={!mediaUri || !caption.trim() || creating}
            style={styles.postButton}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[
                styles.postButtonText,
                (!mediaUri || !caption.trim()) && styles.postButtonTextDisabled
              ]}>
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Media Preview or Picker */}
          {mediaUri ? (
            <View style={styles.mediaContainer}>
              <Image 
                source={{ uri: mediaUri }} 
                style={styles.mediaPreview}
                resizeMode="contain"
              />
              <TouchableOpacity 
                style={styles.removeMediaButton}
                onPress={() => {
                  setMediaUri(null);
                  setMediaType(null);
                }}
              >
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.mediaPickerContainer}>
              <TouchableOpacity 
                style={styles.mediaPickerButton}
                onPress={() => pickMedia('image')}
              >
                <Camera size={48} color="#fff" />
                <Text style={styles.mediaPickerText}>Add Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.mediaPickerButton}
                onPress={() => pickMedia('video')}
              >
                <Camera size={48} color="#fff" />
                <Text style={styles.mediaPickerText}>Add Video</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Caption Input */}
          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
              editable={!creating}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  postButton: {
    padding: 8,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a84ff',
  },
  postButtonTextDisabled: {
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    maxHeight: 500,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPickerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  mediaPickerButton: {
    alignItems: 'center',
    gap: 16,
  },
  mediaPickerText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  captionContainer: {
    marginTop: 16,
  },
  captionInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
});