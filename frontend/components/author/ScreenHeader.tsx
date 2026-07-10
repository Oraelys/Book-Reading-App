import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

interface ScreenHeaderProps {
  title: string;
  theme: any;
  rightElement?: React.ReactNode;
}

function ScreenHeader({ title, theme, rightElement }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
        <ChevronLeft size={26} color={theme.text} />
      </Pressable>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{rightElement}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: { padding: 4, marginRight: 8 },
  title: { flex: 1, fontSize: 18, fontWeight: '700' },
  right: { minWidth: 32, alignItems: 'flex-end' },
});

export default memo(ScreenHeader);