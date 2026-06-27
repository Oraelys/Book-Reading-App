// app/(tabs)/author-dashboard.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';

import { Story, Tag } from '@/types/author';
import StoryCard from '@/components/author/StoryCard';
import EmptyStateTiles from '@/components/author/EmptyStateTiles';

const keyExtractor = (item: Story) => item.id;

export default function AuthorDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const loadDashboard = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Author's novels
      const { data: novelsData, error: novelsError } = await supabase
        .from('novels')
        .select('id, title, cover_image_url, views, status')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (novelsError) {
        console.warn('[AuthorDashboard] novels:', novelsError.message);
        return;
      }

      const novels = novelsData ?? [];
      if (novels.length === 0) {
        setStories([]);
        return;
      }

      const novelIds = novels.map(n => n.id);

      // 2. Chapter stats per novel (total + published)
      const { data: chapterStatsData, error: chapterStatsError } = await supabase
        .from('novel_chapter_stats')
        .select('novel_id, total_chapters, published_chapters')
        .in('novel_id', novelIds);

      if (chapterStatsError) {
        console.warn('[AuthorDashboard] chapter stats:', chapterStatsError.message);
      }
      const chapterStatsMap = new Map(
        (chapterStatsData ?? []).map(s => [s.novel_id, s]),
      );

      // 3. Tags — two-step query since these novels may be private drafts
      //    (novels_with_tags view doesn't expose non-public rows)
      const { data: novelTagRows, error: novelTagError } = await supabase
        .from('novel_tags')
        .select('novel_id, tag_id')
        .in('novel_id', novelIds);

      if (novelTagError) {
        console.warn('[AuthorDashboard] novel_tags:', novelTagError.message);
      }

      let tagsById = new Map<string, Tag>();
      if (novelTagRows && novelTagRows.length > 0) {
        const tagIds = Array.from(new Set(novelTagRows.map(r => r.tag_id)));
        const { data: tagRows, error: tagError } = await supabase
          .from('tags')
          .select('id, name, slug, category')
          .in('id', tagIds);

        if (tagError) {
          console.warn('[AuthorDashboard] tags:', tagError.message);
        }
        tagsById = new Map((tagRows ?? []).map(t => [t.id, t as Tag]));
      }

      const tagsByNovel = new Map<string, Tag[]>();
      for (const row of novelTagRows ?? []) {
        const tag = tagsById.get(row.tag_id);
        if (!tag) continue;
        if (!tagsByNovel.has(row.novel_id)) tagsByNovel.set(row.novel_id, []);
        tagsByNovel.get(row.novel_id)!.push(tag);
      }

      // 4. Merge everything into Story[]
      const merged: Story[] = novels.map(n => {
        const chStats = chapterStatsMap.get(n.id);
        return {
          id: n.id,
          title: n.title,
          cover_image_url: n.cover_image_url,
          tags: tagsByNovel.get(n.id) ?? [],
          total_chapters: chStats?.total_chapters ?? 0,
          published_chapters: chStats?.published_chapters ?? 0,
          views: n.views ?? 0,
          status: (n.status ?? 'draft') as Story['status'],
        };
      });

      setStories(merged);
    } catch (e) {
      console.warn('[AuthorDashboard] loadDashboard:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleStoryPress = useCallback((story: Story) => {
    router.push({
      pathname: '/story-page',
      params: { storyId: story.id },
    } as any);
  }, [router]);

  const handleStoriesPress = useCallback(() => {
    router.push('/(tabs)/author-dashboard');
  }, [router]);

  const handleSeriesPress = useCallback(() => {
    router.push('/(tabs)/series-screen' as any);
  }, [router]);

  const handleCreatePress = useCallback(() => {
    router.push("/../components/author/create-novel" as any);
  }, [router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

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

  const listHeader = useMemo(() => (
    <Text style={[styles.pageTitle, { color: theme.text }]}>My Stories</Text>
  ), [theme, styles.pageTitle]);

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

  if (stories.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.emptyListContent}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.pageTitle, { color: theme.text }]}>Write</Text>
          <EmptyStateTiles
            onStoriesPress={handleStoriesPress}
            onSeriesPress={handleSeriesPress}
            onCreatePress={handleCreatePress}
            theme={theme}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <FlatList
        data={stories}
        renderItem={renderStory}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews={true}
      />
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
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    emptyListContent: { paddingBottom: 40, flexGrow: 1 },
  });