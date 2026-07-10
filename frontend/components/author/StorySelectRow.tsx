// components/author/StorySelectRow.tsx
import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { CheckCircle2, Circle, GripVertical } from 'lucide-react-native';
import { Story } from '@/types/author';

interface StorySelectRowProps {
  story: Story;
  selected: boolean;
  showDragHandle: boolean;
  onToggle: (id: string) => void;
  drag?: () => void;
  isActive?: boolean;
  theme: any;
}

const StorySelectRow = memo(({
  story, selected, showDragHandle, onToggle, drag, isActive, theme,
}: StorySelectRowProps) => {
  const handleToggle = useCallback(() => onToggle(story.id), [onToggle, story.id]);

  return (
    <Pressable
      onPress={handleToggle}
      style={[
        styles.row,
        {
          backgroundColor: isActive ? theme.primary + '18' : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      {showDragHandle && (
        <Pressable onLongPress={drag} style={styles.dragHandle} hitSlop={8}>
          <GripVertical size={20} color={theme.textSecondary} />
        </Pressable>
      )}
      <Image
        source={story.cover_image_url ? { uri: story.cover_image_url } : undefined}
        style={[styles.cover, { backgroundColor: theme.border }]}
      />
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {story.title}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {story.published_chapters} chapters published
        </Text>
      </View>
      {selected
        ? <CheckCircle2 size={22} color={theme.primary} />
        : <Circle size={22} color={theme.border} />}
    </Pressable>
  );
});

StorySelectRow.displayName = 'StorySelectRow';
export default StorySelectRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  dragHandle: { padding: 2 },
  cover: { width: 44, height: 66, borderRadius: 6 },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  meta: { fontSize: 12 },
});