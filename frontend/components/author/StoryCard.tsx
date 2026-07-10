import React, { memo, useCallback } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Eye, Users, BookOpen } from 'lucide-react-native';
import StatBadge from './StatsBadge';
import { Story } from '@/types/author';

interface StoryCardProps {
  story: Story;
  onPress: (story: Story) => void;
  theme: any;
}

function StoryCard({ story, onPress, theme }: StoryCardProps) {
  const styles = getStyles(theme);
  const handlePress = useCallback(() => onPress(story), [onPress, story]);

  return (
    <Pressable onPress={handlePress} style={styles.card}>
      <Image
        source={story.cover_image_url ? { uri: story.cover_image_url } : undefined}
        style={styles.cover}
      />
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {story.title}
        </Text>

        {story.status === 'draft' && (
          <View style={[styles.badge, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <Text style={[styles.badgeText, { color: theme.textSecondary }]}>Draft</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <StatBadge icon={Eye} value={formatCount(story.views)} theme={theme} />
          <StatBadge icon={Users} value={formatCount(story.followers ?? 0)} theme={theme} />
          <StatBadge icon={BookOpen} value={`${story.published_chapters}/${story.total_chapters}`} theme={theme} />
        </View>
      </View>
    </Pressable>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    cover: { width: 64, height: 96, borderRadius: 8, backgroundColor: theme.border },
    info: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    title: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 8,
    },
    badgeText: { fontSize: 11, fontWeight: '600' },
    statsRow: { flexDirection: 'row', gap: 16 },
  });

export default memo(StoryCard);