// hooks/useChapters.ts
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Chapter } from '@/types/chapter';

/**
 * Manages chapters belonging to an EXISTING story (novelId).
 * This hook never creates or touches the parent `novels` row — the story
 * must already exist (created by the Create Story flow) before this hook
 * is used. Keeping that boundary here means WritingEditorScreen physically
 * cannot create a duplicate story record.
 */
export function useChapters(novelId: string | undefined) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChapters = useCallback(async () => {
    if (!novelId) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', novelId)
        .order('chapter_number', { ascending: true });

      if (error) {
        console.warn('[useChapters] load:', error.message);
        return;
      }
      setChapters(data ?? []);
    } catch (e) {
      console.warn('[useChapters] load:', e);
    } finally {
      setLoading(false);
    }
  }, [novelId]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  const createChapter = useCallback(async (): Promise<Chapter | null> => {
    if (!novelId) return null;

    const nextNumber = chapters.length > 0
      ? Math.max(...chapters.map(c => c.chapter_number)) + 1
      : 1;

    try {
      const { data, error } = await supabase
        .from('chapters')
        .insert({
          novel_id: novelId,
          title: `Chapter ${nextNumber}`,
          content: '',
          chapter_number: nextNumber,
          status: 'draft',
          word_count: 0,
        })
        .select('*')
        .single();

      if (error || !data) {
        console.warn('[useChapters] create:', error?.message);
        return null;
      }

      setChapters(prev => [...prev, data]);
      return data;
    } catch (e) {
      console.warn('[useChapters] create:', e);
      return null;
    }
  }, [novelId, chapters]);

  const persistChapter = useCallback(async (
    chapterId: string,
    patch: { title?: string; content?: string; word_count?: number },
  ) => {
    const { error } = await supabase
      .from('chapters')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', chapterId);

    if (error) {
      console.warn('[useChapters] persist:', error.message);
      throw error;
    }

    setChapters(prev => prev.map(c => (c.id === chapterId ? { ...c, ...patch } : c)));
  }, []);

  const publishChapter = useCallback(async (chapterId: string): Promise<boolean> => {
    const publishedAt = new Date().toISOString();
    const { error } = await supabase
      .from('chapters')
      .update({ status: 'published', published_at: publishedAt })
      .eq('id', chapterId);

    if (error) {
      console.warn('[useChapters] publish:', error.message);
      return false;
    }

    setChapters(prev => prev.map(c => (
      c.id === chapterId ? { ...c, status: 'published', published_at: publishedAt } : c
    )));
    return true;
  }, []);

  const deleteChapter = useCallback(async (chapterId: string): Promise<boolean> => {
    const { error } = await supabase.from('chapters').delete().eq('id', chapterId);
    if (error) {
      console.warn('[useChapters] delete:', error.message);
      return false;
    }
    setChapters(prev => prev.filter(c => c.id !== chapterId));
    return true;
  }, []);

  return {
    chapters,
    loading,
    createChapter,
    persistChapter,
    publishChapter,
    deleteChapter,
    reloadChapters: loadChapters,
  };
}