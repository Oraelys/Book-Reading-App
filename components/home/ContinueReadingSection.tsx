// components/home/ContinueReadingSection.tsx
import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Star, BookOpen } from 'lucide-react-native';
import { Novel } from '@/types/home';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W * 0.78;
const GAP = 12;

interface Props {
  books: Novel[];
  onBookPress: (id: string) => void;
  onBookLongPress: (book: Novel) => void;
  theme: any;
}

const keyExtractor = (item: Novel) => item.id;

interface CardProps {
  item: Novel;
  onPress: (id: string) => void;
  onLongPress: (book: Novel) => void;
  theme: any;
}

const ContinueReadingCard = memo(({ item, onPress, onLongPress, theme }: CardProps) => {
  const rawProgress = Number(item.reading_progress?.progress_percentage ?? 0);
  const progress = Math.max(0, Math.min(100, rawProgress <= 1 ? rawProgress * 100 : rawProgress));
  const stars = Math.max(0, Math.min(5, Math.round(Number(item.rating ?? 0))));

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface, width: CARD_W }]}
      onPress={() => onPress(item.id)}
      onLongPress={() => onLongPress(item)}
      delayLongPress={500}
      activeOpacity={0.88}
    >
      <View style={styles.coverWrap}>
        {item.cover_image_url ? (
          <Image
            source={{ uri: item.cover_image_url }}
            style={styles.cover}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cover, styles.coverFallback, { backgroundColor: theme.border }]}>
            <BookOpen size={22} color={theme.textSecondary} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={[styles.author, { color: theme.textSecondary }]} numberOfLines={1}>
          {item.author}
        </Text>

        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map(s => (
            <Star
              key={s}
              size={13}
              color="#FFD700"
              fill={s <= stars ? '#FFD700' : 'transparent'}
            />
          ))}
          <Text style={[styles.ratingNum, { color: theme.textSecondary }]}>
            {Number(item.rating ?? 0).toFixed(1)}
          </Text>
        </View>

        <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.barFill,
              { width: `${progress}%`, backgroundColor: theme.primary },
            ]}
          />
        </View>

        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {Math.round(progress)}% complete
        </Text>
      </View>
    </TouchableOpacity>
  );
});

ContinueReadingCard.displayName = 'ContinueReadingCard';

const ContinueReadingSection = memo(({ books, onBookPress, onBookLongPress, theme }: Props) => {
  if (books.length === 0) return null;

  const renderItem = useCallback(
    ({ item }: { item: Novel }) => (
      <ContinueReadingCard
        item={item}
        onPress={onBookPress}
        onLongPress={onBookLongPress}
        theme={theme}
      />
    ),
    [onBookPress, onBookLongPress, theme],
  );

  return (
    <View style={styles.section}>
      <Text style={[styles.heading, { color: theme.text }]}>Continue Reading</Text>

      <FlatList
        data={books}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_W + GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={3}
        removeClippedSubviews={false}
        getItemLayout={(_d, index) => ({
          length: CARD_W + GAP,
          offset: (CARD_W + GAP) * index,
          index,
        })}
      />
    </View>
  );
});

ContinueReadingSection.displayName = 'ContinueReadingSection';
export default ContinueReadingSection;

const styles = StyleSheet.create({
  section: { marginBottom: 28 },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  listContent: { paddingLeft: 20, paddingRight: 8 },
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 12,
    marginRight: GAP,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  coverWrap: {
    width: 72,
    height: 108,
  },
  cover: {
    width: 72,
    height: 108,
    borderRadius: 10,
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 4,
  },
  author: { fontSize: 13, marginBottom: 8 },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 10,
  },
  ratingNum: { fontSize: 12, marginLeft: 4 },
  barTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 5,
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: { fontSize: 11 },
});