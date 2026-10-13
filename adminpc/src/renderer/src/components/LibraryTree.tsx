import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { ImportedBook } from '../../../shared/types'
import { Icon } from './Icon'

const UNCATEGORISED = 'Uncategorized'

/** Imported books grouped by their real `category`. Nothing here is invented: it is the list endpoint, regrouped. */
export function LibraryTree({ books, query }: { books: ImportedBook[]; query: string }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const q = query.trim().toLowerCase()
  const currentId = /^\/books\/([^/]+)/.exec(pathname)?.[1]

  const groups = useMemo(() => {
    const map = new Map<string, ImportedBook[]>()
    for (const b of books) {
      if (q && !b.title.toLowerCase().includes(q) && !b.authorName.toLowerCase().includes(q)) continue
      const key = b.category?.trim() || UNCATEGORISED
      const list = map.get(key)
      if (list) list.push(b)
      else map.set(key, [b])
    }
    return [...map.entries()]
      .map(([name, items]) => ({ name, items: items.sort((a, b) => a.title.localeCompare(b.title)) }))
      .sort((a, b) => (a.name === UNCATEGORISED ? 1 : b.name === UNCATEGORISED ? -1 : a.name.localeCompare(b.name)))
  }, [books, q])

  if (books.length === 0) return <div className="tree tree-empty">No imported books yet</div>
  if (groups.length === 0) return <div className="tree tree-empty">No matches</div>

  return (
    <div className="tree" role="tree">
      {groups.map((g) => {
        const expanded = q !== '' || (open[g.name] ?? false) || g.items.some((b) => b.id === currentId)
        return (
          <div key={g.name}>
            <button className="tree-row" role="treeitem" aria-expanded={expanded} onClick={() => setOpen((o) => ({ ...o, [g.name]: !expanded }))}>
              <Icon name={expanded ? 'folderOpen' : 'folder'} size={16} />
              <span className="tree-name">{g.name}</span>
              <span className="count">{g.items.length}</span>
            </button>
            {expanded && (
              <div className="tree-children">
                {g.items.map((b) => (
                  <button key={b.id} className={`tree-row${b.id === currentId ? ' selected' : ''}`} role="treeitem" onClick={() => navigate(`/books/${b.id}`)} title={`${b.title} — ${b.authorName}`}>
                    <Icon name="file" size={15} />
                    <span className="tree-name">{b.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
