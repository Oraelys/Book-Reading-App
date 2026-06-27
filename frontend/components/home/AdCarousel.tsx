// components/home/AdCarousel.tsx
import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, FlatList,
  StyleSheet, Dimensions, ViewToken,
} from 'react-native';
import { Advertisement } from '@/types/home';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W - 40;
const INTERVAL = 4000;

interface AdCarouselProps {
  ads: Advertisement[];
  onPress: (ad: Advertisement) => void;
  theme: any;
}

const keyExtractor = (item: Advertisement) => item.id;

const AdCarousel = memo(({ ads, onPress, theme }: AdCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    if (ads.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % ads.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, INTERVAL);
  }, [ads.length, stopTimer]);

  useEffect(() => {
    startTimer();
    return stopTimer;
  }, [startTimer, stopTimer]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const renderAd = useCallback(({ item }: { item: Advertisement }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.92}
    >
      <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
      <View style={styles.overlay}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        {item.subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{item.subtitle}</Text> : null}
      </View>
      <View style={[styles.pill, { backgroundColor: theme.primary }]}>
        <Text style={styles.pillText}>
          {item.link_type === 'book' ? 'Read Now' : 'Explore'}
        </Text>
      </View>
    </TouchableOpacity>
  ), [onPress, theme.primary]);

  if (ads.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={ads}
        renderItem={renderAd}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        snapToInterval={CARD_W + 12}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollBeginDrag={stopTimer}
        onScrollEndDrag={startTimer}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={3}
        removeClippedSubviews={false}
        getItemLayout={(_d, index) => ({
          length: CARD_W + 12,
          offset: (CARD_W + 12) * index,
          index,
        })}
      />
      {ads.length > 1 && (
        <View style={styles.dots}>
          {ads.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex
                  ? [styles.dotActive, { backgroundColor: theme.primary }]
                  : [styles.dotInactive, { backgroundColor: theme.border }],
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
});

AdCarousel.displayName = 'AdCarousel';
export default AdCarousel;

const styles = StyleSheet.create({
  wrapper: { marginBottom: 28 },
  listContent: { paddingHorizontal: 20, gap: 12 },
  card: { width: CARD_W, height: 180, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  image: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 2 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  pill: {
    position: 'absolute', top: 14, right: 14,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  pillText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 5 },
  dot: { height: 7, borderRadius: 4 },
  dotActive: { width: 20 },
  dotInactive: { width: 7 },
});