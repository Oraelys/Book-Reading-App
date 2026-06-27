// app/(tabs)/index.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, RefreshControl, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';
import { BookOpen } from 'lucide-react-native';
import BookRecommendationModal from '@/app/BookRecommendationModal';

import {
  Novel, UserProfile, Advertisement, CategorySection,
} from '@/types/home';
import HeaderSection from '@/components/home/HeaderSection';
import AdCarousel from '@/components/home/AdCarousel';
import ContinueReadingSection from '@/components/home/ContinueReadingSection';
import BookSection from '@/components/home/BookSection';
import SearchModalView from '@/components/home/SearchModalView';
import {
  CarouselSkeleton, ContinueReadingSkeleton, BookSectionSkeleton,
} from '@/components/home/Skeletons';
// TODO: remove this import and USE_MOCK once real data is confirmed working
import {
  MOCK_CONTINUE_READING, MOCK_NOVELS_BY_CATEGORY, MOCK_ADS,
} from '@/lib/mockData';

// Flip to false once your Supabase data is populated
const USE_MOCK = true;

// Major genres shown as sections — order determines render order
const MAJOR_GENRES = [
  'Romance', 'Mystery', 'Fantasy', 'Sci-Fi', 'Thriller', 'Horror', 'Adventure',
];

const SECTION_LIMIT = 10;

// ---------------------------------------------------------------------------
// Personalised section heading copy — no emojis
// ---------------------------------------------------------------------------
function buildLabel(
  category: string,
  sectionType: CategorySection['sectionType'],
): string {
  if (sectionType === 'next_read') return 'Your Next Read';
  if (sectionType === 'preferred') {
    const map: Record<string, string> = {
      Romance: 'Because You Love Romance',
      Mystery: 'More Mysteries For You',
      Fantasy: 'Fantasy Picks For You',
      'Sci-Fi': 'Sci-Fi Picks For You',
      Thriller: 'Thrillers For You',
      Horror: 'Horror Picks For You',
      Adventure: 'Adventure Picks For You',
    };
    return map[category] ?? `More ${category} For You`;
  }
  return category;
}

