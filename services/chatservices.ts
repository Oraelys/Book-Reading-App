// services/chatService.ts - OPTIMIZED VERSION
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface Profile {
  id: string;
  username: string;
  user_tag: string;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  room_type: 'direct' | 'group';
  created_by: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  members?: RoomMember[];
  last_message?: ChatMessage;
  unread_count?: number;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  is_admin: boolean;
  joined_at: string;
  last_read_at: string;
  profile?: Profile;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  message_text: string | null;
  message_type: 'text' | 'image' | 'video';
  media_url: string | null;
  media_thumbnail_url: string | null;
  media_size: number | null;
  replied_to: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface StatusUpdate {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  views_count: number;
  expires_at: string;
  created_at: string;
  profile?: Profile;
  has_viewed?: boolean;
}

export class ChatService {
  // Profile cache to avoid repeated fetches
  private static profileCache: Map<string, Profile> = new Map();

  // Batch fetch multiple users at once
  static async getUsersByIds(userIds: string[]): Promise<Map<string, Profile>> {
    const uniqueIds: string[] = [...new Set(userIds)];
    const uncachedIds: string[] = uniqueIds.filter(id => !this.profileCache.has(id));
    
    if (uncachedIds.length > 0) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('id', uncachedIds);

        if (error) throw error;

        // Cache the results
        (data as Profile[] | null)?.forEach((profile: Profile) => {
          this.profileCache.set(profile.id, profile);
        });
      } catch (error) {
        console.error('Error batch fetching users:', error);
      }
    }

    const result: Map<string, Profile> = new Map<string, Profile>();
    uniqueIds.forEach((id: string) => {
      const profile: Profile | undefined = this.profileCache.get(id);
      if (profile) result.set(id, profile);
    });

    return result;
  }

  // Clear cache when needed
  static clearProfileCache() {
    this.profileCache.clear();
  }

  // Get single user (uses cache)
  static async getUserById(userId: string): Promise<Profile | null> {
    if (this.profileCache.has(userId)) {
      return this.profileCache.get(userId)!;
    }

    const profiles = await this.getUsersByIds([userId]);
    return profiles.get(userId) || null;
  }

  // User Search
  static async searchUsers(searchTerm: string): Promise<Profile[]> {
    try {
      const { data, error } = await supabase.rpc('search_users', {
        search_term: searchTerm
      });

      if (error) throw error;
      
      // Cache search results
      data?.forEach(profile => {
        this.profileCache.set(profile.id, profile);
      });
      
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Get user profile by tag
  static async getUserByTag(userTag: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_tag', userTag)
        .single();

      if (error) throw error;
      
      if (data) {
        this.profileCache.set(data.id, data);
      }
      
      return data;
    } catch (error) {
      console.error('Error getting user by tag:', error);
      return null;
    }
  }

  // Get or create DM room
  static async getOrCreateDMRoom(otherUserId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('get_or_create_dm_room', {
        other_user_id: otherUserId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting/creating DM room:', error);
      return null;
    }
  }

  // Create group chat
  static async createGroupChat(name: string, description: string, memberIds: string[]): Promise<ChatRoom | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          description,
          room_type: 'group',
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) throw roomError;

      const members = [
        { room_id: room.id, user_id: user.id, is_admin: true },
        ...memberIds.map(id => ({ room_id: room.id, user_id: id, is_admin: false }))
      ];

      const { error: membersError } = await supabase
        .from('room_members')
        .insert(members);

      if (membersError) throw membersError;

      return room;
    } catch (error) {
      console.error('Error creating group chat:', error);
      return null;
    }
  }

  // Get user's chat rooms (OPTIMIZED)
  static async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('user_id', userId);

      if (memberError) throw memberError;
      if (!memberData || memberData.length === 0) return [];

      const roomIds = memberData.map(m => m.room_id);

      const { data: rooms, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('id', roomIds);

      if (roomsError) throw roomsError;

      const chatRooms: ChatRoom[] = rooms || [];

      // Batch fetch all members and messages
      const [allMembers, lastMessages] = await Promise.all([
        supabase
          .from('room_members')
          .select('*')
          .in('room_id', roomIds),
        supabase
          .from('chat_messages')
          .select('*')
          .in('room_id', roomIds)
          .order('created_at', { ascending: false })
      ]);

      // Get all unique user IDs
      const userIds = new Set<string>();
      allMembers.data?.forEach(m => userIds.add(m.user_id));
      lastMessages.data?.forEach(m => userIds.add(m.user_id));

      // Batch fetch all profiles
      const profiles = await this.getUsersByIds([...userIds]);

      // Organize members by room
      const membersByRoom = new Map<string, RoomMember[]>();
      allMembers.data?.forEach(member => {
        if (!membersByRoom.has(member.room_id)) {
          membersByRoom.set(member.room_id, []);
        }
        membersByRoom.get(member.room_id)!.push({
          ...member,
          profile: profiles.get(member.user_id)
        });
      });

      // Organize last messages by room
      const lastMessageByRoom = new Map<string, ChatMessage>();
      lastMessages.data?.forEach(msg => {
        if (!lastMessageByRoom.has(msg.room_id)) {
          lastMessageByRoom.set(msg.room_id, {
            ...msg,
            profile: profiles.get(msg.user_id)
          });
        }
      });

      // Get unread counts
      const { data: userMember } = await supabase
        .from('room_members')
        .select('room_id, last_read_at')
        .eq('user_id', userId)
        .in('room_id', roomIds);

      const unreadByRoom = new Map<string, number>();
      if (userMember) {
        for (const member of userMember) {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', member.room_id)
            .gt('created_at', member.last_read_at);
          unreadByRoom.set(member.room_id, count || 0);
        }
      }

      // Attach data to rooms
      chatRooms.forEach(room => {
        room.members = membersByRoom.get(room.id) || [];
        room.last_message = lastMessageByRoom.get(room.id);
        room.unread_count = unreadByRoom.get(room.id) || 0;
      });

      return chatRooms;
    } catch (error) {
      console.error('Error getting chat rooms:', error);
      return [];
    }
  }

  // Get room messages (OPTIMIZED)
  static async getRoomMessages(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const userIds = [...new Set(data?.map(m => m.user_id) || [])];
      const profiles = await this.getUsersByIds(userIds);

      const messages = (data || []).map(msg => ({
        ...msg,
        profile: profiles.get(msg.user_id)
      }));

      return messages.reverse();
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Send text message (with optimistic update support)
  static async sendMessage(roomId: string, text: string, repliedTo?: string): Promise<ChatMessage | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          message_text: text,
          message_type: 'text',
          replied_to: repliedTo
        })
        .select()
        .single();

      if (error) throw error;

      const profile = await this.getUserById(user.id);
      return { ...data, profile: profile || undefined };
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // Upload media to storage
  static async uploadMedia(uri: string, type: 'image' | 'video', roomId: string): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = uri.split('.').pop() || (type === 'image' ? 'jpg' : 'mp4');
      const fileName = `${user.id}/${roomId}/${Date.now()}.${fileExt}`;
      const filePath = `chat-media/${fileName}`;

      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(filePath, blob, {
          contentType: type === 'image' ? 'image/jpeg' : 'video/mp4',
          upsert: false
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading media:', error);
      return null;
    }
  }

  // Send image message
  static async sendImage(roomId: string, caption?: string): Promise<ChatMessage | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) return null;

      const mediaUrl = await this.uploadMedia(result.assets[0].uri, 'image', roomId);
      if (!mediaUrl) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          message_text: caption || null,
          message_type: 'image',
          media_url: mediaUrl,
          media_size: result.assets[0].fileSize || 0
        })
        .select()
        .single();

      if (error) throw error;

      const profile = await this.getUserById(user.id);
      return { ...data, profile: profile || undefined };
    } catch (error) {
      console.error('Error sending image:', error);
      return null;
    }
  }

  // Send video message
  static async sendVideo(roomId: string, caption?: string): Promise<ChatMessage | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 30,
      });

      if (result.canceled) return null;

      const mediaUrl = await this.uploadMedia(result.assets[0].uri, 'video', roomId);
      if (!mediaUrl) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          message_text: caption || null,
          message_type: 'video',
          media_url: mediaUrl,
          media_size: result.assets[0].fileSize || 0
        })
        .select()
        .single();

      if (error) throw error;

      const profile = await this.getUserById(user.id);
      return { ...data, profile: profile || undefined };
    } catch (error) {
      console.error('Error sending video:', error);
      return null;
    }
  }

  // Subscribe to room messages (with profile caching)
  static subscribeToMessages(roomId: string, callback: (message: ChatMessage) => void) {
    return supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const profile = await this.getUserById(data.user_id);
            callback({ ...data, profile: profile || undefined });
          }
        }
      )
      .subscribe();
  }

  // Mark room as read
  static async markRoomAsRead(roomId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('room_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error marking room as read:', error);
    }
  }

  // Get room members (OPTIMIZED)
  static async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId);

      if (error) throw error;

      const userIds = data?.map(m => m.user_id) || [];
      const profiles = await this.getUsersByIds(userIds);

      return (data || []).map(member => ({
        ...member,
        profile: profiles.get(member.user_id)
      }));
    } catch (error) {
      console.error('Error getting room members:', error);
      return [];
    }
  }

  // Add member to room
  static async addMemberToRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('room_members')
        .insert({
          room_id: roomId,
          user_id: userId,
          is_admin: false
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding member:', error);
      return false;
    }
  }

  // Remove member from room
  static async removeMemberFromRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      return false;
    }
  }

  // Get statuses from chat contacts (OPTIMIZED)
  static async getContactStatuses(userId: string): Promise<StatusUpdate[]> {
    try {
      const { data, error } = await supabase
        .from('status_updates')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set(data?.map(s => s.user_id) || [])];
      const profiles = await this.getUsersByIds(userIds);

      // Batch check views
      const statusIds = data?.map(s => s.id) || [];
      const { data: viewsData } = await supabase
        .from('status_views')
        .select('status_id')
        .eq('viewer_id', userId)
        .in('status_id', statusIds);

      const viewedStatusIds = new Set(viewsData?.map(v => v.status_id) || []);

      return (data || []).map(status => ({
        ...status,
        profile: profiles.get(status.user_id),
        has_viewed: viewedStatusIds.has(status.id)
      }));
    } catch (error) {
      console.error('Error getting statuses:', error);
      return [];
    }
  }

  // Create status
  static async createStatus(caption: string, mediaType: 'image' | 'video'): Promise<StatusUpdate | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType === 'image' 
          ? ImagePicker.MediaTypeOptions.Images 
          : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 30,
      });

      if (result.canceled) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const mediaUrl = await this.uploadMedia(result.assets[0].uri, mediaType, 'status');
      if (!mediaUrl) return null;

      const { data, error } = await supabase
        .from('status_updates')
        .insert({
          user_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          caption
        })
        .select()
        .single();

      if (error) throw error;

      const profile = await this.getUserById(user.id);
      return { ...data, profile: profile || undefined };
    } catch (error) {
      console.error('Error creating status:', error);
      return null;
    }
  }

  // View status
  static async viewStatus(statusId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('status_views')
        .upsert({
          status_id: statusId,
          viewer_id: user.id
        });

      const { data: status } = await supabase
        .from('status_updates')
        .select('views_count')
        .eq('id', statusId)
        .single();

      if (status) {
        await supabase
          .from('status_updates')
          .update({ views_count: (status.views_count || 0) + 1 })
          .eq('id', statusId);
      }
    } catch (error) {
      console.error('Error viewing status:', error);
    }
  }
}