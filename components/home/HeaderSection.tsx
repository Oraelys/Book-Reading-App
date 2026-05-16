// components/home/HeaderSection.tsx
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserProfile } from '@/types/home';

interface Props {
  username: string;
  profile: UserProfile | null;
  onSearchPress: () => void;
  onProfilePress: () => void;
  theme: any;
}

const HeaderSection = memo(({ username, profile, onSearchPress, onProfilePress, theme }: Props) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.left}>
        <Text style={[styles.greeting, { color: theme.text }]}>Hello, {username}</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>What would you like to read?</Text>
      </View>
      <View style={styles.right}>
        <TouchableOpacity style={[styles.searchBtn, { backgroundColor: theme.surface }]} onPress={onSearchPress}>
          <Search size={22} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onProfilePress}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '22' }]}>
              <Text style={[styles.initial, { color: theme.primary }]}>
                {username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

HeaderSection.displayName = 'HeaderSection';
export default HeaderSection;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20,
  },
  left: { flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { fontSize: 22, fontWeight: '700', marginBottom: 3 },
  sub: { fontSize: 14 },
  searchBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  initial: { fontSize: 18, fontWeight: '700' },
});