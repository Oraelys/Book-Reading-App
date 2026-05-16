// components/home/GoalSection.tsx
import React, { memo, useCallback } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Novel } from "@/types/home";
import { LastReadBookItem } from './ListItems';

interface GoalSectionProps {
  readingGoal: { current: number; total: number };
  lastReadBooks: Novel[];
  progressPercentage: number;
  onBookPress: (id: string) => void;
  onBookLongPress: (book: Novel) => void;
  styles: any;
}

const keyExtractor = (item: Novel) => item.id;

const GoalSection = memo(({
  readingGoal,
  lastReadBooks,
  progressPercentage,
  onBookPress,
  onBookLongPress,
  styles,
}: GoalSectionProps) => {
  const renderLastReadBook = useCallback(({ item }: { item: Novel }) => (
    <LastReadBookItem
      item={item}
      onPress={onBookPress}
      onLongPress={onBookLongPress}
      styles={styles}
    />
  ), [onBookPress, onBookLongPress, styles]);

  return (
    <View style={[styles.goalCard]}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle}>Your Goal</Text>
        <Text style={styles.goalEdit}>Edit</Text>
      </View>
      <View style={styles.goalProgress}>
        <View style={styles.goalStats}>
          <Text style={styles.goalCount}>
            {readingGoal.current}/{readingGoal.total}
          </Text>
          <Text style={styles.goalLabel}>Books</Text>
        </View>
        <View style={styles.goalBarContainer}>
          <View style={styles.goalBar}>
            <View
              style={[
                styles.goalBarFill,
                { width: `${Math.min(progressPercentage, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.goalPercentage}>
            {Math.round(progressPercentage)}%
          </Text>
        </View>
      </View>

      {lastReadBooks.length > 0 && (
        <View style={styles.lastReadSection}>
          <Text style={styles.lastReadTitle}>Continue from where you left off</Text>
          <FlatList
            data={lastReadBooks}
            renderItem={renderLastReadBook}
            keyExtractor={keyExtractor}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lastReadList}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={3}
            removeClippedSubviews={false}
          />
        </View>
      )}
    </View>
  );
});

GoalSection.displayName = 'GoalSection';
export default GoalSection;