// ---------------------------------------------------------------------------
// HomeScreen
// ---------------------------------------------------------------------------
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  // Granular loading flags — each section shows its skeleton independently
  const [adsLoading, setAdsLoading] = useState(true);
  const [continueLoading, setContinueLoading] = useState(true);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [continueReading, setContinueReading] = useState<Novel[]>([]);
  // novels grouped by category — Map<category, Novel[]>
  const [novelsByCategory, setNovelsByCategory] = useState<Map<string, Novel[]>>(new Map());

  // UI
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Novel | null>(null);

  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  // ---------------------------------------------------------------------------
  // Derived: ordered list of sections
  // First section = "Your Next Read" from the top preferred genre.
  // Then remaining preferred genres labelled "Because You Love X".
  // Then all other major genres in MAJOR_GENRES order.
  // ---------------------------------------------------------------------------
  const categorySections = useMemo((): CategorySection[] => {
    if (novelsByCategory.size === 0) return [];

    const preferred: string[] = profile?.preferred_categories ?? [];
    const sections: CategorySection[] = [];
    const covered = new Set<string>();

    // 1. "Your Next Read" — books from the user's top preferred genre
    if (preferred.length > 0) {
      const topCat = preferred[0];
      const books = novelsByCategory.get(topCat) ?? [];
      if (books.length > 0) {
        covered.add(topCat);
        sections.push({
          category: topCat,
          books: books.slice(0, SECTION_LIMIT),
          sectionType: 'next_read',
          label: buildLabel(topCat, 'next_read'),
        });
      }
    }

    // 2. Remaining preferred genres
    for (const cat of preferred.slice(1)) {
      const books = novelsByCategory.get(cat) ?? [];
      if (books.length > 0 && !covered.has(cat)) {
        covered.add(cat);
        sections.push({
          category: cat,
          books: books.slice(0, SECTION_LIMIT),
          sectionType: 'preferred',
          label: buildLabel(cat, 'preferred'),
        });
      }
    }

    // 3. Remaining major genres in MAJOR_GENRES order
    for (const cat of MAJOR_GENRES) {
      if (covered.has(cat)) continue;
      const books = novelsByCategory.get(cat) ?? [];
      if (books.length > 0) {
        sections.push({
          category: cat,
          books: books.slice(0, SECTION_LIMIT),
          sectionType: 'category',
          label: buildLabel(cat, 'category'),
        });
      }
    }

    return sections;
  }, [novelsByCategory, profile?.preferred_categories]);

  // ---------------------------------------------------------------------------
  // Kick off all fetches in parallel — starts loading during splash
  // ---------------------------------------------------------------------------
  const fetchAll = useCallback(() => {
    if (!user) return;
    loadProfile();
    loadAds();
    loadContinueReading();
    loadNovels();
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ---------------------------------------------------------------------------
  // Profile
  // ---------------------------------------------------------------------------
  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, preferred_categories')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('[Home] profile:', error.message);
      }

      if (data) {
        setProfile(data);
      } else {
        const username = user.email?.split('@')[0] ?? 'reader';
        const { data: created } = await supabase
          .from('profiles')
          .insert({ id: user.id, username, email: user.email ?? '', avatar_url: null })
          .select('username, avatar_url, preferred_categories')
          .single();
        if (created) setProfile(created);
      }
    } catch (e) {
      console.warn('[Home] loadProfile:', e);
    }
  };

  // ---------------------------------------------------------------------------
  // Advertisements
  // ---------------------------------------------------------------------------
  const loadAds = async () => {
    if (USE_MOCK) {
      setAds(MOCK_ADS);
      setAdsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('id, image_url, title, subtitle, link_type, link_value, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(6);

      if (error) console.warn('[Home] ads:', error.message);
      const result = (data as Advertisement[]) ?? [];
      setAds(result.length > 0 ? result : MOCK_ADS);
    } catch (e) {
      console.warn('[Home] loadAds:', e);
      setAds(MOCK_ADS);
    } finally {
      setAdsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Continue reading
  // Fix: query reading_progress joined to novels. Supabase requires the FK
  // relationship name. If the FK hint doesn't resolve, we fall back to a
  // two-step query using in() on the book_ids.
  // ---------------------------------------------------------------------------
  const loadContinueReading = async () => {
    if (USE_MOCK) {
      setContinueReading(MOCK_CONTINUE_READING);
      setContinueLoading(false);
      return;
    }
    if (!user) return;
    try {
      const { data: progressRows, error: progressError } = await supabase
        .from('reading_progress')
        .select('book_id, progress_percentage, current_page, last_read')
        .eq('user_id', user.id)
        .gt('progress_percentage', 0)
        .lt('progress_percentage', 100)
        .order('last_read', { ascending: false })
        .limit(6);

      console.log('[CR] progressRows:', JSON.stringify(progressRows));
      console.log('[CR] progressError:', progressError?.message);

      if (progressError || !progressRows || progressRows.length === 0) {
        setContinueReading(MOCK_CONTINUE_READING);
        return;
      }

      const bookIds = progressRows.map((r: any) => r.book_id);
      const { data: novelsData, error: novelsError } = await supabase
        .from('novels')
        .select('id, title, author, description, category, cover_image_url, rating, total_ratings, views')
        .in('id', bookIds)
        .eq('is_public', true);

      if (novelsError || !novelsData || novelsData.length === 0) {
        setContinueReading(MOCK_CONTINUE_READING);
        return;
      }

      const novelMap = new Map((novelsData ?? []).map((n: any) => [n.id, n]));
      const merged = progressRows
        .filter((r: any) => novelMap.has(r.book_id))
        .map((r: any) => ({
          ...novelMap.get(r.book_id)!,
          reading_progress: {
            progress_percentage: r.progress_percentage,
            current_page: r.current_page,
          },
        })) as Novel[];

      setContinueReading(merged.length > 0 ? merged : MOCK_CONTINUE_READING);
    } catch (e) {
      console.warn('[Home] loadContinueReading:', e);
      setContinueReading(MOCK_CONTINUE_READING);
    } finally {
      setContinueLoading(false);
    }
  };

    // ---------------------------------------------------------------------------
  // Novels grouped by major category + their tags for the book card pills
  // ---------------------------------------------------------------------------
  const loadNovels = async () => {
    if (USE_MOCK) {
      const grouped = new Map<string, Novel[]>(
        Object.entries(MOCK_NOVELS_BY_CATEGORY)
      );
      setNovelsByCategory(grouped);
      setSectionsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('novels_with_tags')
        .select('id, title, author, description, category, cover_image_url, rating, total_ratings, views, tags')
        .eq('is_public', true)
        .order('views', { ascending: false })
        .limit(200);

      console.log('[Novels] total fetched:', data?.length, 'error:', error?.message);

      if (error || !data || data.length === 0) {
        // Fall back to mock
        const grouped = new Map<string, Novel[]>(Object.entries(MOCK_NOVELS_BY_CATEGORY));
        setNovelsByCategory(grouped);
        return;
      }

      const grouped = new Map<string, Novel[]>();
      for (const novel of data as Novel[]) {
        const cat = novel.category;
        if (!cat) continue;
        if (!grouped.has(cat)) grouped.set(cat, []);
        grouped.get(cat)!.push(novel);
      }

      console.log('[Novels] categories:', Array.from(grouped.keys()));

      // If real data has no recognisable categories, use mock
      const hasKnownCategory = MAJOR_GENRES.some(g => grouped.has(g));
      if (!hasKnownCategory) {
        const mockGrouped = new Map<string, Novel[]>(Object.entries(MOCK_NOVELS_BY_CATEGORY));
        setNovelsByCategory(mockGrouped);
      } else {
        setNovelsByCategory(grouped);
      }
    } catch (e) {
      console.warn('[Home] loadNovels:', e);
      const grouped = new Map<string, Novel[]>(Object.entries(MOCK_NOVELS_BY_CATEGORY));
      setNovelsByCategory(grouped);
    } finally {
      setSectionsLoading(false);
    }
  };

    // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleBookPress = useCallback(async (bookId: string) => {
    try { await supabase.rpc('increment_book_views', { book_id: bookId }); } catch { /* ok */ }
    router.push({ pathname: '/book-details', params: { bookId } } as any);
  }, [router]);

  const handleBookLongPress = useCallback((book: Novel) => {
    setSelectedBook(book);
    setShowRecommendModal(true);
  }, []);

  const handleAdPress = useCallback((ad: Advertisement) => {
    if (ad.link_type === 'book') {
      handleBookPress(ad.link_value);
    } else {
      router.push({
        pathname: '/(tabs)/library-screen',
        params: { category: ad.link_value },
      } as any);
    }
  }, [handleBookPress, router]);

  const handleSeeAll = useCallback((category: string) => {
    router.push({
      pathname: '/(tabs)/library-screen',
      params: { category },
    } as any);
  }, [router]);

  const handleCloseRecommendModal = useCallback(() => {
    setShowRecommendModal(false);
    setSelectedBook(null);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setAdsLoading(true);
    setContinueLoading(true);
    setSectionsLoading(true);
    fetchAll();
    // let granular flags resolve themselves
    setTimeout(() => setRefreshing(false), 1500);
  }, [fetchAll]);

  const handleOpenSearch = useCallback(() => setShowSearchModal(true), []);
  const handleCloseSearch = useCallback(() => setShowSearchModal(false), []);
  const handleProfilePress = useCallback(() => router.push('/(tabs)/profile-screen'), [router]);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  const username = useMemo(
    () => profile?.username ?? user?.email?.split('@')[0] ?? 'Reader',
    [profile?.username, user?.email],
  );

  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={theme.primary}
      colors={[theme.primary]}
    />
  ), [refreshing, onRefresh, theme.primary]);

  const modalStyles = useMemo(() => getModalStyles(theme), [theme]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        contentInsetAdjustmentBehavior="never"
      >
        {/* Header — immediate, no loading state needed */}
        <HeaderSection
          username={username}
          profile={profile}
          onSearchPress={handleOpenSearch}
          onProfilePress={handleProfilePress}
          theme={theme}
        />

        {/* Ad carousel */}
        {adsLoading ? (
          <CarouselSkeleton theme={theme} />
        ) : ads.length > 0 ? (
          <AdCarousel ads={ads} onPress={handleAdPress} theme={theme} />
        ) : null}

        {/* Continue reading */}
        {continueLoading ? (
          <ContinueReadingSkeleton theme={theme} />
        ) : (
          <ContinueReadingSection
            books={continueReading}
            onBookPress={handleBookPress}
            onBookLongPress={handleBookLongPress}
            theme={theme}
          />
        )}

        {/* Major-genre sections — personalised order */}
        {sectionsLoading ? (
          <>
            <BookSectionSkeleton theme={theme} />
            <BookSectionSkeleton theme={theme} />
            <BookSectionSkeleton theme={theme} />
          </>
        ) : categorySections.length === 0 ? (
          <View style={styles.empty}>
            <BookOpen size={52} color={theme.border} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No books yet</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Check back soon
            </Text>
          </View>
        ) : (
          categorySections.map(section => (
            <BookSection
              key={section.category + '-' + section.sectionType}
              label={section.label}
              category={section.category}
              books={section.books}
              onBookPress={handleBookPress}
              onBookLongPress={handleBookLongPress}
              onSeeAll={handleSeeAll}
              theme={theme}
            />
          ))
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      <SearchModalView
        visible={showSearchModal}
        onClose={handleCloseSearch}
        onBookPress={handleBookPress}
        onBookLongPress={handleBookLongPress}
        theme={theme}
        styles={modalStyles}
      />

      <BookRecommendationModal
        visible={showRecommendModal}
        book={selectedBook}
        onClose={handleCloseRecommendModal}
      />
    </View>
  );
}

const getStyles = (theme: any, _isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1 },
    empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    emptySub: { fontSize: 14, textAlign: 'center' },
    bottomPad: { height: 40 },
  });

