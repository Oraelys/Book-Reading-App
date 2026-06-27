// components/ChatView.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Image as ImageIcon, MoreVertical } from 'lucide-react-native';
import { ChatService, ChatMessage, ChatRoom } from '@/services/chatservices';
import MessageItem from './MessageItem';

interface ChatViewProps {
  activeRoomId: string;
  activeRoom: ChatRoom | undefined;
  currentUserId: string | undefined;
  ownAvatarUrl: string;
  onBack: () => void;
  theme: any;
  styles: any;
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
};

export default function ChatView({
  activeRoomId,
  activeRoom,
  currentUserId,
  ownAvatarUrl,
  onBack,
  theme,
  styles,
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const displayName = useMemo(() => {
    if (!activeRoom) return 'Chat';
    const otherMember = activeRoom.members?.find(m => m.user_id !== currentUserId);
    return activeRoom.room_type === 'direct'
      ? otherMember?.profile?.username || 'Unknown'
      : activeRoom.name || 'Chat';
  }, [activeRoom, currentUserId]);

  useEffect(() => {
    const load = async () => {
      try {
        const messagesList = await ChatService.getRoomMessages(activeRoomId);
        setMessages(messagesList);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    load();
    ChatService.markRoomAsRead(activeRoomId);

    const channel = ChatService.subscribeToMessages(activeRoomId, (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [activeRoomId]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim()) return;

    setSending(true);
    const text = inputText.trim();
    setInputText('');

    try {
      await ChatService.sendMessage(activeRoomId, text);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setInputText(text);
    } finally {
      setSending(false);
    }
  }, [inputText, activeRoomId]);

  const handleSendImage = useCallback(async () => {
    setSending(true);
    try {
      await ChatService.sendImage(activeRoomId);
    } catch (error) {
      console.error('Error sending image:', error);
      Alert.alert('Error', 'Failed to send image');
    } finally {
      setSending(false);
    }
  }, [activeRoomId]);

  const handleSendVideo = useCallback(async () => {
    setSending(true);
    try {
      await ChatService.sendVideo(activeRoomId);
    } catch (error) {
      console.error('Error sending video:', error);
      Alert.alert('Error', 'Failed to send video');
    } finally {
      setSending(false);
    }
  }, [activeRoomId]);

  const handleMediaOptions = useCallback(() => {
    Alert.alert('Send Media', 'Choose media type', [
      { text: 'Photo', onPress: handleSendImage },
      { text: 'Video', onPress: handleSendVideo },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [handleSendImage, handleSendVideo]);

  const handleContentSizeChange = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: false });
  }, []);

  const sendButtonStyle = useMemo(() => [
    styles.sendButton,
    { backgroundColor: inputText.trim() ? theme.primary : theme.border },
  ], [inputText, theme.primary, theme.border, styles.sendButton]);

  const inputContainerStyle = useMemo(() => [
    styles.inputContainer,
    {
      backgroundColor: theme.surface,
      borderTopColor: theme.border,
      marginBottom: keyboardHeight > 0 ? keyboardHeight : 0,
    },
  ], [theme.surface, theme.border, keyboardHeight, styles.inputContainer]);

  const mediaButtonStyle = useMemo(() => [
    styles.mediaButton,
    { backgroundColor: theme.background },
  ], [theme.background, styles.mediaButton]);

  const inputStyle = useMemo(() => [
    styles.input,
    { color: theme.text, backgroundColor: theme.background },
  ], [theme.text, theme.background, styles.input]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => (
    <MessageItem
      item={item}
      isOwn={item.user_id === currentUserId}
      ownAvatarUrl={ownAvatarUrl}
      primaryColor={theme.primary}
      textColor={theme.text}
      textSecondaryColor={theme.textSecondary}
      surfaceColor={theme.surface}
      styles={styles}
      formatTime={formatTime}
    />
  ), [currentUserId, ownAvatarUrl, theme, styles]);

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Active now
            </Text>
          </View>

          <TouchableOpacity style={styles.moreButton}>
            <MoreVertical size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={handleContentSizeChange}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
        />

        <View style={inputContainerStyle}>
          <TouchableOpacity
            style={mediaButtonStyle}
            onPress={handleMediaOptions}
            disabled={sending}
          >
            <ImageIcon size={24} color={theme.primary} />
          </TouchableOpacity>

          <TextInput
            style={inputStyle}
            placeholder="Type a message..."
            placeholderTextColor={theme.placeholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            editable={!sending}
          />

          <TouchableOpacity
            style={sendButtonStyle}
            onPress={handleSendMessage}
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