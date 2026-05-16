// components/home/TagBooksPanel.tsx
import React, { memo } from 'react';
import { View } from 'react-native';
import BookSection from './BookSection';
import { Novel, Tag, TagSection } from '@/types/home';

interface TagBooksPanelProps {
  tagSections: TagSection[];
  onBookPress: (id: string) => void;
  onBookLongPress: (book: Novel) => void;
  onSeeAll: (tag: Tag) => void;
  theme: any;
}

const TagBooksPanel = memo(({
  tagSections, onBookPress, onBookLongPress, onSeeAll, theme,
}: TagBooksPanelProps) => (
  <View>
    {tagSections.map(section => (
      <BookSection
        key={section.tag.id}
        tag={section.tag}
        books={section.books}
        label={section.label}
        onBookPress={onBookPress}
        onBookLongPress={onBookLongPress}
        onSeeAll={onSeeAll}
        theme={theme}
      />
    ))}
  </View>
));

TagBooksPanel.displayName = 'TagBooksPanel';
export default TagBooksPanel;