import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../lib/bridge'
import { invalidateBook, keys } from '../lib/query-client'

export const useBooks = () => useQuery({ queryKey: keys.books, queryFn: api.books.list })

export const useBook = (id: string) => useQuery({ queryKey: keys.book(id), queryFn: () => api.books.get(id) })

export const useChapters = (id: string) => useQuery({ queryKey: keys.chapters(id), queryFn: () => api.books.chapters(id) })

export const useChapter = (id: string, chapterNumber: number | null) =>
  useQuery({
    queryKey: keys.chapter(id, chapterNumber ?? -1),
    queryFn: () => api.books.chapter(id, chapterNumber as number),
    enabled: chapterNumber !== null
  })

/** Validation is a GET on the backend but a deliberate admin action here, so it is a mutation (no auto-refetch). */
export const useValidateBook = (id: string) => useMutation({ mutationFn: () => api.books.validate(id) })

export const usePublishBook = (id: string) =>
  useMutation({ mutationFn: () => api.books.publish(id), onSettled: () => invalidateBook(id) })

export const useUnpublishBook = (id: string) =>
  useMutation({ mutationFn: () => api.books.unpublish(id), onSettled: () => invalidateBook(id) })

export const usePublishChapter = (novelId: string) =>
  useMutation({
    mutationFn: (chapterId: string) => api.chapters.publish(novelId, chapterId),
    onSettled: () => invalidateBook(novelId)
  })

export const useUnpublishChapter = (novelId: string) =>
  useMutation({
    mutationFn: (chapterId: string) => api.chapters.unpublish(novelId, chapterId),
    onSettled: () => invalidateBook(novelId)
  })
