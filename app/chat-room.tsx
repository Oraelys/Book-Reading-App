// app/chat-room.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Image as ImageIcon, Video, MoreVertical } from 'lucide-react-native';
import { ChatService, ChatMessage } from '@/services/chatservices';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';

export default function ChatRoomScreen() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  const styles = getStyles(theme);

  useEffect(() => {
    if (roomId) {
      loadMessages();
      markAsRead();
      
      // Subscribe to new messages
      const channel = ChatService.subscribeToMessages(roomId, (newMessage) => {
        setMessages(prev => [...prev, newMessage]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      return () => {
        channel.unsubscribe();
      };
    }
  }, [roomId]);

  const loadMessages = async () => {
    if (!roomId) return;

    try {
      const messagesList = await ChatService.getRoomMessages(roomId);
      setMessages(messagesList);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!roomId) return;
    await ChatService.markRoomAsRead(roomId);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !roomId) return;

    setSending(true);
    const text = inputText.trim();
    setInputText('');

    try {
      await ChatService.sendMessage(roomId, text);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const handleSendImage = async () => {
    if (!roomId) return;

    setSending(true);
    try {
      await ChatService.sendImage(roomId);
    } catch (error) {
      console.error('Error sending image:', error);
      Alert.alert('Error', 'Failed to send image');
    } finally {
      setSending(false);
    }
  };

  const handleSendVideo = async () => {
    if (!roomId) return;

    setSending(true);
    try {
      await ChatService.sendVideo(roomId);
    } catch (error) {
      console.error('Error sending video:', error);
      Alert.alert('Error', 'Failed to send video');
    } finally {
      setSending(false);
    }
  };

  const handleMediaOptions = () => {
    Alert.alert(
      'Send Media',
      'Choose media type',
      [
        { text: 'Photo', onPress: handleSendImage },
        { text: 'Video', onPress: handleSendVideo },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.user_id === user?.id;

    return (
      <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
        {!isOwn && (
          <Image
            source={{ uri: item.profile?.avatar_url || 'https://via.placeholder.com/40' }}
            style={styles.messageAvatar}
          />
        )}

        <View style={[
          styles.messageBubble,
          isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther
        ]}>
          {!isOwn && (
            <Text style={[styles.senderName, { color: theme.primary }]}>
              {item.profile?.username || 'User'}
            </Text>
          )}

          {item.message_type === 'image' && item.media_url && (
            <Image
              source={{ uri: item.media_url }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}

          {item.message_type === 'video' && item.media_url && (
            <View style={styles.videoContainer}>
              <Image
                source={{ uri: item.media_thumbnail_url || item.media_url }}
                style={styles.messageImage}
                resizeMode="cover"
              />
              <View style={styles.playButton}>
                <Video size={32} color="#fff" />
              </View>
            </View>
          )}

          {item.message_text && (
            <Text style={[
              styles.messageText,
              isOwn ? styles.messageTextOwn : styles.messageTextOther
            ]}>
              {item.message_text}
            </Text>
          )}

          <Text style={[
            styles.messageTime,
            isOwn ? styles.messageTimeOwn : styles.messageTimeOther
          ]}>
            {formatTime(item.created_at)}
          </Text>
        </View>

        {isOwn && (
          <Image
            source={{ uri: user?.user_metadata?.avatar_url || 'https://via.placeholder.com/40' }}
            style={styles.messageAvatar}
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
            {roomInfo?.name || 'Chat'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Active now
          </Text>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.mediaButton, { backgroundColor: theme.background }]}
            onPress={handleMediaOptions}
            disabled={sending}
          >
            <ImageIcon size={24} color={theme.primary} />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.placeholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!sending}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? theme.primary : theme.border }
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: 16,
    padding: 12,
  },
  messageBubbleOwn: {
    backgroundColor: theme.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: theme.surface,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  videoContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: '#fff',
  },
  messageTextOther: {
    color: theme.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  messageTimeOwn: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageTimeOther: {
    color: theme.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  mediaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});