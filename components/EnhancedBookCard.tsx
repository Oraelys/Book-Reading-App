// components/EnhancedBookCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Star, Eye, Clock, Share2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContexts';

interface Book {
  id: string;
  title: string;
  author: string;
  cover_image_url: string;
  rating: number;
  total_ratings?: number;
  views?: number;
  reading_progress?: {
    progress_percentage: number;
  };
}

interface EnhancedBookCardProps {
  book: Book;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function EnhancedBookCard({ 
  book, 
  onPress, 
  onLongPress 
}: EnhancedBookCardProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.9}
    >
      {/* Cover Image with Gradient Overlay */}
      <View style={styles.coverContainer}>
        <Image
          source={{ uri: book.cover_image_url }}
          style={styles.coverImage}
          defaultSource={require('@/assets/images/book-placeholder.png')}
        />
        
        {/* Gradient Overlay */}
        <View style={styles.gradientOverlay} />

        {/* Progress Badge */}
        {book.reading_progress && book.reading_progress.progress_percentage > 0 && (
          <View style={[styles.progressBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.progressText}>
              {Math.round(book.reading_progress.progress_percentage)}%
            </Text>
          </View>
        )}

        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Star size={12} color="#FFD700" fill="#FFD700" />
          <Text style={styles.ratingBadgeText}>
            {book.rating.toFixed(1)}
          </Text>
        </View>

        {/* Quick Actions (visible on press/hover) */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
            onPress={onPress}
          >
            <Text style={[styles.quickActionText, { color: theme.text }]}>
              Read Now
            </Text>
          </TouchableOpacity>
          {onLongPress && (
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
              onPress={onLongPress}
            >
              <Share2 size={16} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Book Info */}
      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[styles.author, { color: theme.textSecondary }]} numberOfLines={1}>
          {book.author}
        </Text>

        {/* Stats */}
        <View style={styles.stats}>
          {book.views !== undefined && (
            <View style={styles.statItem}>
              <Eye size={12} color={theme.textSecondary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {book.views > 1000 ? `${(book.views / 1000).toFixed(1)}k` : book.views}
              </Text>
            </View>
          )}
          {book.total_ratings !== undefined && (
            <View style={styles.statItem}>
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                ({book.total_ratings})
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    width: 140,
    marginBottom: 16,
  },
  coverContainer: {
    position: 'relative',
    width: 140,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: theme.surface,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'transparent',
  },
  progressBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  quickActions: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  author: {
    fontSize: 12,
    marginBottom: 6,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
  },
});