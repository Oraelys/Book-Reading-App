// components/EnhancedBookCard.tsx
// Tap navigates, long-press recommends. Tag pills use uniform primary colour.
import React, { memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Platform,
} from 'react-native';
import { Star, Eye } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContexts';
import { Tag } from '@/types/home';

interface Book {
  id: string;
  title: string;
  author: string;
  cover_image_url: string;
  rating: number;
  total_ratings?: number;
  views?: number;
  tags?: Tag[];
  reading_progress?: { progress_percentage: number };
}

interface Props {
  book: Book;
  onPress: () => void;
  onLongPress?: () => void;
}

const MAX_TAGS = 2;

const EnhancedBookCard = memo(function EnhancedBookCard({ book, onPress, onLongPress }: Props) {
  const { theme } = useTheme();
  const visibleTags = book.tags?.slice(0, MAX_TAGS) ?? [];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.85}
    >
      {/* Cover */}
      <View style={[styles.coverWrap, { backgroundColor: theme.surface }]}>
        <Image
          source={{ uri: book.cover_image_url }}
          style={styles.cover}
          defaultSource={require('@/assets/images/book-placeholder.png')}
        />
        {/* Progress badge */}
        {book.reading_progress && book.reading_progress.progress_percentage > 0 && (
          <View style={[styles.badge, styles.badgeRight, { backgroundColor: theme.primary }]}>
            <Text style={styles.badgeText}>
              {Math.round(book.reading_progress.progress_percentage)}%
            </Text>
          </View>
        )}
        {/* Rating badge */}
        <View style={[styles.badge, styles.badgeLeft]}>
          <Star size={11} color="#FFD700" fill="#FFD700" />
          <Text style={styles.badgeText}>{(book.rating ?? 0).toFixed(1)}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[styles.author, { color: theme.textSecondary }]} numberOfLines={1}>
          {book.author}
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          {book.views !== undefined && (
            <View style={styles.statItem}>
              <Eye size={11} color={theme.textSecondary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {book.views > 1000 ? `${(book.views / 1000).toFixed(1)}k` : book.views}
              </Text>
            </View>
          )}
          {book.total_ratings !== undefined && (
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              ({book.total_ratings})
            </Text>
          )}
        </View>

        {/* Tag pills — all use theme.primary, no custom colours, no icons */}
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
      </View>
    </TouchableOpacity>
  );
});

export default EnhancedBookCard;

const styles = StyleSheet.create({
  container: { width: 130, marginBottom: 4 },
  coverWrap: {
    position: 'relative',
    width: 130,
    height: 185,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  cover: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute', top: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
  },
  badgeLeft: { left: 8, backgroundColor: 'rgba(0,0,0,0.55)' },
  badgeRight: { right: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  info: { paddingHorizontal: 2 },
  title: { fontSize: 13, fontWeight: '600', marginBottom: 3, lineHeight: 18 },
  author: { fontSize: 12, marginBottom: 5 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { fontSize: 11 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tagPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, maxWidth: 110 },
  tagText: { fontSize: 10, fontWeight: '600' },
});