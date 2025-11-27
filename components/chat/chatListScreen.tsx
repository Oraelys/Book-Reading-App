// /components/chat/ChatListScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity } from 'react-native';
import { chatStyles } from '../../styles/chatStyles';
import { mockChats } from '../../data/mockData';

interface ChatListScreenProps {
  onSelectChat: (chatId: string, userId: string) => void;
}

export const ChatListScreen: React.FC<ChatListScreenProps> = ({ onSelectChat }) => {
  const [search, setSearch] = useState('');

  const filteredChats = mockChats.filter(chat =>
    chat.user_name.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={chatStyles.container}>
      {/* HEADER */}
      <View style={chatStyles.headerContainer}>
        <Text style={chatStyles.headerTitle}>Chats</Text>
      </View>

      {/* SEARCH BOX */}
      <View style={chatStyles.searchContainer}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search"
          placeholderTextColor="#999"
          style={chatStyles.searchInput}
        />
      </View>

      {/* CHAT LIST */}
      <FlatList
        data={filteredChats}
        keyExtractor={item => item.id}
        contentContainerStyle={chatStyles.chatList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={chatStyles.chatItem}
            onPress={() => onSelectChat(item.id, item.user_id)}
          >
            <Image source={{ uri: item.avatar }} style={chatStyles.chatAvatar} />

            <View style={chatStyles.chatInfo}>
              <View style={chatStyles.chatNameRow}>
                <Text style={chatStyles.chatName}>{item.user_name}</Text>
                <Text style={chatStyles.chatTime}>{formatTime(item.last_message_time)}</Text>
              </View>

              <View style={chatStyles.lastMessageRow}>
                <Text numberOfLines={1} style={chatStyles.lastMessage}>
                  {item.last_message}
                </Text>

                {item.unread_count > 0 && (
                  <View style={chatStyles.unreadBadge}>
                    <Text style={chatStyles.unreadText}>{item.unread_count}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
