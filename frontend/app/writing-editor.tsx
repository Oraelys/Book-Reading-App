// app/writing-editor.tsx
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator,
  Platform, KeyboardAvoidingView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, List, Send } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContexts';
import { useChapters } from '@/hooks/useChapters';
import { useAutosave } from '@/hooks/useAutosave';
import { Chapter } from '@/types/chapter';
import ChaptersListModal from '@/components/author/ChaptersListModal';
import AutosaveIndicator from '@/components/author/AutosaveIndicator';

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

export default function WritingEditorScreen() {
  const router = useRouter();
  // storyId comes from the Create Story flow (or from opening an existing
  // story to keep writing). This screen NEVER inserts into `novels` — it
  // only reads/writes chapters that belong to this id.
  const { novelId, title: storyTitleParam } = useLocalSearchParams<{
    novelId: string;
    title?: string;
  }>();
  const { theme, isDark } = useTheme();

  const {
    chapters, loading, createChapter, persistChapter, publishChapter,
  } = useChapters(novelId);

  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [chaptersModalVisible, setChaptersModalVisible] = useState(false);
  const [creatingChapter, setCreatingChapter] = useState(false);
  const [publishingChapter, setPublishingChapter] = useState(false);

  // Story-level (not chapter-level) publish status, fetched once.
  const [storyStatus, setStoryStatus] = useState<'draft' | 'published'>('draft');
  const [publishingStory, setPublishingStory] = useState(false);

  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    if (!novelId) return;
    (async () => {
      const { data, error } = await supabase
        .from('novels')
        .select('status')
        .eq('id', novelId)
        .single();
      if (error) {
        console.warn('[WritingEditor] load story status:', error.message);
        return;
      }
      if (data?.status === 'published') setStoryStatus('published');
    })();
  }, [novelId]);

  const activeChapter = useMemo(
    () => chapters.find(c => c.id === activeChapterId) ?? null,
    [chapters, activeChapterId],
  );

  // Select the first chapter once chapters load; auto-create one if the
  // story has none yet (e.g. a brand new story straight from "Skip").
  const autoCreateAttempted = useRef(false);
  useEffect(() => {
    if (loading) return;
    if (activeChapterId) return;

    if (chapters.length > 0) {
      setActiveChapterId(chapters[0].id);
      return;
    }

    if (!autoCreateAttempted.current) {
      autoCreateAttempted.current = true;
      (async () => {
        const newChapter = await createChapter();
        if (newChapter) setActiveChapterId(newChapter.id);
      })();
    }
  }, [loading, chapters, activeChapterId, createChapter]);

  // Sync local editable fields whenever the active chapter changes
  useEffect(() => {
    if (!activeChapter) return;
    setChapterTitle(activeChapter.title);
    setChapterContent(activeChapter.content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChapter?.id]);

  // ---------------------------------------------------------------------------
  // Autosave — title + content of the CURRENTLY selected chapter only
  // ---------------------------------------------------------------------------
  const autosavePayload = useMemo(
    () => ({ title: chapterTitle, content: chapterContent }),
    [chapterTitle, chapterContent],
  );

  const handleAutosave = useCallback(async (payload: { title: string; content: string }) => {
    if (!activeChapterId) return;
    await persistChapter(activeChapterId, {
      title: payload.title,
      content: payload.content,
      word_count: countWords(payload.content),
    });
  }, [activeChapterId, persistChapter]);

  const { status: autosaveStatus, flush } = useAutosave(autosavePayload, handleAutosave, 1200);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleBack = useCallback(async () => {
    await flush();
    router.back();
  }, [flush, router]);

  const handleSelectChapter = useCallback(async (chapter: Chapter) => {
    await flush();
    setActiveChapterId(chapter.id);
    setChaptersModalVisible(false);
  }, [flush]);

  const handleCreateChapter = useCallback(async () => {
    setCreatingChapter(true);
    await flush();
    const newChapter = await createChapter();
    setCreatingChapter(false);
    if (newChapter) {
      setActiveChapterId(newChapter.id);
      setChaptersModalVisible(false);
    }
  }, [flush, createChapter]);

  const handlePublishChapter = useCallback(() => {
    if (!activeChapterId || publishingChapter) return;

    Alert.alert(
      'Publish Chapter',
      `Publish "${chapterTitle || 'Untitled Chapter'}" to readers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: async () => {
            setPublishingChapter(true);
            await flush();
            const ok = await publishChapter(activeChapterId);
            setPublishingChapter(false);
            if (!ok) Alert.alert('Error', 'Could not publish chapter. Please try again.');
          },
        },
      ],
    );
  }, [activeChapterId, publishingChapter, chapterTitle, flush, publishChapter]);

  const handlePublishStory = useCallback(() => {
    if (!novelId || publishingStory) return;

    Alert.alert(
      'Publish Story',
      'This makes your story visible to readers. You can keep adding chapters afterward.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: async () => {
            setPublishingStory(true);
            const { error } = await supabase
              .from('novels')
              .update({ status: 'published', published_at: new Date().toISOString() })
              .eq('id', novelId);
            setPublishingStory(false);

            if (error) {
              console.warn('[WritingEditor] publish story:', error.message);
              Alert.alert('Error', 'Could not publish story. Please try again.');
              return;
            }
            setStoryStatus('published');
            setChaptersModalVisible(false);
          },
        },
      ],
    );
  }, [novelId, publishingStory]);

  const isChapterPublished = activeChapter?.status === 'published';

  if (loading || (!activeChapter && chapters.length === 0)) {
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
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ChevronLeft size={26} color={theme.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.storyTitle, { color: theme.textSecondary }]} numberOfLines={1}>
            {storyTitleParam || 'Story'}
          </Text>
          <AutosaveIndicator status={autosaveStatus} theme={theme} />
        </View>

        <Pressable onPress={() => setChaptersModalVisible(true)} hitSlop={12}>
          <List size={24} color={theme.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <TextInput
          value={chapterTitle}
          onChangeText={setChapterTitle}
          placeholder="Chapter title"
          placeholderTextColor={theme.placeholder}
          style={[styles.chapterTitleInput, { color: theme.text }]}
        />

        <TextInput
          value={chapterContent}
          onChangeText={setChapterContent}
          placeholder="Start writing…"
          placeholderTextColor={theme.placeholder}
          style={[styles.contentInput, { color: theme.text }]}
          multiline
          textAlignVertical="top"
        />

        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <Text style={[styles.wordCount, { color: theme.textSecondary }]}>
            {countWords(chapterContent)} words
          </Text>

          <Pressable
            onPress={handlePublishChapter}
            disabled={publishingChapter || isChapterPublished}
            style={[
              styles.publishButton,
              { backgroundColor: isChapterPublished ? theme.surface : theme.primary },
              publishingChapter && styles.buttonDisabled,
            ]}
          >
            {publishingChapter ? (
              <ActivityIndicator size="small" color={isChapterPublished ? theme.textSecondary : '#FFF'} />
            ) : (
              <>
                <Send size={16} color={isChapterPublished ? theme.textSecondary : '#FFF'} />
                <Text
                  style={[
                    styles.publishLabel,
                    { color: isChapterPublished ? theme.textSecondary : '#FFF' },
                  ]}
                >
                  {isChapterPublished ? 'Published' : 'Publish Chapter'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ChaptersListModal
        visible={chaptersModalVisible}
        chapters={chapters}
        activeChapterId={activeChapterId}
        onSelectChapter={handleSelectChapter}
        onCreateChapter={handleCreateChapter}
        onClose={() => setChaptersModalVisible(false)}
        theme={theme}
        isDark={isDark}
        creating={creatingChapter}
        storyStatus={storyStatus}
        onPublishStory={handlePublishStory}
        publishingStory={publishingStory}
      />
    </SafeAreaView>
  );
}

const getStyles = (theme: any, _isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerCenter: { flex: 1, alignItems: 'center', gap: 2, marginHorizontal: 12 },
    storyTitle: { fontSize: 12, fontWeight: '600' },
    chapterTitleInput: {
      fontSize: 20,
      fontWeight: '700',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    contentInput: {
      flex: 1,
      fontSize: 16,
      lineHeight: 26,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    wordCount: { fontSize: 12, fontWeight: '600' },
    publishButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
    },
    publishLabel: { fontSize: 14, fontWeight: '700' },
    buttonDisabled: { opacity: 0.6 },
  });