// hooks/useChapters.ts

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/api';
import { Chapter } from '@/types/chapter';

interface CreateChapterResponse extends Chapter {}

interface UpdateChapterResponse extends Chapter {}

interface PublishChapterResponse extends Chapter {}

interface CreateChapterPayload {
  novel_id: string;
  title: string;
  content: string;
  chapter_number: number;
  status: 'draft';
  word_count: number;
}

interface UpdateChapterPayload {
  title?: string;
  content?: string;
  word_count?: number;
}

/**
 * Manages chapters belonging to an EXISTING story (novelId).
 *
 * Reads are performed through Supabase.
 *
 * Author mutations are performed through the NestJS API so that:
 * - ownership authorization is enforced by the backend;
 * - chapter counters are maintained centrally;
 * - word-count aggregates remain synchronized;
 * - publishing state is handled by the publishing services.
 *
 * This hook never creates or touches the parent `novels` row.
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

  const createChapter = useCallback(
    async (): Promise<Chapter | null> => {
      if (!novelId) return null;

      const nextNumber =
        chapters.length > 0
          ? Math.max(...chapters.map((c) => c.chapter_number)) + 1
          : 1;

      const payload: CreateChapterPayload = {
        novel_id: novelId,
        title: `Chapter ${nextNumber}`,
        content: '',
        chapter_number: nextNumber,
        status: 'draft',
        word_count: 0,
      };

      try {
        const data = await apiRequest<CreateChapterResponse>(
          '/chapters',
          {
            method: 'POST',
            body: JSON.stringify(payload),
          },
        );

        if (!data) {
          console.warn(
            '[useChapters] create: backend returned no chapter',
          );
          return null;
        }

        setChapters((prev) => {
          const exists = prev.some((chapter) => chapter.id === data.id);

          if (exists) {
            return prev.map((chapter) =>
              chapter.id === data.id ? data : chapter,
            );
          }

          return [...prev, data].sort(
            (a, b) => a.chapter_number - b.chapter_number,
          );
        });

        return data;
      } catch (e) {
        console.warn('[useChapters] create:', e);
        return null;
      }
    },
    [novelId, chapters],
  );

  const persistChapter = useCallback(
    async (
      chapterId: string,
      patch: {
        title?: string;
        content?: string;
        word_count?: number;
      },
    ) => {
      const payload: UpdateChapterPayload = {
        ...(patch.title !== undefined
          ? { title: patch.title }
          : {}),
        ...(patch.content !== undefined
          ? { content: patch.content }
          : {}),
        ...(patch.word_count !== undefined
          ? { word_count: patch.word_count }
          : {}),
      };

      try {
        const data = await apiRequest<UpdateChapterResponse>(
          `/chapters/${chapterId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(payload),
          },
        );

        setChapters((prev) =>
          prev.map((chapter) =>
            chapter.id === chapterId
              ? {
                  ...chapter,
                  ...(data ?? payload),
                }
              : chapter,
          ),
        );
      } catch (e) {
        console.warn('[useChapters] persist:', e);
        throw e;
      }
    },
    [],
  );

  const publishChapter = useCallback(
    async (chapterId: string): Promise<boolean> => {
      if (!novelId) return false;

      try {
        const data = await apiRequest<PublishChapterResponse>(
          `/chapters/${chapterId}/publish`,
          {
            method: 'POST',
            body: JSON.stringify({
              novelId,
            }),
          },
        );

        const publishedAt =
          data?.published_at ?? new Date().toISOString();

        setChapters((prev) =>
          prev.map((chapter) =>
            chapter.id === chapterId
              ? {
                  ...chapter,
                  ...(data ?? {}),
                  status: 'published',
                  published_at: publishedAt,
                }
              : chapter,
          ),
        );

        return true;
      } catch (e) {
        console.warn('[useChapters] publish:', e);
        return false;
      }
    },
    [novelId],
  );

  const deleteChapter = useCallback(
    async (chapterId: string): Promise<boolean> => {
      try {
        await apiRequest(`/chapters/${chapterId}`, {
          method: 'DELETE',
        });

        setChapters((prev) =>
          prev.filter((chapter) => chapter.id !== chapterId),
        );

        return true;
      } catch (e) {
        console.warn('[useChapters] delete:', e);
        return false;
      }
    },
    [],
  );

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