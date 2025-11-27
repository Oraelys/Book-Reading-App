// /components/chat/MessageBubble.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { chatStyles } from '../../styles/chatStyles';

interface MessageBubbleProps {
  message: {
    id: string;
    user_id: string;
    message_text: string;
    created_at: string;
  };
  currentUserId: string;
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUserId,
}) => {
  const isMe = message.user_id === currentUserId;

  return (
    <View
      style={[
        chatStyles.messageRow,
        isMe ? chatStyles.messageRight : chatStyles.messageLeft,
      ]}
    >
      <View style={isMe ? chatStyles.bubbleRight : chatStyles.bubbleLeft}>
        <Text
          style={isMe ? chatStyles.bubbleTextRight : chatStyles.bubbleTextLeft}
        >
          {message.message_text}
        </Text>

        <Text
          style={[
            chatStyles.timestamp,
            isMe ? chatStyles.timestampRight : chatStyles.timestampLeft,
          ]}
        >
          {formatTime(message.created_at)}
        </Text>
      </View>
    </View>
  );
};
