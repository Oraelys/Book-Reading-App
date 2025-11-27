// /components/chat/ChatScreen.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { Send, X } from 'lucide-react-native';
import { chatStyles } from '@/styles/chatStyles';
import { mockMessages, mockUser } from '../../data/mockData';

interface ChatScreenProps {
  chatUser: {
    id: string;
    name: string;
    avatar: string;
  };
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ chatUser, onBack }) => {
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;

    setSending(true);

    const newMessage = {
      id: Date.now().toString(),
      user_id: mockUser.id,
      message_text: input.trim(),
      created_at: new Date().toISOString(),
    };

    setTimeout(() => {
      setMessages(prev => [...prev, newMessage]);
      setInput('');
      setSending(false);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 300);
  };

  const formatTime = (t: string) => {
    const d = new Date(t);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: any) => {
    const isOwn = item.user_id === mockUser.id;

    return (
      <View style={[chatStyles.msgRow, isOwn ? chatStyles.msgRowOwn : chatStyles.msgRowOther]}>
        {/* Avatar */}
        {!isOwn && <Image source={{ uri: chatUser.avatar }} style={chatStyles.msgAvatar} />}

        <View style={[chatStyles.msgBubble, isOwn ? chatStyles.msgBubbleOwn : chatStyles.msgBubbleOther]}>
          {!isOwn && <Text style={chatStyles.senderName}>{chatUser.name}</Text>}

          <Text style={[chatStyles.msgText, isOwn ? chatStyles.msgTextOwn : chatStyles.msgTextOther]}>
            {item.message_text}
          </Text>

          <Text style={[chatStyles.msgTime, isOwn ? chatStyles.msgTimeOwn : chatStyles.msgTimeOther]}>
            {formatTime(item.created_at)}
          </Text>
        </View>

        {isOwn && <Image source={{ uri: mockUser.avatar }} style={chatStyles.msgAvatar} />}
      </View>
    );
  };

  return (
    <View style={chatStyles.chatScreen}>
      {/* HEADER */}
      <View style={chatStyles.headerContainer}>
        <TouchableOpacity onPress={onBack} style={chatStyles.backButton}>
          <X size={24} color="#007AFF" />
        </TouchableOpacity>

        <Image source={{ uri: chatUser.avatar }} style={chatStyles.headerAvatar} />
        <Text style={chatStyles.headerTitle}>{chatUser.name}</Text>
      </View>

      {/* MESSAGES */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={chatStyles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* INPUT BAR */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={chatStyles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            style={chatStyles.inputBox}
            multiline
            maxLength={900}
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || sending}
            style={[
              chatStyles.sendButton,
              (!input.trim() || sending) && chatStyles.sendButtonDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
