// components/author/StoryCard.tsx
// Full-width vertical card: cover LEFT, title + tags + chapter stats RIGHT.
// Matches the home page's card aesthetic (rounded corners, theme.surface,
// uniform primary-tinted tag pills, soft shadow).
import React, { memo } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { BookOpen, CheckCircle2 } from 'lucide-react-native';
import { Story } from '@/types/author'; 

interface StoryCardProps {
  story: Story;
  onPress: (story: Story) => void;
  theme: any;
}

const MAX_TAGS = 3;

const StoryCard = memo(({ story, onPress, theme }: StoryCardProps) => {
  const visibleTags = story.tags?.slice(0, MAX_TAGS) ?? [];
  const handlePress = () => onPress(story);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface }]}
      onPress={handlePress}
      activeOpacity={0.88}
    >
      {/* Cover */}
      <Image
        source={{ uri: story.cover_image_url }}
        style={styles.cover}
        defaultSource={require('@/assets/images/book-placeholder.png')}
      />

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {story.title}
        </Text>

        {/* Tag pills — uniform primary tint, no icons */}
        {visibleTags.length > 0 && (
          <View style={styles.tagRow}>
            {visibleTags.map(tag => (
              <View
                key={tag.id}
                style={[styles.tagPill, { backgroundColor: theme.primary + '1A' }]}
              >
                <Text style={[styles.tagText, { color: theme.primary }]} numberOfLines={1}>
                  {tag.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Chapter stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <BookOpen size={13} color={theme.textSecondary} />
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {story.total_chapters} {story.total_chapters === 1 ? 'chapter' : 'chapters'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <CheckCircle2 size={13} color={theme.primary} />
            <Text style={[styles.statText, { color: theme.primary }]}>
              {story.published_chapters} published
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

StoryCard.displayName = 'StoryCard';
export default StoryCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    marginBottom: 14,
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
  cover: {
    width: 78,
    height: 112,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    maxWidth: 110,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
});