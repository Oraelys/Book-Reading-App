// app/create-group.tsx
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
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, Check, Search } from 'lucide-react-native';
import { ChatService, Profile } from '@/services/chatservices';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

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
      // Filter out current user and already selected users
      const filtered = results.filter(
        u => u.id !== user?.id && !selectedUsers.find(su => su.id === u.id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const toggleUserSelection = (profile: Profile) => {
    if (selectedUsers.find(u => u.id === profile.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== profile.id));
    } else {
      setSelectedUsers([...selectedUsers, profile]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (selectedUsers.length < 1) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }

    setCreating(true);
    try {
      const memberIds = selectedUsers.map(u => u.id);
      const group = await ChatService.createGroupChat(
        groupName.trim(),
        groupDescription.trim(),
        memberIds
      );

      if (group) {
        Alert.alert('Success', 'Group created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              router.back();
              setTimeout(() => {
                router.push(`/chat-room?roomId=${group.id}`);
              }, 100);
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to create group. Please try again.');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const renderSelectedUser = ({ item }: { item: Profile }) => (
    <View style={[styles.selectedUserChip, { backgroundColor: theme.primary }]}>
      <Image
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/30' }}
        style={styles.selectedUserAvatar}
      />
      <Text style={styles.selectedUserName} numberOfLines={1}>
        {item.username}
      </Text>
      <TouchableOpacity onPress={() => toggleUserSelection(item)}>
        <Text style={styles.removeButton}>×</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchResult = ({ item }: { item: Profile }) => {
    const isSelected = !!selectedUsers.find(u => u.id === item.id);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => toggleUserSelection(item)}
      >
        <Image
          source={{ uri: item.avatar_url || 'https://via.placeholder.com/50' }}
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: theme.text }]}>
            {item.username}
          </Text>
          <Text style={[styles.userTag, { color: theme.textSecondary }]}>
            {item.user_tag}
          </Text>
        </View>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
            <Check size={16} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Create Group</Text>
          <TouchableOpacity
            onPress={handleCreateGroup}
            disabled={creating || !groupName.trim() || selectedUsers.length === 0}
          >
            <Text style={[
              styles.createButton,
              { color: (groupName.trim() && selectedUsers.length > 0) ? theme.primary : theme.border }
            ]}>
              Create
            </Text>
          </TouchableOpacity>
        </View>

        {/* Group Info */}
        <View style={styles.groupInfoSection}>
          <View style={[styles.groupIconContainer, { backgroundColor: theme.surface }]}>
            <Users size={32} color={theme.primary} />
          </View>

          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.surface }]}
            placeholder="Group name"
            placeholderTextColor={theme.placeholder}
            value={groupName}
            onChangeText={setGroupName}
            maxLength={50}
            editable={!creating}
          />

          <TextInput
            style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.surface }]}
            placeholder="Group description (optional)"
            placeholderTextColor={theme.placeholder}
            value={groupDescription}
            onChangeText={setGroupDescription}
            maxLength={200}
            multiline
            numberOfLines={3}
            editable={!creating}
          />
        </View>

        {/* Selected Members */}
        {selectedUsers.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Selected ({selectedUsers.length})
            </Text>
            <FlatList
              data={selectedUsers}
              renderItem={renderSelectedUser}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectedList}
            />
          </View>
        )}

        {/* Search Members */}
        <View style={styles.searchSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Add Members</Text>
          <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
            <Search size={20} color={theme.placeholder} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search users..."
              placeholderTextColor={theme.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              editable={!creating}
            />
            {searching && <ActivityIndicator size="small" color={theme.primary} />}
          </View>
        </View>

        {/* Search Results */}
        {searchQuery.trim().length >= 2 ? (
          searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.resultsList}
            />
          ) : !searching ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No users found
              </Text>
            </View>
          ) : null
        ) : (
          <View style={styles.emptyContainer}>
            <Users size={48} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Search for users to add to the group
            </Text>
          </View>
        )}

        {creating && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  createButton: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  groupInfoSection: {
    padding: 20,
    alignItems: 'center',
  },
  groupIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  selectedSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedList: {
    gap: 8,
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: 20,
    gap: 8,
    maxWidth: 150,
  },
  selectedUserAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  selectedUserName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  removeButton: {
    fontSize: 24,
    color: '#fff',
    lineHeight: 24,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});