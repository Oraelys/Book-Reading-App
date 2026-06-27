// app/search-users.tsx
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, MessageCircle, User } from 'lucide-react-native';
import { ChatService, Profile } from '@/services/chatservices';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';

export default function SearchUsersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const styles = getStyles(theme);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async () => {
    setSearching(true);
    try {
      const results = await ChatService.searchUsers(searchQuery.trim());
      // Filter out current user
      setSearchResults(results.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleUserPress = (profile: Profile) => {
    console.log('Navigating to user profile:', profile.id);
    router.push(`/user-profile?userId=${profile.id}`);
  };

  const handleStartChat = async (profile: Profile, event: any) => {
    // Stop event propagation to prevent navigation to profile
    event?.stopPropagation();
    
    setLoading(true);
    try {
      const roomId = await ChatService.getOrCreateDMRoom(profile.id);
      if (roomId) {
        console.log('Navigating to chat room:', roomId);
        router.push(`/chat-room?roomId=${roomId}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }: { item: Profile }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserPress(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      
      <View style={styles.userInfo}>
        <Text style={[styles.username, { color: theme.text }]}>
          {item.username}
        </Text>
        <Text style={[styles.userTag, { color: theme.textSecondary }]}>
          {item.user_tag}
        </Text>
        {item.bio && (
          <Text style={[styles.bio, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.bio}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.chatButton, { backgroundColor: theme.primary }]}
        onPress={(e) => handleStartChat(item, e)}
      >
        <MessageCircle size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Search Users</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
        <Search size={20} color={theme.placeholder} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search by username or tag..."
          placeholderTextColor={theme.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoFocus
        />
        {searching && (
          <ActivityIndicator size="small" color={theme.primary} />
        )}
      </View>

      {/* Results */}
      {searchQuery.trim().length < 2 ? (
        <View style={styles.emptyContainer}>
          <Search size={64} color={theme.border} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Search for users
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Enter at least 2 characters to search
          </Text>
        </View>
      ) : searchResults.length === 0 && !searching ? (
        <View style={styles.emptyContainer}>
          <User size={64} color={theme.border} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No users found
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Try a different search term
          </Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userTag: {
    fontSize: 14,
    marginBottom: 2,
  },
  bio: {
    fontSize: 13,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});