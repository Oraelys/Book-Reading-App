// app/stories-management.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, RefreshControl, StyleSheet, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BookOpen, FileText } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';

import { Story, PublishedChapter } from '@/types/author';
import ScreenHeader from '@/components/author/ScreenHeader';
import StoryCard from '@/components/author/StoryCard';
import PublishedChapterRow from '@/components/author/PublishedChapterRow';
import EmptyTabState from '@/components/author/EmptyTabState';

type TabKey = 'chapters' | 'stories';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'chapters', label: 'Published Chapters' },
  { key: 'stories', label: 'Stories' },
];

const chapterKeyExtractor = (item: PublishedChapter) => item.id;
const storyKeyExtractor = (item: Story) => item.id;

export default function StoriesManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<TabKey>('chapters');

  const [chapters, setChapters] = useState<PublishedChapter[]>([]);
  const [stories, setStories] = useState<Story[]>([]);

  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  // ---------------------------------------------------------------------------
  // Published chapters — two-step query: author's novel ids, then their
  // published chapters, joined to story titles via a Map.
  // ---------------------------------------------------------------------------
  const loadChapters = useCallback(async () => {
    if (!user) return;
    try {
      const { data: novelsData, error: novelsError } = await supabase
        .from('novels')
        .select('id, title')
        .eq('created_by', user.id);

      if (novelsError) {
        console.warn('[StoriesManagement] novels:', novelsError.message);
        return;
      }

      const novels = novelsData ?? [];
      if (novels.length === 0) { setChapters([]); return; }

      const novelTitleById = new Map(novels.map(n => [n.id, n.title]));
      const novelIds = novels.map(n => n.id);

      const { data: chapterRows, error: chapterError } = await supabase
        .from('chapters')
        .select('id, novel_id, title, published_at, views, reads')
        .in('novel_id', novelIds)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (chapterError) {
        console.warn('[StoriesManagement] chapters:', chapterError.message);
        return;
      }

      const merged: PublishedChapter[] = (chapterRows ?? []).map(c => ({
        id: c.id,
        novel_id: c.novel_id,
        title: c.title,
        story_title: novelTitleById.get(c.novel_id) ?? 'Untitled',
        published_at: c.published_at,
        views: c.views ?? 0,
        reads: c.reads ?? 0,
      }));

      setChapters(merged);
    } catch (e) {
      console.warn('[StoriesManagement] loadChapters:', e);
    } finally {
      setChaptersLoading(false);
    }
  }, [user]);

  // ---------------------------------------------------------------------------
  // Stories — novels + chapter stats + follower counts via Maps.
  // ---------------------------------------------------------------------------
  const loadStories = useCallback(async () => {
    if (!user) return;
    try {
      const { data: novelsData, error: novelsError } = await supabase
        .from('novels')
        .select('id, title, cover_image_url, views, status')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (novelsError) {
        console.warn('[StoriesManagement] novels:', novelsError.message);
        return;
      }

      const novels = novelsData ?? [];
      if (novels.length === 0) { setStories([]); return; }

      const novelIds = novels.map(n => n.id);

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

      const { data: followerRows, error: followerError } = await supabase
        .from('story_followers')
        .select('novel_id')
        .in('novel_id', novelIds);

      if (followerError) {
        console.warn('[StoriesManagement] story_followers:', followerError.message);
      }
      const followerCountMap = new Map<string, number>();
      for (const row of followerRows ?? []) {
        followerCountMap.set(row.novel_id, (followerCountMap.get(row.novel_id) ?? 0) + 1);
      }

      const merged: Story[] = novels.map(n => {
        const chStats = chapterStatsMap.get(n.id);
        return {
          id: n.id,
          title: n.title,
          cover_image_url: n.cover_image_url,
          tags: [],
          total_chapters: chStats?.total_chapters ?? 0,
          published_chapters: chStats?.published_chapters ?? 0,
          views: n.views ?? 0,
          followers: followerCountMap.get(n.id) ?? 0,
          status: (n.status ?? 'draft') as Story['status'],
        };
      });

      setStories(merged);
    } catch (e) {
      console.warn('[StoriesManagement] loadStories:', e);
    } finally {
      setStoriesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadChapters();
    loadStories();
  }, [loadChapters, loadStories]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleChapterPress = useCallback((chapter: PublishedChapter) => {
    router.push({
      pathname: '/chapter-details',
      params: { chapterId: chapter.id, novelId: chapter.novel_id },
    } as any);
  }, [router]);

  const handleStoryPress = useCallback((story: Story) => {
    router.push({
      pathname: '/author-story-details',
      params: { storyId: story.id },
    } as any);
  }, [router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadChapters(), loadStories()]);
    setRefreshing(false);
  }, [loadChapters, loadStories]);

  const renderChapter = useCallback(
    ({ item }: { item: PublishedChapter }) => (
      <PublishedChapterRow chapter={item} onPress={handleChapterPress} theme={theme} />
    ),
    [handleChapterPress, theme],
  );

  const renderStory = useCallback(
    ({ item }: { item: Story }) => (
      <StoryCard story={item} onPress={handleStoryPress} theme={theme} />
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

  const chapterEmpty = useMemo(() => (
    <EmptyTabState
      icon={FileText}
      title="No published chapters"
      subtitle="Chapters you publish will show up here."
      theme={theme}
    />
  ), [theme]);

  const storyEmpty = useMemo(() => (
    <EmptyTabState
      icon={BookOpen}
      title="No stories yet"
      subtitle="Stories you create will show up here."
      theme={theme}
    />
  ), [theme]);

  const handleTabChange = useCallback((key: TabKey) => setActiveTab(key), []);
  const isLoading = activeTab === 'chapters' ? chaptersLoading : storiesLoading;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader title="Stories" theme={theme} />

      {/* Tab bar — full-width, no background, no border, colour-only indicator */}
      <View style={[styles.tabBar, ]}>
        {TABS.map(tab => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => handleTabChange(tab.key)}
              style={[
                styles.tabItem,
                isActive && { borderBottomColor: theme.primary },
              ]}
              hitSlop={8}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? theme.primary : theme.text },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : activeTab === 'chapters' ? (
        <FlatList
          data={chapters}
          renderItem={renderChapter}
          keyExtractor={chapterKeyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListEmptyComponent={chapterEmpty}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
        />
      ) : (
        <FlatList
          data={stories}
          renderItem={renderStory}
          keyExtractor={storyKeyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListEmptyComponent={storyEmpty}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={7}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (theme: any, _isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    tabBar: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: 'transparent', // overridden by theme.border inline
      marginBottom: 16,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabLabel: {
      fontSize: 14,
      fontWeight: '600',
    },

    listContent: {
      paddingHorizontal: 20,
      paddingTop: 4,
      paddingBottom: 40,
      flexGrow: 1,
    },
  });