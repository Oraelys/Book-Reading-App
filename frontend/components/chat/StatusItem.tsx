// components/StatusItem.tsx
import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { StatusUpdate } from '@/services/chatservices';

interface StatusItemProps {
  item: StatusUpdate;
  onPress: (status: StatusUpdate) => void;
  textColor: string;
  primaryColor: string;
  borderColor: string;
  styles: any;
}

const StatusItem = memo(({
  item,
  onPress,
  textColor,
  primaryColor,
  borderColor,
  styles,
}: StatusItemProps) => {
  return (
    <TouchableOpacity
      style={styles.statusItem}
      onPress={() => onPress(item)}
    >
      <View style={[
        styles.statusRing,
        item.has_viewed
          ? [styles.statusRingViewed, { borderColor }]
          : [styles.statusRingUnviewed, { borderColor: primaryColor }],
      ]}>
        <Image
          source={{ uri: item.profile?.avatar_url || 'https://via.placeholder.com/50' }}
          style={styles.statusAvatar}
        />
      </View>
      <Text style={[styles.statusName, { color: textColor }]} numberOfLines={1}>
        {item.profile?.username || 'User'}
      </Text>
    </TouchableOpacity>
  );
});

StatusItem.displayName = 'StatusItem';

export default StatusItem;