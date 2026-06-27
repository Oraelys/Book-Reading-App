// app/(tabs)/social.tsx - Refactored: performance-optimized with split sub-components
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';
import { ChatService, ChatRoom, StatusUpdate } from '@/services/chatservices';

import ChatView from '@/components/chat/ChatView';
import StatusCreateView from '@/components/chat/StatusCreateView';
import MainListView from '@/components/chat/MainListView';

type ViewMode = 'list' | 'chat' | 'status-create' | 'status-view';

export default function UnifiedSocialScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  // ---------------------------------------------------------------------------
  // Shared data — lives here so it survives view transitions without refetching
  // ---------------------------------------------------------------------------
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [statuses, setStatuses] = useState<StatusUpdate[]>([]);
  const [socialLoading, setSocialLoading] = useState(true);

  // Navigation state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | undefined>(undefined);

  // Memoize styles so getStyles isn't called on every render
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const ownAvatarUrl: string = useMemo(
    () => user?.user_metadata?.avatar_url || '',
    [user?.user_metadata?.avatar_url]
  );

  // Initial load — runs once when user is available
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const [rooms, statusList] = await Promise.all([
          ChatService.getUserChatRooms(user.id),
          ChatService.getContactStatuses(user.id),
        ]);
        if (!cancelled) {
          setChatRooms(rooms);
          setStatuses(statusList);
        }
      } catch (error) {
        console.error('Error loading social data:', error);
      } finally {
        if (!cancelled) setSocialLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  const refreshRooms = useCallback(async () => {
    if (!user?.id) return;
    try {
      const rooms = await ChatService.getUserChatRooms(user.id);
      setChatRooms(rooms);
    } catch (error) {
      console.error('Error refreshing rooms:', error);
    }
  }, [user?.id]);

  const refreshStatuses = useCallback(async () => {
    if (!user?.id) return;
    try {
      const statusList = await ChatService.getContactStatuses(user.id);
      setStatuses(statusList);
    } catch (error) {
      console.error('Error refreshing statuses:', error);
    }
  }, [user?.id]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshRooms(), refreshStatuses()]);
  }, [refreshRooms, refreshStatuses]);

  const handleChatPress = useCallback((room: ChatRoom) => {
    // Optimistically clear the unread badge immediately — no round-trip needed
    setChatRooms(prev =>
      prev.map(r => r.id === room.id ? { ...r, unread_count: 0 } : r)
    );
    setActiveRoomId(room.id);
    setActiveRoom(room);
    setViewMode('chat');
  }, []);

  const handleStatusPress = useCallback((_status: StatusUpdate) => {
    // status-view is inline in MainListView; keeping hook for future expansion
  }, []);

  const handleCreateStatus = useCallback(() => {
    setViewMode('status-create');
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setActiveRoomId(null);
    setActiveRoom(undefined);
  }, []);

  const handleStatusPosted = useCallback(async () => {
    handleBackToList();
    // Only refresh statuses — chat rooms are unchanged
    await refreshStatuses();
  }, [handleBackToList, refreshStatuses]);

  // Only the active view is mounted — avoids rendering idle heavy components
  if (viewMode === 'chat' && activeRoomId) {
    return (
      <ChatView
        activeRoomId={activeRoomId}
        activeRoom={activeRoom}
        currentUserId={user?.id}
        ownAvatarUrl={ownAvatarUrl}
        onBack={handleBackToList}
        theme={theme}
        styles={styles}
      />
    );
  }

  if (viewMode === 'status-create') {
    return (
      <StatusCreateView
        onBack={handleBackToList}
        onPosted={handleStatusPosted}
        styles={styles}
      />
    );
  }

  // Default: main list — receives already-loaded data, never refetches on mount
  return (
    <MainListView
      currentUserId={user?.id}
      chatRooms={chatRooms}
      statuses={statuses}
      loading={socialLoading}
      onRefresh={refreshAll}
      onChatPress={handleChatPress}
      onStatusPress={handleStatusPress}
      onCreateStatus={handleCreateStatus}
      theme={theme}
      styles={styles}
    />
  );
}

// ---------------------------------------------------------------------------
// Styles — defined once at module level, memoized in the component via useMemo
// ---------------------------------------------------------------------------
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
  headerInfo: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  backButton: {
    padding: 8,
  },
  moreButton: {
    padding: 8,
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
    paddingVertical: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  statusSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statusList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  statusItem: {
    alignItems: 'center',
    width: 70,
  },
  myStatusRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
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
  },
  statusRingUnviewed: {
    borderWidth: 3,
  },
  statusAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    borderWidth: 3,
    borderColor: theme.background,
  },
  myStatusAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStatusButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
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
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
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
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  messageTimeOwn: {
    color: 'rgba(255, 255, 255, 0.7)',
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  postButton: {
    padding: 8,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a84ff',
  },
  postButtonTextDisabled: {
    color: '#666',
  },
  statusContent: {
    flex: 1,
    padding: 16,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    maxHeight: 500,
  },
  removeMediaButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPickerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  mediaPickerButton: {
    alignItems: 'center',
    gap: 16,
  },
  mediaPickerText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  captionContainer: {
    marginTop: 16,
  },
  captionInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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