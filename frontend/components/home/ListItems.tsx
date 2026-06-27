// components/home/ListItems.tsx
import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { Novel } from '@/types/home';

// ---------------------------------------------------------------------------
// ContinueReadingCard
// ---------------------------------------------------------------------------
interface ContinueReadingCardProps {
  item: Novel;
  onPress: (id: string) => void;
  onLongPress: (book: Novel) => void;
  theme: any;
  styles: any;
}

export const ContinueReadingCard = memo(({
  item, onPress, onLongPress, theme, styles,
}: ContinueReadingCardProps) => (
  <TouchableOpacity
    style={[styles.continueCard, { backgroundColor: theme.surface }]}
    onPress={() => onPress(item.id)}
    onLongPress={() => onLongPress(item)}
    delayLongPress={500}
  >
    <Image
      source={{ uri: item.cover_image_url }}
      style={styles.continueCover}
      defaultSource={require('@/assets/images/book-placeholder.png')}
    />
    <View style={styles.continueInfo}>
      <Text style={[styles.continueTitle, { color: theme.text }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.continueAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
        {item.author}
      </Text>
      {item.reading_progress && (
        <>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${item.reading_progress.progress_percentage}%`,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            {Math.round(item.reading_progress.progress_percentage)}% complete
          </Text>
        </>
      )}
    </View>
  </TouchableOpacity>
));
ContinueReadingCard.displayName = 'ContinueReadingCard';

// ---------------------------------------------------------------------------
// LastReadBookItem
// ---------------------------------------------------------------------------
interface LastReadBookItemProps {
  item: Novel;
  onPress: (id: string) => void;
  onLongPress: (book: Novel) => void;
  styles: any;
}

export const LastReadBookItem = memo(({
  item, onPress, onLongPress, styles,
}: LastReadBookItemProps) => (
  <TouchableOpacity
    style={styles.lastReadBook}
    onPress={() => onPress(item.id)}
    onLongPress={() => onLongPress(item)}
    delayLongPress={500}
  >
    <Image
      source={{ uri: item.cover_image_url }}
      style={styles.lastReadCover}
      defaultSource={require('@/assets/images/book-placeholder.png')}
    />
    <View style={styles.lastReadOverlay}>
      <Text style={styles.lastReadProgress}>
        {Math.round(item.reading_progress?.progress_percentage || 0)}%
      </Text>
    </View>
  </TouchableOpacity>
));
LastReadBookItem.displayName = 'LastReadBookItem';

// ---------------------------------------------------------------------------
// SearchResultItem
// ---------------------------------------------------------------------------
interface SearchResultItemProps {
  item: Novel;
  onPress: (id: string) => void;
  onLongPress: (book: Novel) => void;
  theme: any;
  styles: any;
}

export const SearchResultItem = memo(({
  item, onPress, onLongPress, theme, styles,
}: SearchResultItemProps) => (
  <TouchableOpacity
    style={styles.searchResultItem}
    onPress={() => onPress(item.id)}
    onLongPress={() => onLongPress(item)}
    delayLongPress={500}
  >
    <Image
      source={{ uri: item.cover_image_url }}
      style={styles.searchResultImage}
      defaultSource={require('@/assets/images/book-placeholder.png')}
    />
    <View style={styles.searchResultInfo}>
      <Text style={[styles.searchResultTitle, { color: theme.text }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.searchResultAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
        {item.author}
      </Text>
      <Text style={[styles.searchResultDescription, { color: theme.textSecondary }]} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.searchResultFooter}>
        <View style={styles.searchResultRating}>
          <Star size={14} color="#FFD700" fill="#FFD700" />
          <Text style={[styles.searchResultRatingText, { color: theme.text }]}>
            {item.rating.toFixed(1)}
          </Text>
        </View>
        <View style={[styles.searchResultCategory, { backgroundColor: theme.primary + '20' }]}>
          <Text style={[styles.searchResultCategoryText, { color: theme.primary }]}>
            {item.category}
          </Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
));
SearchResultItem.displayName = 'SearchResultItem';  