// components/author/ChapterRow.tsx
import React, { memo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { Eye, BookOpenCheck } from 'lucide-react-native';
import { PublishedChapter } from '@/types/author';

interface ChapterRowProps {
  chapter: PublishedChapter;
  onPress: (chapter: PublishedChapter) => void;
  theme: any;
}

const formatCount = (n: number): string => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
};

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return '';
  }
};

const ChapterRow = memo(({ chapter, onPress, theme }: ChapterRowProps) => {
  const handlePress = () => onPress(chapter);

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: theme.surface }]}
      onPress={handlePress}
      activeOpacity={0.88}
    >
      <View style={styles.left}>
        <Text style={[styles.chapterTitle, { color: theme.text }]} numberOfLines={1}>
          {chapter.title}
        </Text>
        <Text style={[styles.storyTitle, { color: theme.textSecondary }]} numberOfLines={1}>
          {chapter.story_title}
        </Text>
        <Text style={[styles.publishDate, { color: theme.textSecondary }]}>
          Published {formatDate(chapter.published_at)}
        </Text>
      </View>

      <View style={styles.right}>
        <View style={styles.statItem}>
          <Eye size={13} color={theme.textSecondary} />
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {formatCount(chapter.views)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <BookOpenCheck size={13} color={theme.primary} />
          <Text style={[styles.statText, { color: theme.primary }]}>
            {formatCount(chapter.reads)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

ChapterRow.displayName = 'ChapterRow';
export default ChapterRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  left: { flex: 1, marginRight: 12 },
  chapterTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  storyTitle: { fontSize: 13, marginBottom: 5 },
  publishDate: { fontSize: 11 },
  right: { alignItems: 'flex-end', gap: 6 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '600' },
});