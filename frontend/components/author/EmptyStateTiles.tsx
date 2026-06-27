// components/author/EmptyStateTiles.tsx
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BookOpen, Library, PlusCircle } from 'lucide-react-native';

interface EmptyStateTilesProps {
  onStoriesPress: () => void;
  onSeriesPress: () => void;
  onCreatePress: () => void;
  theme: any;
}

const EmptyStateTiles = memo(({
  onStoriesPress, onSeriesPress, onCreatePress, theme,
}: EmptyStateTilesProps) => (
  <View style={styles.stack}>
    <Tile
      icon={<BookOpen size={20} color={theme.text} />}
      label="Stories"
      onPress={onStoriesPress}
      theme={theme}
    />
    <Tile
      icon={<Library size={20} color={theme.text} />}
      label="Series"
      onPress={onSeriesPress}
      theme={theme}
    />
    <Tile
      icon={<PlusCircle size={20} color={theme.text} />}
      label="Create New Story"
      onPress={onCreatePress}
      theme={theme}
    />
  </View>
));

EmptyStateTiles.displayName = 'EmptyStateTiles';
export default EmptyStateTiles;

interface TileProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  theme: any;
}

const Tile = memo(({ icon, label, onPress, theme }: TileProps) => (
  <TouchableOpacity
    style={[styles.tile, { backgroundColor: theme.surface }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.iconWrap}>{icon}</View>
    <Text style={[styles.tileLabel, { color: theme.text }]}>{label}</Text>
  </TouchableOpacity>
));
Tile.displayName = 'Tile';

const styles = StyleSheet.create({
  stack: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 28,
    marginRight: 12,
    alignItems: 'center',
  },
  tileLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});