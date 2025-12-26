// components/BookRecommendationModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Search, Star } from 'lucide-react-native';
import { ChatService, Profile } from '@/services/chatservices';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';

interface Book {
  id: string;
  title: string;
  author: string;
  cover_image_url: string;
  rating: number;
}

interface BookRecommendationModalProps {
  visible: boolean;
  book: Book | null;
  onClose: () => void;
}

export default function BookRecommendationModal({ 
  visible, 
  book, 
  onClose 
}: BookRecommendationModalProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const styles = getStyles(theme);

  useEffect(() => {
    if (visible && searchQuery.length >= 2) {
      searchUsers();
    }
  }, [searchQuery, visible]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const results = await ChatService.searchUsers(searchQuery);
      // Filter out current user
      setUsers(results.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0) return;

    setSending(true);
    try {
      // Send book recommendation to each selected user
      for (const userId of selectedUsers) {
        const roomId = await ChatService.getOrCreateDMRoom(userId);
        if (roomId && book) {
          const message = `📚 I recommend this book: "${book.title}" by ${book.author}. Check it out!`;
          await ChatService.sendMessage(roomId, message);
        }
      }

      Alert.alert(
        'Success',
        `Recommended "${book?.title}" to ${selectedUsers.length} friend${selectedUsers.length !== 1 ? 's' : ''}!`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error sending recommendations:', error);
      Alert.alert('Error', 'Failed to send recommendations');
    } finally {
      setSending(false);
    }
  };

  const renderUserItem = ({ item }: { item: Profile }) => {
    const isSelected = selectedUsers.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => toggleUser(item.id)}
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
        <View style={[
          styles.checkbox,
          isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }
        ]}>
          {isSelected && (
            <View style={styles.checkmark} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!book) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Recommend Book
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Book Preview */}
        <View style={[styles.bookPreview, { borderBottomColor: theme.border }]}>
          <Image
            source={{ uri: book.cover_image_url }}
            style={styles.bookCover}
          />
          <View style={styles.bookInfo}>
            <Text style={[styles.bookTitle, { color: theme.text }]}>
              {book.title}
            </Text>
            <Text style={[styles.bookAuthor, { color: theme.textSecondary }]}>
              {book.author}
            </Text>
            <View style={styles.bookRating}>
              <Star size={14} color="#FFD700" fill="#FFD700" />
              <Text style={[styles.ratingText, { color: theme.text }]}>
                {book.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
            <Search size={20} color={theme.placeholder} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search friends..."
              placeholderTextColor={theme.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {loading && <ActivityIndicator size="small" color={theme.primary} />}
          </View>
        </View>

        {/* User List */}
        {searchQuery.length >= 2 ? (
          users.length > 0 ? (
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.userList}
            />
          ) : !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No users found
              </Text>
            </View>
          ) : null
        ) : (
          <View style={styles.emptyContainer}>
            <Search size={48} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Search for friends to recommend this book
            </Text>
          </View>
        )}

        {/* Send Button */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: selectedUsers.length > 0 ? theme.primary : theme.border }
            ]}
            onPress={handleSend}
            disabled={selectedUsers.length === 0 || sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>
                Send to {selectedUsers.length} friend{selectedUsers.length !== 1 ? 's' : ''}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  bookPreview: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  bookCover: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    marginBottom: 8,
  },
  bookRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchSection: {
    padding: 16,
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
  userList: {
    padding: 16,
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
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
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  sendButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});