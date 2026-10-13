import type { BookLifecycle, ImportedBook } from './types'

/**
 * Lifecycle derived only from fields the backend returns.
 * unpublishStory() sets status=draft but leaves published_at, so draft + published_at ⇒ unpublished.
 * "Ready" is NOT derivable from the row; it comes from the validate endpoint.
 */
export function lifecycleOf(book: Pick<ImportedBook, 'status' | 'publishedAt'>): BookLifecycle {
  if (book.status === 'published') return 'published'
  return book.publishedAt ? 'unpublished' : 'draft'
}
