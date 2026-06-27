
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';
import { BookOpen } from 'lucide-react-native';

import { Story, PublishedChapter } from '@/types/author';
import StoryCard from '@/components/author/StoryCard';
import ChapterRow from '@/components/author/ChapterRow';
import TabSwitcher from '@/components/author/TabSwitcher';

const TABS = ['Published Chapters', 'Stories'];

const chapterKeyExtractor = (item: PublishedChapter) => item.id;
const storyKeyExtractor = (item: Story) => item.id;

export default function StoriesManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<string>(TABS[0]);
  const [stories, setStories] = useState<Story[]>([]);
  const [publishedChapters, setPublishedChapters] = useState<PublishedChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  // ---------------------------------------------------------------------------
  // Data fetching — both tabs' data loaded together so switching tabs is instant
  // ---------------------------------------------------------------------------
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Author's novels (base info needed by both tabs)
      const { data: novelsData, error: novelsError } = await supabase
        .from('novels')
        .select('id, title, cover_image_url, views, status')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (novelsError) {
        console.warn('[StoriesManagement] novels:', novelsError.message);
        setStories([]);
        setPublishedChapters([]);
        return;
      }

      const novels = novelsData ?? [];
      if (novels.length === 0) {
        setStories([]);
        setPublishedChapters([]);
        return;
      }

      const novelIds = novels.map(n => n.id);
      const novelTitleMap = new Map(novels.map(n => [n.id, n.title]));

      // 2. Chapter stats per novel (total + published counts)
      const { data: chapterStatsData, error: chapterStatsError } = await supabase
        .from('novel_chapter_stats')
        .select('novel_id, total_chapters, published_chapters')
        .in('novel_id', novelIds);

      if (chapterStatsError) {
        console.warn('[StoriesManagement] chapter stats:', chapterStatsError.message);
      }
      const chapterStatsMap = new Map(
        (chapterStatsData ?? []).map(s => [s.novel_id, s]),
      );

      // 3. Follower counts per novel
      const { data: followerData, error: followerError } = await supabase
        .from('novel_follower_counts')
        .select('novel_id, followers')
        .in('novel_id', novelIds);

      if (followerError) {
        console.warn('[StoriesManagement] follower counts:', followerError.message);
      }
      const followerMap = new Map(
        (followerData ?? []).map(f => [f.novel_id, f.followers]),
      );

      // 4. Build Stories tab data
      const storyList: Story[] = novels.map(n => {
        const chStats = chapterStatsMap.get(n.id);
        return {
          id: n.id,
          title: n.title,
          cover_image_url: n.cover_image_url,
          tags: [],
          total_chapters: chStats?.total_chapters ?? 0,
          published_chapters: chStats?.published_chapters ?? 0,
          views: n.views ?? 0,
          followers: followerMap.get(n.id) ?? 0,
          status: (n.status ?? 'draft') as Story['status'],
        };
      });
      setStories(storyList);

      // 5. Build Published Chapters tab data
      const { data: chapterRows, error: chapterRowsError } = await supabase
        .from('chapters')
        .select('id, title, book_id, published_at, views, reads')
        .in('book_id', novelIds)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (chapterRowsError) {
        console.warn('[StoriesManagement] chapters:', chapterRowsError.message);
        setPublishedChapters([]);
        return;
      }

      const chapterList: PublishedChapter[] = (chapterRows ?? []).map(c => ({
        id: c.id,
        title: c.title ?? 'Untitled Chapter',
        story_id: c.book_id,
        story_title: novelTitleMap.get(c.book_id) ?? 'Unknown Story',
        published_at: c.published_at ?? '',
        views: c.views ?? 0,
        reads: c.reads ?? 0,
      }));
      setPublishedChapters(chapterList);
    } catch (e) {
      console.warn('[StoriesManagement] loadData:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleChapterPress = useCallback((chapter: PublishedChapter) => {
    router.push({
      pathname: '/chapter-details',
      params: { chapterId: chapter.id, storyId: chapter.story_id },
    } as any);
  }, [router]);

  const handleStoryPress = useCallback((story: Story) => {
    router.push({
      pathname: '/story-page',
      params: { storyId: story.id },
    } as any);
  }, [router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const renderChapter = useCallback(
    ({ item }: { item: PublishedChapter }) => (
      <ChapterRow chapter={item} onPress={handleChapterPress} theme={theme} />
    ),
    [handleChapterPress, theme],
  );

  const renderStory = useCallback(
    ({ item }: { item: Story }) => (
      <StoryCard story={item} onPress={handleStoryPress} theme={theme} variant="management" />
    ),
    [handleStoryPress, theme],
  );

  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={theme.primary}
      colors={[theme.primary]}
    />
  ), [refreshing, onRefresh, theme.primary]);

  const emptyChaptersComponent = useMemo(() => (
    <View style={styles.empty}>
      <BookOpen size={48} color={theme.border} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No published chapters</Text>
      <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
        Chapters you publish will show up here
      </Text>
    </View>
  ), [theme, styles]);

  const emptyStoriesComponent = useMemo(() => (
    <View style={styles.empty}>
      <BookOpen size={48} color={theme.border} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No stories yet</Text>
      <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
        Your stories will show up here
      </Text>
    </View>
  ), [theme, styles]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <Text style={[styles.pageTitle, { color: theme.text }]}>Manage Stories</Text>

      <TabSwitcher tabs={TABS} activeTab={activeTab} onChange={setActiveTab} theme={theme} />

      {activeTab === 'Published Chapters' ? (
        <FlatList
          data={publishedChapters}
          renderItem={renderChapter}
          keyExtractor={chapterKeyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListEmptyComponent={emptyChaptersComponent}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews={true}
        />
      ) : (
        <FlatList
          data={stories}
          renderItem={renderStory}
          keyExtractor={storyKeyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListEmptyComponent={emptyStoriesComponent}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews={true}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme: any, _isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    pageTitle: {
      fontSize: 24,
      fontWeight: '700',
      paddingHorizontal: 20,
      marginTop: 8,
      marginBottom: 16,
    },
    listContent: { paddingHorizontal: 20, paddingBottom: 40, flexGrow: 1 },
    empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 6 },
    emptySub: { fontSize: 13, textAlign: 'center' },
  });