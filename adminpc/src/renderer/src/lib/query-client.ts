import { QueryClient } from '@tanstack/react-query'
import { AppError } from '../../../shared/errors'

/** Server state lives only here. Nothing from the backend is copied into component state. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retry transient failures once; never retry auth/permission/validation/not-found.
      retry: (count, error) => {
        const transient = error instanceof AppError && ['network', 'timeout', 'server'].includes(error.kind)
        return transient && count < 1
      }
    }
  }
})

export const keys = {
  books: ['books'] as const,
  book: (id: string) => ['book', id] as const,
  chapters: (id: string) => ['chapters', id] as const,
  chapter: (id: string, n: number) => ['chapter', id, n] as const
}

/** Refetch everything that can change when a book or chapter is published/unpublished/imported. */
export function invalidateBook(novelId: string): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: keys.books }),
    queryClient.invalidateQueries({ queryKey: keys.book(novelId) }),
    queryClient.invalidateQueries({ queryKey: keys.chapters(novelId) }),
    queryClient.invalidateQueries({ queryKey: ['chapter', novelId] })
  ])
}
