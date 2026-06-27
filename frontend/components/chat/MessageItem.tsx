// components/MessageItem.tsx
import React, { memo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Video } from 'lucide-react-native';
import { ChatMessage } from '@/services/chatservices';

interface MessageItemProps {
  item: ChatMessage;
  isOwn: boolean;
  ownAvatarUrl: string;
  primaryColor: string;
  textColor: string;
  textSecondaryColor: string;
  surfaceColor: string;
  styles: any;
  formatTime: (ts: string) => string;
}

const MessageItem = memo(({
  item,
  isOwn,
  ownAvatarUrl,
  primaryColor,
  textColor,
  textSecondaryColor,
  surfaceColor,
  styles,
  formatTime,
}: MessageItemProps) => {
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
        isOwn
          ? [styles.messageBubbleOwn, { backgroundColor: primaryColor }]
          : [styles.messageBubbleOther, { backgroundColor: surfaceColor }],
      ]}>
        {!isOwn && (
          <Text style={[styles.senderName, { color: primaryColor }]}>
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

        {item.message_text ? (
          <Text style={[
            styles.messageText,
            isOwn ? styles.messageTextOwn : { color: textColor },
          ]}>
            {item.message_text}
          </Text>
        ) : null}

        <Text style={[
          styles.messageTime,
          isOwn ? styles.messageTimeOwn : { color: textSecondaryColor },
        ]}>
          {formatTime(item.created_at)}
        </Text>
      </View>

      {isOwn && (
        <Image
          source={{ uri: ownAvatarUrl || 'https://via.placeholder.com/40' }}
          style={styles.messageAvatar}
        />
      )}
    </View>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;