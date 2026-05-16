// components/ChatItem.tsx
import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Users } from 'lucide-react-native';
import { ChatRoom } from '@/services/chatservices';

interface ChatItemProps {
  item: ChatRoom;
  currentUserId: string | undefined;
  onPress: (room: ChatRoom) => void;
  primaryColor: string;
  textColor: string;
  textSecondaryColor: string;
  backgroundColor: string;
  styles: any;
  getLastMessage: (room: ChatRoom) => string;
  formatTime: (ts: string) => string;
}

const ChatItem = memo(({
  item,
  currentUserId,
  onPress,
  primaryColor,
  textColor,
  textSecondaryColor,
  backgroundColor,
  styles,
  getLastMessage,
  formatTime,
}: ChatItemProps) => {
  const otherMember = item.members?.find(m => m.user_id !== currentUserId);
  const displayName = item.room_type === 'direct'
    ? otherMember?.profile?.username || 'Unknown'
    : item.name;
  const avatarUrl = item.room_type === 'direct'
    ? otherMember?.profile?.avatar_url
    : item.avatar_url;

  return (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => onPress(item)}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: avatarUrl || 'https://via.placeholder.com/50' }}
          style={styles.chatAvatar}
        />
        {item.room_type === 'group' && (
          <View style={[styles.groupBadge, { backgroundColor: primaryColor, borderColor: backgroundColor }]}>
            <Users size={12} color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, { color: textColor }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.chatTime, { color: textSecondaryColor }]}>
            {item.last_message ? formatTime(item.last_message.created_at) : ''}
          </Text>
        </View>

        <View style={styles.chatMessage}>
          <Text style={[styles.lastMessage, { color: textSecondaryColor }]} numberOfLines={1}>
            {getLastMessage(item)}
          </Text>
          {(item.unread_count || 0) > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: primaryColor }]}>
              <Text style={styles.unreadText}>
                {item.unread_count! > 99 ? '99+' : item.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

ChatItem.displayName = 'ChatItem';

export default ChatItem;