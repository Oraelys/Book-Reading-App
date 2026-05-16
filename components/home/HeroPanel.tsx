// components/home/HeroPanel.tsx
// Primary-color banner that wraps the status bar, header, goal card and
// continue-reading list as one seamless rounded shape.
import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { Novel, UserProfile } from '@/types/home';

// ---------------------------------------------------------------------------
// LastReadBookItem  (inline — only used inside HeroPanel)
// ---------------------------------------------------------------------------
interface LastReadBookItemProps {
  item: Novel;
  onPress: (id: string) => void;
  onLongPress: (book: Novel) => void;
}

const LastReadBookItem = memo(({ item, onPress, onLongPress }: LastReadBookItemProps) => (
  <TouchableOpacity
    style={itemStyles.book}
    onPress={() => onPress(item.id)}
    onLongPress={() => onLongPress(item)}
    delayLongPress={500}
  >
    <Image
      source={{ uri: item.cover_image_url }}
      style={itemStyles.cover}
      defaultSource={require('@/assets/images/book-placeholder.png')}
    />
    <View style={itemStyles.overlay}>
      <Text style={itemStyles.pct}>
        {Math.round(item.reading_progress?.progress_percentage || 0)}%
      </Text>
    </View>
  </TouchableOpacity>
));

const itemStyles = StyleSheet.create({
  book: {
    position: 'relative',
    width: 70,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cover: { width: '100%', height: '100%', borderRadius: 8 },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  pct: { fontSize: 11, fontWeight: '700', color: '#fff' },
});

// ---------------------------------------------------------------------------
// ContinueReadingCard  (inline — only used inside HeroPanel)
// ---------------------------------------------------------------------------
interface ContinueCardProps {
  item: Novel;
  onPress: (id: string) => void;
  onLongPress: (book: Novel) => void;
  primaryColor: string;
}

const ContinueCard = memo(({ item, onPress, onLongPress, primaryColor }: ContinueCardProps) => (
  <TouchableOpacity
    style={continueStyles.card}
    onPress={() => onPress(item.id)}
    onLongPress={() => onLongPress(item)}
    delayLongPress={500}
  >
    <Image
      source={{ uri: item.cover_image_url }}
      style={continueStyles.cover}
      defaultSource={require('@/assets/images/book-placeholder.png')}
    />
    <View style={continueStyles.info}>
      <Text style={continueStyles.title} numberOfLines={2}>{item.title}</Text>
      <Text style={continueStyles.author} numberOfLines={1}>{item.author}</Text>
      {item.reading_progress && (
        <>
          <View style={continueStyles.barTrack}>
            <View
              style={[
                continueStyles.barFill,
                {
                  width: `${item.reading_progress.progress_percentage}%`,
                  backgroundColor: primaryColor,
                },
              ]}
            />
          </View>
          <Text style={continueStyles.pctText}>
            {Math.round(item.reading_progress.progress_percentage)}% complete
          </Text>
        </>
      )}
    </View>
  </TouchableOpacity>
));

const continueStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cover: { width: 60, height: 90, borderRadius: 8, marginRight: 12 },
  info: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 4 },
  author: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 8 },
  barTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 4,
  },
  barFill: { height: '100%', borderRadius: 2 },
  pctText: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
});

// ---------------------------------------------------------------------------
// HeroPanel (main export)
// ---------------------------------------------------------------------------
interface HeroPanelProps {
  username: string;
  profile: UserProfile | null;
  readingGoal: { current: number; total: number };
  progressPercentage: number;
  lastReadBooks: Novel[];
  continueReading: Novel[];
  primaryColor: string;
  onSearchPress: () => void;
  onProfilePress: () => void;
  onBookPress: (id: string) => void;
  onBookLongPress: (book: Novel) => void;
}

const lastReadKeyExtractor = (item: Novel) => `lr-${item.id}`;
const continueKeyExtractor = (item: Novel) => `cr-${item.id}`;

