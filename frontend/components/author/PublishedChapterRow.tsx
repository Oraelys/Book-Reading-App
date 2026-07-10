import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Calendar, Eye, BarChart2, ChevronRight } from 'lucide-react-native';
import StatBadge from './StatsBadge';
import { PublishedChapter } from '@/types/author';

interface PublishedChapterRowProps {
  chapter: PublishedChapter;
  onPress: (chapter: PublishedChapter) => void;
  theme: any;
}

function PublishedChapterRow({ chapter, onPress, theme }: PublishedChapterRowProps) {
  const styles = getStyles(theme);
  const handlePress = useCallback(() => onPress(chapter), [onPress, chapter]);

  return (
    <Pressable onPress={handlePress} style={styles.card}>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {chapter.title}
        </Text>
        <Text style={[styles.storyTitle, { color: theme.textSecondary }]} numberOfLines={1}>
          {chapter.story_title}
        </Text>
        <View style={styles.statsRow}>
          <StatBadge icon={Calendar} value={formatDate(chapter.published_at)} theme={theme} />
          <StatBadge icon={Eye} value={chapter.views} theme={theme} />
          <StatBadge icon={BarChart2} value={chapter.reads} theme={theme} />
        </View>
      </View>
      <ChevronRight size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    textBlock: { flex: 1, marginRight: 12 },
    title: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
    storyTitle: { fontSize: 13, marginBottom: 8 },
    statsRow: { flexDirection: 'row', gap: 16 },
  });

export default memo(PublishedChapterRow);