const getModalStyles = (theme: any) =>
  StyleSheet.create({
    searchModal: { flex: 1 },
    searchModalHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
    },
    searchModalTitle: { fontSize: 18, fontWeight: '700' },
    searchModalInput: {
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 20, marginVertical: 16, paddingHorizontal: 16,
      height: 48, borderRadius: 24, gap: 12,
    },
    searchInput: { flex: 1, fontSize: 16 },
    searchCategoryContainer: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
    searchCategoryChip: {
      paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1,
    },
    searchCategoryText: { fontSize: 14, fontWeight: '600' },
    searchLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    searchEmptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
    searchEmptyText: { fontSize: 14, textAlign: 'center' },
    searchResultsList: { paddingHorizontal: 20, paddingBottom: 100 },
    searchResultItem: {
      flexDirection: 'row', backgroundColor: theme.surface,
      borderRadius: 12, padding: 12, marginBottom: 12,
    },
    searchResultImage: { width: 80, height: 120, borderRadius: 8, marginRight: 12 },
    searchResultInfo: { flex: 1 },
    searchResultTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    searchResultAuthor: { fontSize: 13, marginBottom: 6 },
    searchResultDescription: { fontSize: 12, lineHeight: 18, marginBottom: 8 },
    searchResultFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    searchResultRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    searchResultRatingText: { fontSize: 12, fontWeight: '600' },
    searchResultCategory: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    searchResultCategoryText: { fontSize: 11, fontWeight: '600' },
  });