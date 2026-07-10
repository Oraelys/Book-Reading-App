// app/create-novel.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContexts';

import ScreenHeader from '@/components/author/ScreenHeader';
import CreateStoryForm, {
  NovelDraft, EMPTY_NOVEL_DRAFT, isNovelDraftEmpty,
} from '@/components/author/CreateStoryForm';

// ---------------------------------------------------------------------------
// Cover upload helper
// ---------------------------------------------------------------------------
async function uploadCoverImage(uri: string, userId: string): Promise<string | null> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    const fileExt = (uri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(fileName, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (uploadError) {
      console.warn('[CreateNovel] uploadCoverImage:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from('covers').getPublicUrl(fileName);
    return data?.publicUrl ?? null;
  } catch (e) {
    console.warn('[CreateNovel] uploadCoverImage:', e);
    return null;
  }
}

export default function CreateNovelScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();

  const [draft, setDraft] = useState<NovelDraft>(EMPTY_NOVEL_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState<string | undefined>();

  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  // Step 1 behavior: empty draft -> "Skip", anything filled in -> "Next"
  const isEmpty = useMemo(() => isNovelDraftEmpty(draft), [draft]);
  const buttonLabel = isEmpty ? 'Skip' : 'Next';

  const handleDraftChange = useCallback((patch: Partial<NovelDraft>) => {
    setDraft(prev => ({ ...prev, ...patch }));
    if (patch.title !== undefined) setTitleError(undefined);
  }, []);

  // ---------------------------------------------------------------------------
  // Step 1 -> Step 2
  // The story is created HERE — once, as a draft row — and its id is handed
  // to WritingEditorScreen via route params. The editor never inserts into
  // `novels`; it only ever reads/writes chapters that belong to this id.
  // Works identically whether the user hits "Skip" (blank story) or "Next"
  // (filled-in story).
  // ---------------------------------------------------------------------------
  const handleContinue = useCallback(async () => {
    if (!user || submitting) return;
    setSubmitting(true);

    try {
      let coverUrl: string | null = null;
      if (draft.coverImageUri) {
        coverUrl = await uploadCoverImage(draft.coverImageUri, user.id);
      }

      const title = draft.title.trim() || 'Untitled Story';

      const { data: novelRow, error: insertError } = await supabase
        .from('novels')
        .insert({
          title,
          description: draft.description.trim() || null,
          cover_image_url: coverUrl,
          created_by: user.id,
          status: 'draft',
        })
        .select('id')
        .single();

      if (insertError || !novelRow) {
        console.warn('[CreateNovel] insert novel:', insertError?.message);
        return;
      }

      router.replace({
        pathname: '/writing-editor',
        params: { novelId: novelRow.id, title },
      } as any);
    } catch (e) {
      console.warn('[CreateNovel] handleContinue:', e);
    } finally {
      setSubmitting(false);
    }
  }, [user, submitting, draft, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader title="New Story" theme={theme} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <CreateStoryForm
            draft={draft}
            onChange={handleDraftChange}
            theme={theme}
            isDark={isDark}
            titleError={titleError}
          />
        </ScrollView>

        <View style={styles.footer} pointerEvents="box-none">
          <Pressable
            onPress={handleContinue}
            disabled={submitting}
            style={[
              styles.continueButton,
              { backgroundColor: theme.primary },
              submitting && styles.buttonDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Text style={styles.continueLabel}>{buttonLabel}</Text>
                <ChevronRight size={18} color="#FFF" />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any, _isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 100,
    },
    footer: {
      position: 'absolute',
      bottom: 20,
      right: 20,
    },
    continueButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 22,
      paddingVertical: 14,
      borderRadius: 28,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
      minWidth: 100,
      justifyContent: 'center',
    },
    continueLabel: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },
    buttonDisabled: { opacity: 0.6 },
  });