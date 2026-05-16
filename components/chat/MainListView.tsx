// components/MainListView.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, MessageCircle, Plus, Users, Camera } from 'lucide-react-native';
import { ChatRoom, StatusUpdate } from '@/services/chatservices';
import ChatItem from './ChatItem';
import StatusItem from './StatusItem';

interface MainListViewProps {
  currentUserId: string | undefined;
  // Data owned by the parent — never fetched here
  chatRooms: ChatRoom[];
  statuses: StatusUpdate[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onChatPress: (room: ChatRoom) => void;
  onStatusPress: (status: StatusUpdate) => void;
  onCreateStatus: () => void;
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

const MY_STATUS_SENTINEL = '__my_status__';

export default function MainListView({
  currentUserId,
  chatRooms,
  statuses,
  loading,
  onRefresh,
  onChatPress,
  onStatusPress,
  onCreateStatus,
  theme,
  styles,
}: MainListViewProps) {
  const router = useRouter();
  // Only truly local UI state remains here
  const [refreshing, setRefreshing] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [fabAnimation] = useState(new Animated.Value(0));

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  const toggleFab = useCallback(() => {
    const toValue = fabOpen ? 0 : 1;
    Animated.spring(fabAnimation, {
      toValue,
      useNativeDriver: true,
      friction: 6,
    }).start();
    setFabOpen(prev => !prev);
  }, [fabOpen, fabAnimation]);

  const handleFabAction = useCallback((action: 'chat' | 'group' | 'status') => {
    toggleFab();
    setTimeout(() => {
      if (action === 'chat') {
        router.push('/search-users');
      } else if (action === 'group') {
        router.push('/create-group');
      } else if (action === 'status') {
        onCreateStatus();
      }
    }, 200);
  }, [toggleFab, router, onCreateStatus]);

  const handleFabChat = useCallback(() => handleFabAction('chat'), [handleFabAction]);
  const handleFabGroup = useCallback(() => handleFabAction('group'), [handleFabAction]);
  const handleFabStatus = useCallback(() => handleFabAction('status'), [handleFabAction]);

  // Parent handles the optimistic unread clear and markRoomAsRead
  const handleChatRoomPress = useCallback((room: ChatRoom) => {
    onChatPress(room);
  }, [onChatPress]);

  const getLastMessage = useCallback((room: ChatRoom): string => {
    if (!room.last_message) return 'No messages yet';
    const { message_type, message_text, profile, user_id } = room.last_message;
    const isOwn = user_id === currentUserId;
    const sender = isOwn ? 'You' : (profile?.username || 'Someone');
    if (message_type === 'image') return `${sender}: 📷 Photo`;
    if (message_type === 'video') return `${sender}: 🎥 Video`;
    return `${isOwn ? 'You: ' : ''}${message_text || ''}`;
  }, [currentUserId]);

  const fabTranslateY1 = useMemo(() => fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -140],
  }), [fabAnimation]);

  const fabTranslateY2 = useMemo(() => fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  }), [fabAnimation]);

  const fabRotate = useMemo(() => fabAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  }), [fabAnimation]);

  // Status list: prepend a sentinel for "Your Story"
  const statusListData = useMemo(() => [
    { id: MY_STATUS_SENTINEL, isOwn: true } as any,
    ...statuses,
  ], [statuses]);

  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={theme.primary}
      colors={[theme.primary]}
    />
  ), [refreshing, handleRefresh, theme.primary]);

  const listEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <MessageCircle size={64} color={theme.border} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No chats yet</Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        Tap the + button to start a conversation
      </Text>
    </View>
  ), [theme, styles]);

  const statusSectionStyle = useMemo(() => [
    styles.statusSection,
    { backgroundColor: theme.background, borderBottomColor: theme.border },
  ], [theme.background, theme.border, styles.statusSection]);

  const renderStatusListItem = useCallback(({ item }: { item: any }) => {
    if (item.id === MY_STATUS_SENTINEL) {
      return (
        <TouchableOpacity style={styles.statusItem} onPress={onCreateStatus}>
          <View style={[styles.myStatusRing, { borderColor: theme.primary }]}>
            <View style={[styles.myStatusAvatar, { backgroundColor: theme.surface }]}>
              <Camera size={24} color={theme.primary} />
            </View>
            <View style={[styles.addStatusButton, { backgroundColor: theme.primary, borderColor: theme.background }]}>
              <Plus size={14} color="#fff" />
            </View>
          </View>
          <Text style={[styles.statusName, { color: theme.text }]}>Your Story</Text>
        </TouchableOpacity>
      );
    }
    return (
      <StatusItem
        item={item as StatusUpdate}
        onPress={onStatusPress}
        textColor={theme.text}
        primaryColor={theme.primary}
        borderColor={theme.border}
        styles={styles}
      />
    );
  }, [onCreateStatus, onStatusPress, theme, styles]);

  const renderChatItem = useCallback(({ item }: { item: ChatRoom }) => (
    <ChatItem
      item={item}
      currentUserId={currentUserId}
      onPress={handleChatRoomPress}
      primaryColor={theme.primary}
      textColor={theme.text}
      textSecondaryColor={theme.textSecondary}
      backgroundColor={theme.background}
      styles={styles}
      getLastMessage={getLastMessage}
      formatTime={formatTime}
    />
  ), [currentUserId, handleChatRoomPress, theme, styles, getLastMessage]);

  const statusKeyExtractor = useCallback((item: any) => item.id, []);
  const chatKeyExtractor = useCallback((item: ChatRoom) => item.id, []);

  const handleSearchPress = useCallback(() => router.push('/search-users'), [router]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Messages</Text>
      </View>

      <TouchableOpacity
        style={[styles.searchContainer, { backgroundColor: theme.surface }]}
        onPress={handleSearchPress}
      >
        <Search size={20} color={theme.placeholder} />
        <Text style={[styles.searchPlaceholder, { color: theme.placeholder }]}>
          Search users...
        </Text>
      </TouchableOpacity>

      <View style={statusSectionStyle}>
        <Text style={[styles.statusSectionTitle, { color: theme.text }]}>
          Status Updates
        </Text>
        <FlatList
          data={statusListData}
          renderItem={renderStatusListItem}
          keyExtractor={statusKeyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusList}
          initialNumToRender={8}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={false}
        />
      </View>

      <FlatList
        data={chatRooms}
        renderItem={renderChatItem}
        keyExtractor={chatKeyExtractor}
        contentContainerStyle={styles.chatList}
        refreshControl={refreshControl}
        ListEmptyComponent={listEmptyComponent}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
      />

      {/* FAB */}
      <View style={styles.fabContainer}>
        {fabOpen && (
          <TouchableOpacity
            style={styles.fabBackdrop}
            activeOpacity={1}
            onPress={toggleFab}
          />
        )}

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
            onPress={handleFabGroup}
          >
            <Users size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.fabLabel, { color: theme.text, backgroundColor: theme.surface }]}>
            Group
          </Text>
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
            onPress={handleFabChat}
          >
            <MessageCircle size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.fabLabel, { color: theme.text, backgroundColor: theme.surface }]}>
            Chat
          </Text>
        </Animated.View>

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