const HeroPanel = memo(({
  username,
  profile,
  readingGoal,
  progressPercentage,
  lastReadBooks,
  continueReading,
  primaryColor,
  onSearchPress,
  onProfilePress,
  onBookPress,
  onBookLongPress,
}: HeroPanelProps) => {
  const insets = useSafeAreaInsets();

  const renderLastRead = useCallback(
    ({ item }: { item: Novel }) => (
      <LastReadBookItem item={item} onPress={onBookPress} onLongPress={onBookLongPress} />
    ),
    [onBookPress, onBookLongPress],
  );

  const renderContinue = useCallback(
    ({ item }: { item: Novel }) => (
      <ContinueCard item={item} onPress={onBookPress} onLongPress={onBookLongPress} primaryColor={primaryColor} />
    ),
    [onBookPress, onBookLongPress, primaryColor],
  );

  return (
    <View
      style={[
        styles.hero,
        {
          backgroundColor: primaryColor,
          paddingTop: insets.top + 8,
          // Rounded bottom corners only
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        },
      ]}
    >
      {/* ── Header row ── */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello {username}!</Text>
          <Text style={styles.subGreeting}>Let's start reading</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.searchBtn} onPress={onSearchPress}>
            <Search size={22} color={primaryColor} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onProfilePress}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={[styles.avatarInitial, { color: primaryColor }]}>
                  {username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Reading goal ── */}
      <View style={styles.goalBox}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>Your Goal</Text>
          <Text style={styles.goalEdit}>Edit</Text>
        </View>
        <View style={styles.goalProgress}>
          <View style={styles.goalStats}>
            <Text style={styles.goalCount}>
              {readingGoal.current}/{readingGoal.total}
            </Text>
            <Text style={styles.goalLabel}>Books</Text>
          </View>
          <View style={styles.goalBarContainer}>
            <View style={styles.goalBar}>
              <View
                style={[
                  styles.goalBarFill,
                  { width: `${Math.min(progressPercentage, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.goalPct}>{Math.round(progressPercentage)}%</Text>
          </View>
        </View>

        {/* Last-read quick strip */}
        {lastReadBooks.length > 0 && (
          <View style={styles.lastReadSection}>
            <Text style={styles.lastReadLabel}>Continue from where you left off</Text>
            <FlatList
              data={lastReadBooks}
              renderItem={renderLastRead}
              keyExtractor={lastReadKeyExtractor}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.lastReadList}
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={3}
              removeClippedSubviews={false}
            />
          </View>
        )}
      </View>

      {/* ── Continue Reading ── */}
      {continueReading.length > 0 && (
        <View style={styles.continueSection}>
          <Text style={styles.continueTitle}>Continue Reading</Text>
          <FlatList
            data={continueReading}
            renderItem={renderContinue}
            keyExtractor={continueKeyExtractor}
            scrollEnabled={false}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={3}
            removeClippedSubviews={false}
          />
        </View>
      )}

      {/* Bottom padding so rounded edge has breathing room */}
      <View style={styles.heroPadding} />
    </View>
  );
});

HeroPanel.displayName = 'HeroPanel';
export default HeroPanel;

const styles = StyleSheet.create({
  hero: {
    // no horizontal margin — spans full width
    overflow: 'hidden', // clips the rounded bottom corners cleanly
    // shadow to lift it off the scroll content below
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 2 },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '700' },
  // Goal
  goalBox: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  goalEdit: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  goalProgress: { flexDirection: 'row', alignItems: 'center' },
  goalStats: { marginRight: 16 },
  goalCount: { fontSize: 30, fontWeight: '700', color: '#fff', marginBottom: 2 },
  goalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  goalBarContainer: { flex: 1 },
  goalBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  goalBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  goalPct: { fontSize: 12, color: '#fff', textAlign: 'right' },
  lastReadSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },
  lastReadLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 10 },
  lastReadList: { gap: 10 },
  // Continue reading
  continueSection: { paddingHorizontal: 20, marginBottom: 4 },
  continueTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  heroPadding: { height: 20 },
});