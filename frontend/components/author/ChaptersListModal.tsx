// components/author/ChaptersListModal.tsx
import React, { useCallback, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Plus, Rocket } from 'lucide-react-native';
import { Chapter } from '@/types/chapter';

interface ChaptersListModalProps {
  visible: boolean;
  chapters: Chapter[];
  activeChapterId: string | null;
  onSelectChapter: (chapter: Chapter) => void;
  onCreateChapter: () => void;
  onClose: () => void;
  theme: any;
  isDark: boolean;
  creating?: boolean;
  // Story-level publish action lives here since this panel is the
  // "story control center" — chapters + overall story status.
  storyStatus?: 'draft' | 'published';
  onPublishStory?: () => void;
  publishingStory?: boolean;
}

function ChaptersListModalBase({
  visible, chapters, activeChapterId, onSelectChapter, onCreateChapter, onClose,
  theme, isDark, creating, storyStatus, onPublishStory, publishingStory,
}: ChaptersListModalProps) {
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const hasPublishedChapter = useMemo(
    () => chapters.some(c => c.status === 'published'),
    [chapters],
  );

  const renderItem = useCallback(({ item }: { item: Chapter }) => {
    const isActive = item.id === activeChapterId;
    const isPublished = item.status === 'published';
    return (
      <Pressable
        onPress={() => onSelectChapter(item)}
        style={[
          styles.row,
          { borderColor: theme.border },
          isActive && { backgroundColor: theme.surface },
        ]}
      >
        <View style={styles.rowLeft}>
          <Text style={[styles.chapterNumber, { color: theme.textSecondary }]}>
            {item.chapter_number}
          </Text>
          <Text style={[styles.chapterTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title || 'Untitled Chapter'}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isPublished ? theme.success : theme.surface,
              borderColor: isPublished ? theme.success : theme.border,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: isPublished ? '#FFF' : theme.textSecondary }]}>
            {isPublished ? 'Published' : 'Draft'}
          </Text>
        </View>
      </Pressable>
    );
  }, [activeChapterId, onSelectChapter, styles, theme]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={[styles.sheet, { backgroundColor: theme.background }]} edges={['bottom']}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Chapters</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={22} color={theme.text} />
            </Pressable>
          </View>

          <FlatList
            data={chapters}
            keyExtractor={c => c.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <Pressable
            onPress={onCreateChapter}
            disabled={creating}
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
          >
            <Plus size={18} color="#FFF" />
            <Text style={styles.actionLabel}>
              {creating ? 'Creating…' : 'New Chapter'}
            </Text>
          </Pressable>

          {storyStatus === 'draft' && onPublishStory && (
            <Pressable
              onPress={onPublishStory}
              disabled={!hasPublishedChapter || publishingStory}
              style={[
                styles.actionButton,
                styles.publishStoryButton,
                { borderColor: theme.border },
                !hasPublishedChapter && styles.buttonDisabled,
              ]}
            >
              <Rocket size={18} color={hasPublishedChapter ? theme.primary : theme.textSecondary} />
              <Text
                style={[
                  styles.actionLabel,
                  { color: hasPublishedChapter ? theme.primary : theme.textSecondary },
                ]}
              >
                {publishingStory
                  ? 'Publishing…'
                  : hasPublishedChapter
                    ? 'Publish Story'
                    : 'Publish a chapter first'}
              </Text>
            </Pressable>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export default React.memo(ChaptersListModalBase);

const getStyles = (theme: any, _isDark: boolean) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: {
      maxHeight: '75%',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    listContent: { paddingHorizontal: 20, paddingBottom: 8 },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      marginBottom: 8,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
    chapterNumber: { fontSize: 13, fontWeight: '700', minWidth: 22 },
    chapterTitle: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
    },
    badgeText: { fontSize: 11, fontWeight: '700' },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: 20,
      marginTop: 8,
      paddingVertical: 14,
      borderRadius: 12,
    },
    publishStoryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      marginBottom: 20,
    },
    actionLabel: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    buttonDisabled: { opacity: 0.6 },
  });