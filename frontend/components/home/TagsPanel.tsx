// components/home/TagsPanel.tsx
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

const TagBooksPanel = memo(({ tagSections, onBookPress, onBookLongPress, onSeeAll, theme }: TagBooksPanelProps) => (
  <View>
    {tagSections.map(section => (
      <BookSection
        key={section.tag.id}
        label={section.label}
        category={section.tag.slug}
        books={section.books}
        onBookPress={onBookPress}
        onBookLongPress={onBookLongPress}
        onSeeAll={() => onSeeAll(section.tag)}
        theme={theme}
      />
    ))}
  </View>
));

TagBooksPanel.displayName = 'TagBooksPanel';
export default TagBooksPanel;
