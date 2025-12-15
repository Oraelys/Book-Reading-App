// app/(tabs)/social.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, MessageCircle, Plus, Users, Image as ImageIcon, X } from 'lucide-react-native';
import { ChatService, ChatRoom, StatusUpdate } from '@/services/chatservices';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';

export default function SocialScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [statuses, setStatuses] = useState<StatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [fabAnimation] = useState(new Animated.Value(0));

  const styles = getStyles(theme, isDark);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [rooms, statusList] = await Promise.all([
        ChatService.getUserChatRooms(user.id),
        ChatService.getContactStatuses(user.id),
      ]);

      setChatRooms(rooms);
      setStatuses(statusList);
    } catch (error) {
      console.error('Error loading social data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleFab = () => {
    const toValue = fabOpen ? 0 : 1;
    Animated.spring(fabAnimation, {
      toValue,
      useNativeDriver: true,
      friction: 6,
    }).start();
    setFabOpen(!fabOpen);
  };

  const handleFabAction = (action: 'chat' | 'group' | 'status') => {
    toggleFab();
    setTimeout(() => {
      if (action === 'chat') {
        router.push('/search-users');
      } else if (action === 'group') {
        router.push('/create-group');
      } else if (action === 'status') {
        router.push('/create-status');
      }
    }, 200);
  };

  const handleChatPress = (room: ChatRoom) => {
    router.push(`/chat-room?roomId=${room.id}`);
  };

  const handleStatusPress = (status: StatusUpdate) => {
    router.push(`/status-viewer?statusId=${status.id}`);
  };

  const handleSearchPress = () => {
    router.push('/search-users');
  };

  const formatTime = (timestamp: string) => {
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

  const getLastMessage = (room: ChatRoom) => {
    if (!room.last_message) return 'No messages yet';
    
    const { message_type, message_text, profile } = room.last_message;
    const sender = profile?.username || 'Someone';
    
    if (message_type === 'image') return `${sender}: 📷 Photo`;
    if (message_type === 'video') return `${sender}: 🎥 Video`;
    return message_text || '';
  };

  const renderStatusItem = ({ item }: { item: StatusUpdate }) => (
    <TouchableOpacity
      style={styles.statusItem}
      onPress={() => handleStatusPress(item)}
    >
      <View style={[
        styles.statusRing,
        item.has_viewed ? styles.statusRingViewed : styles.statusRingUnviewed
      ]}>
        <Image
          source={{ uri: item.profile?.avatar_url || 'https://via.placeholder.com/50' }}
          style={styles.statusAvatar}
        />
      </View>
      <Text style={[styles.statusName, { color: theme.text }]} numberOfLines={1}>
        {item.profile?.username || 'User'}
      </Text>
    </TouchableOpacity>
  );

  const renderChatItem = ({ item }: { item: ChatRoom }) => {
    const otherMember = item.members?.find(m => m.user_id !== user?.id);
    const displayName = item.room_type === 'direct'
      ? otherMember?.profile?.username || 'Unknown'
      : item.name;
    const avatarUrl = item.room_type === 'direct'
      ? otherMember?.profile?.avatar_url
      : item.avatar_url;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: avatarUrl || 'https://via.placeholder.com/50' }}
            style={styles.chatAvatar}
          />
          {item.room_type === 'group' && (
            <View style={[styles.groupBadge, { backgroundColor: theme.primary }]}>
              <Users size={12} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, { color: theme.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.chatTime, { color: theme.textSecondary }]}>
              {item.last_message ? formatTime(item.last_message.created_at) : ''}
            </Text>
          </View>

          <View style={styles.chatMessage}>
            <Text style={[styles.lastMessage, { color: theme.textSecondary }]} numberOfLines={1}>
              {getLastMessage(item)}
            </Text>
            {(item.unread_count || 0) > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.unreadText}>
                  {item.unread_count! > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const fabTranslateY1 = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -140],
  });

  const fabTranslateY2 = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  });

  const fabTranslateY3 = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const fabRotate = fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Messages</Text>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={[styles.searchContainer, { backgroundColor: theme.surface }]}
        onPress={handleSearchPress}
      >
        <Search size={20} color={theme.placeholder} />
        <Text style={[styles.searchPlaceholder, { color: theme.placeholder }]}>
          Search users...
        </Text>
      </TouchableOpacity>

      {/* Status Updates */}
      {statuses.length > 0 && (
        <View style={[styles.statusSection, { borderBottomColor: theme.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusList}
          >
            <FlatList
              data={statuses}
              renderItem={renderStatusItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </ScrollView>
        </View>
      )}

      {/* Chat List */}
      <FlatList
        data={chatRooms}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MessageCircle size={64} color={theme.border} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No chats yet</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Tap the + button to start a conversation
            </Text>
          </View>
        }
      />

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        {/* Backdrop */}
        {fabOpen && (
          <TouchableOpacity
            style={styles.fabBackdrop}
            activeOpacity={1}
            onPress={toggleFab}
          />
        )}

        {/* FAB Options */}
        <Animated.View
          style={[
            styles.fabOption,
            {
              transform: [{ translateY: fabTranslateY1 }, { scale: fabAnimation }],
              opacity: fabAnimation,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.fabButton, styles.fabOptionButton, { backgroundColor: theme.primary }]}
            onPress={() => handleFabAction('status')}
          >
            <ImageIcon size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.fabLabel, { color: theme.text }]}>Status</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.fabOption,
            {
              transform: [{ translateY: fabTranslateY2 }, { scale: fabAnimation }],
              opacity: fabAnimation,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.fabButton, styles.fabOptionButton, { backgroundColor: theme.primary }]}
            onPress={() => handleFabAction('group')}
          >
            <Users size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.fabLabel, { color: theme.text }]}>Group</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.fabOption,
            {
              transform: [{ translateY: fabTranslateY3 }, { scale: fabAnimation }],
              opacity: fabAnimation,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.fabButton, styles.fabOptionButton, { backgroundColor: theme.primary }]}
            onPress={() => handleFabAction('chat')}
          >
            <MessageCircle size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.fabLabel, { color: theme.text }]}>Chat</Text>
        </Animated.View>

        {/* Main FAB */}
        <Animated.View style={{ transform: [{ rotate: fabRotate }] }}>
          <TouchableOpacity
            style={[styles.fabButton, styles.fabMain, { backgroundColor: theme.primary }]}
            onPress={toggleFab}
          >
            <Plus size={28} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    gap: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
  },
  statusSection: {
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  statusList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  statusItem: {
    alignItems: 'center',
    width: 70,
  },
  statusRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    padding: 3,
    marginBottom: 6,
  },
  statusRingViewed: {
    borderWidth: 2,
    borderColor: theme.border,
  },
  statusRingUnviewed: {
    borderWidth: 3,
    borderColor: theme.primary,
  },
  statusAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    borderWidth: 3,
    borderColor: theme.background,
  },
  statusName: {
    fontSize: 12,
    textAlign: 'center',
  },
  chatList: {
    paddingBottom: 100,
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  groupBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.background,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
  },
  chatMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'flex-end',
  },
  fabBackdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -100,
    bottom: -100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fabOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  fabLabel: {
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    ...theme.shadow,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabOptionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  fabMain: {
    elevation: 8,
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});