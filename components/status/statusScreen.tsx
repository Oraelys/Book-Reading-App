// /components/status/StatusScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  KeyboardAvoidingView,
  TextInput,
  Platform,
} from 'react-native';

import { Camera, Heart, Share2, X, Send } from 'lucide-react-native';

import { statusStyles } from '@/styles/statusStyles';
import { mockStatuses, mockUser } from '../../data/mockData';

interface StatusScreenProps {}

export const StatusScreen: React.FC<StatusScreenProps> = () => {
  const [statuses, setStatuses] = useState(mockStatuses);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [creating, setCreating] = useState(false);
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const progress = useRef(new Animated.Value(0)).current;

  /** Start progress when viewer is opened */
  useEffect(() => {
    if (viewerOpen) {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) goNext();
      });
    }
  }, [viewerOpen, currentIndex]);

  const openViewer = (index: number) => {
    setCurrentIndex(index);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setCurrentIndex(0);
    progress.stopAnimation();
  };

  const goNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      closeViewer();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  /** Create a new status */
  const postStatus = () => {
    if (!caption.trim()) return;

    const newStatus = {
      id: Date.now().toString(),
      user_id: mockUser.id,
      user_name: mockUser.name,
      avatar: mockUser.avatar,
      media_url: imageUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400',
      caption: caption.trim(),
      created_at: new Date().toISOString(),
      views: 0,
    };

    setStatuses([newStatus, ...statuses]);
    setCaption('');
    setImageUrl('');
    setCreating(false);
  };

  const formatTime = (t: string) => {
    const d = new Date(t);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;

    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const activeStatus = statuses[currentIndex];

  /** VIEWER MODE */
  if (viewerOpen && activeStatus) {
    return (
      <View style={statusStyles.viewerContainer}>
        <Image source={{ uri: activeStatus.media_url }} style={statusStyles.viewerImage} />

        <View style={statusStyles.viewerOverlay}>
          <SafeAreaView>
            {/* Progress bars */}
            <View style={statusStyles.progressRow}>
              {statuses.map((_, i) => (
                <View key={i} style={statusStyles.progressBar}>
                  <Animated.View
                    style={[
                      statusStyles.progressFill,
                      {
                        width:
                          i < currentIndex
                            ? '100%'
                            : i > currentIndex
                            ? '0%'
                            : progress.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                              }),
                      },
                    ]}
                  />
                </View>
              ))}
            </View>

            {/* Viewer Header */}
            <View style={statusStyles.viewerHeader}>
              <View style={statusStyles.viewerUserInfo}>
                <Image source={{ uri: activeStatus.avatar }} style={statusStyles.viewerAvatar} />

                <View>
                  <Text style={statusStyles.viewerUsername}>{activeStatus.user_name}</Text>
                  <Text style={statusStyles.viewerTime}>{formatTime(activeStatus.created_at)}</Text>
                </View>
              </View>

              <TouchableOpacity onPress={closeViewer}>
                <X size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Left / Right tap areas */}
          <TouchableOpacity style={statusStyles.tapLeft} onPress={goPrev} activeOpacity={1} />
          <TouchableOpacity style={statusStyles.tapRight} onPress={goNext} activeOpacity={1} />

          {/* Caption + actions */}
          <View style={statusStyles.viewerFooter}>
            <Text style={statusStyles.viewerCaption}>{activeStatus.caption}</Text>

            <View style={statusStyles.viewerActions}>
              <Heart size={26} color="#fff" />
              <Share2 size={26} color="#fff" />
            </View>
          </View>
        </View>
      </View>
    );
  }

  /** CREATE STATUS MODE */
  if (creating) {
    return (
      <KeyboardAvoidingView
        style={statusStyles.createContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Image
          source={{
            uri: imageUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400',
          }}
          style={statusStyles.createBackground}
        />

        <View style={statusStyles.darkOverlay} />

        <SafeAreaView style={statusStyles.createHeaderRow}>
          <TouchableOpacity onPress={() => setCreating(false)}>
            <X size={28} color="#fff" />
          </TouchableOpacity>

          <View style={statusStyles.createUserInfoRow}>
            <Image source={{ uri: mockUser.avatar }} style={statusStyles.createUserAvatar} />
            <Text style={statusStyles.createUserName}>{mockUser.name}</Text>
          </View>
        </SafeAreaView>

        <View style={statusStyles.createInputRow}>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Type a status..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            multiline
            maxLength={1000}
            style={statusStyles.captionInput}
          />

          <TouchableOpacity
            style={statusStyles.imageButton}
            onPress={() => {
              const url = prompt('Enter an image URL') || '';
              setImageUrl(url);
            }}
          >
            <Camera size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[statusStyles.postButton, !caption.trim() && statusStyles.postDisabled]}
          disabled={!caption.trim()}
          onPress={postStatus}
        >
          <Send size={24} color="#fff" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  /** MAIN STATUS LIST */
  return (
    <View style={statusStyles.container}>
      <ScrollView contentContainerStyle={statusStyles.scrollArea}>
        <View style={statusStyles.header}>
          <Text style={statusStyles.headerTitle}>Status Updates</Text>
        </View>

        {/* My Status */}
        <TouchableOpacity style={statusStyles.myStatus} onPress={() => setCreating(true)}>
          <View style={statusStyles.myStatusIconCircle}>
            <Camera size={24} color="#34C759" />
          </View>

          <View style={statusStyles.myStatusTextColumn}>
            <Text style={statusStyles.myStatusTitle}>My Status</Text>
            <Text style={statusStyles.myStatusSubtitle}>Tap to add status update</Text>
          </View>
        </TouchableOpacity>

        <Text style={statusStyles.sectionTitle}>Recent Updates</Text>

        {statuses.map((status, index) => (
          <TouchableOpacity
            key={status.id}
            style={statusStyles.statusRow}
            onPress={() => openViewer(index)}
          >
            <View style={statusStyles.avatarBorder}>
              <Image source={{ uri: status.avatar }} style={statusStyles.statusAvatar} />
            </View>

            <View style={statusStyles.statusInfo}>
              <Text style={statusStyles.statusName}>{status.user_name}</Text>
              <Text style={statusStyles.statusTime}>{formatTime(status.created_at)}</Text>
            </View>

            <Image source={{ uri: status.media_url }} style={statusStyles.thumbnail} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
