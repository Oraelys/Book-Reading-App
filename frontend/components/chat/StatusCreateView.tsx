// components/StatusCreateView.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, X, Video as VideoIcon } from 'lucide-react-native';
import { ChatService } from '@/services/chatservices';
import * as ImagePicker from 'expo-image-picker';

interface StatusCreateViewProps {
  onBack: () => void;
  onPosted: () => void;
  styles: any;
}

export default function StatusCreateView({ onBack, onPosted, styles }: StatusCreateViewProps) {
  const [caption, setCaption] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [creating, setCreating] = useState(false);

  const canPost = useMemo(() => !!mediaUri && !!caption.trim(), [mediaUri, caption]);

  const pickMedia = useCallback(async (type: 'image' | 'video') => {
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
  }, []);

  const handlePickImage = useCallback(() => pickMedia('image'), [pickMedia]);
  const handlePickVideo = useCallback(() => pickMedia('video'), [pickMedia]);

  const handleRemoveMedia = useCallback(() => {
    setMediaUri(null);
    setMediaType(null);
  }, []);

  const handlePost = useCallback(async () => {
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
      Alert.alert('Success', 'Status posted!');
      onPosted();
    } catch (error) {
      console.error('Error creating status:', error);
      Alert.alert('Error', 'Failed to post status');
    } finally {
      setCreating(false);
    }
  }, [mediaUri, mediaType, caption, onPosted]);

  const postButtonTextStyle = useMemo(() => [
    styles.postButtonText,
    !canPost && styles.postButtonTextDisabled,
  ], [canPost, styles.postButtonText, styles.postButtonTextDisabled]);

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.statusHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.statusHeaderTitle}>Create Status</Text>
          <TouchableOpacity
            onPress={handlePost}
            disabled={!canPost || creating}
            style={styles.postButton}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={postButtonTextStyle}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.statusContent}>
          {mediaUri ? (
            <View style={styles.mediaContainer}>
              <Image
                source={{ uri: mediaUri }}
                style={styles.mediaPreview}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.removeMediaButton}
                onPress={handleRemoveMedia}
              >
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.mediaPickerContainer}>
              <TouchableOpacity style={styles.mediaPickerButton} onPress={handlePickImage}>
                <Camera size={48} color="#fff" />
                <Text style={styles.mediaPickerText}>Add Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaPickerButton} onPress={handlePickVideo}>
                <VideoIcon size={48} color="#fff" />
                <Text style={styles.mediaPickerText}>Add Video</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder="What's on your mind?"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={200}
              editable={!creating}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}