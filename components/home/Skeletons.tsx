// components/home/Skeletons.tsx
import React, { useEffect, useRef, memo } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');

function useShimmer() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return anim;
}

interface BoxProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
  theme: any;
}

export const ShimmerBox = memo(({ width, height, borderRadius = 8, style, theme }: BoxProps) => {
  const anim = useShimmer();
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });
  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: theme.border, opacity },
        style,
      ]}
    />
  );
});

export const HeaderSkeleton = memo(({ theme }: { theme: any }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[sk.headerRow, { paddingTop: insets.top + 10 }]}>
      <View>
        <ShimmerBox width={160} height={22} borderRadius={6} theme={theme} style={{ marginBottom: 8 }} />
        <ShimmerBox width={120} height={14} borderRadius={6} theme={theme} />
      </View>
      <View style={sk.headerRight}>
        <ShimmerBox width={42} height={42} borderRadius={21} theme={theme} />
        <ShimmerBox width={44} height={44} borderRadius={22} theme={theme} />
      </View>
    </View>
  );
});

export const CarouselSkeleton = memo(({ theme }: { theme: any }) => (
  <View style={sk.carouselWrap}>
    <ShimmerBox width={SCREEN_W - 40} height={180} borderRadius={16} theme={theme} />
    <View style={sk.dotRow}>
      {[0, 1, 2].map(i => (
        <ShimmerBox key={i} width={i === 0 ? 20 : 7} height={7} borderRadius={4} theme={theme} style={{ marginHorizontal: 3 }} />
      ))}
    </View>
  </View>
));

export const ContinueReadingSkeleton = memo(({ theme }: { theme: any }) => (
  <View style={sk.section}>
    <ShimmerBox width={160} height={20} borderRadius={6} theme={theme} style={{ marginBottom: 14, marginLeft: 20 }} />
    <View style={sk.crRow}>
      {[0, 1].map(i => (
        <View key={i} style={[sk.crCard, { backgroundColor: theme.surface }]}>
          <ShimmerBox width={72} height={108} borderRadius={10} theme={theme} />
          <View style={sk.crInfo}>
            <ShimmerBox width={120} height={15} borderRadius={5} theme={theme} style={{ marginBottom: 8 }} />
            <ShimmerBox width={80} height={12} borderRadius={5} theme={theme} style={{ marginBottom: 12 }} />
            <ShimmerBox width={90} height={12} borderRadius={5} theme={theme} style={{ marginBottom: 8 }} />
            <ShimmerBox width="100%" height={4} borderRadius={2} theme={theme} />
          </View>
        </View>
      ))}
    </View>
  </View>
));

export const BookSectionSkeleton = memo(({ theme }: { theme: any }) => (
  <View style={sk.section}>
    <View style={sk.sectionHeaderRow}>
      <ShimmerBox width={140} height={18} borderRadius={6} theme={theme} />
      <ShimmerBox width={50} height={14} borderRadius={6} theme={theme} />
    </View>
    <View style={sk.bookRow}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={sk.bookCard}>
          <ShimmerBox width={120} height={170} borderRadius={12} theme={theme} style={{ marginBottom: 8 }} />
          <ShimmerBox width={100} height={13} borderRadius={5} theme={theme} style={{ marginBottom: 5 }} />
          <ShimmerBox width={70} height={11} borderRadius={5} theme={theme} style={{ marginBottom: 6 }} />
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <ShimmerBox width={50} height={20} borderRadius={10} theme={theme} />
            <ShimmerBox width={50} height={20} borderRadius={10} theme={theme} />
          </View>
        </View>
      ))}
    </View>
  </View>
));

export const HomeScreenSkeleton = memo(({ theme }: { theme: any }) => (
  <View style={{ flex: 1 }}>
    <HeaderSkeleton theme={theme} />
    <CarouselSkeleton theme={theme} />
    <ContinueReadingSkeleton theme={theme} />
    <BookSectionSkeleton theme={theme} />
    <BookSectionSkeleton theme={theme} />
  </View>
));

const sk = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRight: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  carouselWrap: { alignItems: 'center', marginHorizontal: 20, marginBottom: 28 },
  dotRow: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  section: { marginBottom: 28 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  crRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  crCard: { flex: 1, flexDirection: 'row', borderRadius: 14, padding: 12, gap: 12 },
  crInfo: { flex: 1, justifyContent: 'center' },
  bookRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  bookCard: { width: 120 },
});