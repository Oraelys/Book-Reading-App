// app/create-series.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DraggableFlatList, {
  RenderItemParams, ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';
import { Story } from '@/types/author';

import ScreenHeader from '@/components/author/ScreenHeader';
import FormInput from '@/components/author/FormInput';
import FormTextArea from '@/components/author/FormTextArea';
import ReadingOrderSelector, { ReadingOrder } from '@/components/author/ReadingOrderSelector';
import StorySelectRow from '@/components/author/StorySelectRow';

export default function CreateSeriesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  // Form state
  const [seriesName, setSeriesName] = useState('');
  const [description, setDescription] = useState('');
  const [readingOrder, setReadingOrder] = useState<ReadingOrder>('sequential');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [orderedStories, setOrderedStories] = useState<Story[]>([]);

  // Data state
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Validation
  const [errors, setErrors] = useState<{ name?: string; stories?: string }>({});

  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  // ---------------------------------------------------------------------------
  // Load author's stories
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: novelsData, error: novelsError } = await supabase
          .from('novels')
          .select('id, title, cover_image_url, views, status')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (novelsError) {
          console.warn('[CreateSeries] novels:', novelsError.message);
          return;
        }

        const novels = novelsData ?? [];
        const novelIds = novels.map(n => n.id);

        if (novelIds.length === 0) {
          setAllStories([]);
          return;
        }

        const { data: statsData } = await supabase
          .from('novel_chapter_stats')
          .select('novel_id, total_chapters, published_chapters')
          .in('novel_id', novelIds);

        const statsMap = new Map((statsData ?? []).map(s => [s.novel_id, s]));

        const stories: Story[] = novels.map(n => {
          const s = statsMap.get(n.id);
          return {
            id: n.id,
            title: n.title,
            cover_image_url: n.cover_image_url,
            tags: [],
            total_chapters: s?.total_chapters ?? 0,
            published_chapters: s?.published_chapters ?? 0,
            views: n.views ?? 0,
            status: (n.status ?? 'draft') as Story['status'],
          };
        });

        setAllStories(stories);
      } catch (e) {
        console.warn('[CreateSeries] loadStories:', e);
      } finally {
        setLoadingStories(false);
      }
    })();
  }, [user]);

  // ---------------------------------------------------------------------------
  // Keep orderedStories in sync with selection + reading order
  // When switching to sequential, build initial order from allStories order.
  // When toggling selection, add/remove from the ordered list.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (readingOrder === 'sequential') {
      setOrderedStories(prev => {
        const prevIds = new Set(prev.map(s => s.id));
        // Add newly selected stories at the end
        const toAdd = allStories.filter(s => selectedIds.has(s.id) && !prevIds.has(s.id));
        // Remove deselected stories
        const filtered = prev.filter(s => selectedIds.has(s.id));
        return [...filtered, ...toAdd];
      });
    }
  }, [selectedIds, readingOrder, allStories]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleToggleStory = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setErrors(e => ({ ...e, stories: undefined }));
  }, []);

  const handleDragEnd = useCallback(({ data }: { data: Story[] }) => {
    setOrderedStories(data);
  }, []);

  const handleReadingOrderChange = useCallback((order: ReadingOrder) => {
    setReadingOrder(order);
  }, []);

  const validate = useCallback((): boolean => {
    const next: typeof errors = {};
    if (!seriesName.trim()) next.name = 'Series name is required.';
    if (selectedIds.size === 0) next.stories = 'Select at least one story.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [seriesName, selectedIds]);

  const handleCreate = useCallback(async () => {
    if (!validate() || !user) return;
    setSubmitting(true);
    try {
      // 1. Insert series
      const { data: seriesRow, error: seriesError } = await supabase
        .from('series')
        .insert({
          title: seriesName.trim(),
          description: description.trim() || null,
          reading_order: readingOrder,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (seriesError || !seriesRow) {
        console.warn('[CreateSeries] insert series:', seriesError?.message);
        Alert.alert('Error', 'Could not create series. Please try again.');
        return;
      }

      // 2. Insert series_novels junction rows (ordered for sequential)
      const storiesToInsert = readingOrder === 'sequential'
        ? orderedStories
        : allStories.filter(s => selectedIds.has(s.id));

      const junctionRows = storiesToInsert.map((s, index) => ({
        series_id: seriesRow.id,
        novel_id: s.id,
        sort_order: index,
      }));

      const { error: junctionError } = await supabase
        .from('series_novels')
        .insert(junctionRows);

      if (junctionError) {
        console.warn('[CreateSeries] insert series_novels:', junctionError.message);
        Alert.alert('Error', 'Series created but stories could not be linked.');
        return;
      }

      router.back();
    } catch (e) {
      console.warn('[CreateSeries] handleCreate:', e);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [validate, user, seriesName, description, readingOrder, orderedStories, allStories, selectedIds, router]);

  const handleCancel = useCallback(() => router.back(), [router]);

  // ---------------------------------------------------------------------------
  // Draggable render item (sequential mode)
  // ---------------------------------------------------------------------------
  const renderDraggableItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Story>) => (
      <ScaleDecorator>
        <StorySelectRow
          story={item}
          selected={selectedIds.has(item.id)}
          showDragHandle
          onToggle={handleToggleStory}
          drag={drag}
          isActive={isActive}
          theme={theme}
        />
      </ScaleDecorator>
    ),
    [selectedIds, handleToggleStory, theme],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const isSequential = readingOrder === 'sequential';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader title="Create Series" theme={theme} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Series Name */}
        <FormInput
          label="Series Name"
          placeholder="Enter series name"
          value={seriesName}
          onChangeText={text => {
            setSeriesName(text);
            setErrors(e => ({ ...e, name: undefined }));
          }}
          theme={theme}
          error={errors.name}
          returnKeyType="next"
        />

        {/* Description */}
        <FormTextArea
          label="Description"
          placeholder="What is this series about? (optional)"
          value={description}
          onChangeText={setDescription}
          theme={theme}
          minHeight={110}
        />

        {/* Reading Order */}
        <ReadingOrderSelector
          value={readingOrder}
          onChange={handleReadingOrderChange}
          theme={theme}
        />

        {/* Story selector */}
        <View style={styles.storySection}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            STORIES
          </Text>
          {errors.stories ? (
            <Text style={styles.sectionError}>{errors.stories}</Text>
          ) : null}

          {loadingStories ? (
            <ActivityIndicator color={theme.primary} style={styles.loader} />
          ) : allStories.length === 0 ? (
            <View style={[styles.emptyStories, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.emptyStoriesText, { color: theme.textSecondary }]}>
                You have no stories yet. Create a story first.
              </Text>
            </View>
          ) : isSequential ? (
            // Draggable list — only shows selected stories in drag order
            <>
              {/* Unselected stories — normal tap to add */}
              {allStories
                .filter(s => !selectedIds.has(s.id))
                .map(story => (
                  <StorySelectRow
                    key={story.id}
                    story={story}
                    selected={false}
                    showDragHandle={false}
                    onToggle={handleToggleStory}
                    theme={theme}
                  />
                ))}
              {/* Selected stories — draggable */}
              {orderedStories.length > 0 && (
                <>
                  <Text style={[styles.orderHint, { color: theme.textSecondary }]}>
                    Long-press to reorder selected stories
                  </Text>
                  <DraggableFlatList
                    data={orderedStories}
                    keyExtractor={s => s.id}
                    onDragEnd={handleDragEnd}
                    renderItem={renderDraggableItem}
                    scrollEnabled={false}
                    activationDistance={10}
                  />
                </>
              )}
            </>
          ) : (
            // Collection mode — plain multi-select, no drag handles
            allStories.map(story => (
              <StorySelectRow
                key={story.id}
                story={story}
                selected={selectedIds.has(story.id)}
                showDragHandle={false}
                onToggle={handleToggleStory}
                theme={theme}
              />
            ))
          )}
        </View>

        {/* Bottom action buttons */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleCancel}
            style={[styles.cancelButton, { borderColor: theme.border }]}
          >
            <Text style={[styles.cancelLabel, { color: theme.textSecondary }]}>Cancel</Text>
          </Pressable>

          <Pressable
            onPress={handleCreate}
            disabled={submitting}
            style={[
              styles.createButton,
              { backgroundColor: theme.primary },
              submitting && styles.buttonDisabled,
            ]}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={styles.createLabel}>Create Series</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any, _isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 60,
    },

    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionError: {
      color: '#EF4444',
      fontSize: 12,
      marginBottom: 8,
      marginTop: -4,
    },
    storySection: { marginBottom: 20 },

    loader: { paddingVertical: 24 },

    emptyStories: {
      borderRadius: 12,
      
      padding: 20,
      alignItems: 'center',
    },
    emptyStoriesText: {
      fontSize: 14,
      textAlign: 'center',
    },

    orderHint: {
      fontSize: 12,
      marginBottom: 8,
      fontStyle: 'italic',
    },

    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 8,
    },
    cancelButton: {
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderRadius: 12,
      
    },
    cancelLabel: {
      fontSize: 15,
      fontWeight: '600',
    },
    createButton: {
      paddingHorizontal: 24,
      paddingVertical: 13,
      borderRadius: 12,
      minWidth: 140,
      alignItems: 'center',
    },
    createLabel: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },
    buttonDisabled: { opacity: 0.6 },
  });