// app/create-novel.tsx

import React, {
  useState,
  useCallback,
  useMemo,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useRouter,
} from 'expo-router';

import {
  ChevronRight,
} from 'lucide-react-native';

import {
  supabase,
} from '@/lib/supabase';

import {
  useTheme,
} from '@/contexts/ThemeContexts';

import {
  apiRequest,
} from '@/lib/api';

import ScreenHeader from '@/components/author/ScreenHeader';

import CreateStoryForm, {
  NovelDraft,
  EMPTY_NOVEL_DRAFT,
  isNovelDraftEmpty,
} from '@/components/author/CreateStoryForm';

export default function CreateNovelScreen() {
  const router = useRouter();

  const {
    theme,
    isDark,
  } = useTheme();

  const [
    draft,
    setDraft,
  ] = useState<NovelDraft>(
    EMPTY_NOVEL_DRAFT,
  );

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    titleError,
    setTitleError,
  ] = useState<string | undefined>();

  const styles = useMemo(
    () =>
      getStyles(
        theme,
        isDark,
      ),
    [
      theme,
      isDark,
    ],
  );

  // ---------------------------------------------------------------------------
  // Step 1 state
  // ---------------------------------------------------------------------------

  const isEmpty = useMemo(
    () =>
      isNovelDraftEmpty(
        draft,
      ),
    [draft],
  );

  const buttonLabel =
    isEmpty
      ? 'Skip'
      : 'Next';

  const handleDraftChange =
    useCallback(
      (
        patch: Partial<NovelDraft>,
      ) => {
        setDraft(
          previous => ({
            ...previous,
            ...patch,
          }),
        );

        if (
          patch.title !== undefined
        ) {
          setTitleError(
            undefined,
          );
        }
      },
      [],
    );

  // ---------------------------------------------------------------------------
  // Create story
  //
  // IMPORTANT:
  // Story creation now goes through NestJS.
  //
  // The frontend no longer inserts directly into `novels`.
  // The backend derives `created_by` from the authenticated JWT.
  // ---------------------------------------------------------------------------

  const handleContinue =
    useCallback(
      async () => {
        if (submitting) {
          return;
        }

        const title =
          draft.title.trim();

        if (!title) {
          setTitleError(
            'Please give your story a title.',
          );
          return;
        }

        setSubmitting(true);

        try {
          let coverUrl:
            string | undefined;

          /*
           * Cover handling remains unchanged for now.
           *
           * We will move cover uploads behind the backend upload
           * boundary as part of the upload/media phase.
           */
          if (
            draft.coverImageUri
          ) {
            try {
              const response =
                await fetch(
                  draft.coverImageUri,
                );

              const blob =
                await response.blob();

              const arrayBuffer =
                await new Response(
                  blob,
                ).arrayBuffer();

              const extension =
                (
                  draft
                    .coverImageUri
                    .split('.')
                    .pop() ||
                  'jpg'
                )
                  .toLowerCase()
                  .split('?')[0];

              /*
               * The current storage layout is retained temporarily.
               * This will be centralized later.
               */
              const fileName =
                `covers/${Date.now()}.${extension}`;

              const {
                error:
                  uploadError,
              } =
                await supabase.storage
                  .from('covers')
                  .upload(
                    fileName,
                    arrayBuffer,
                    {
                      contentType:
                        `image/${extension}`,
                      upsert: true,
                    },
                  );

              if (
                !uploadError
              ) {
                const {
                  data,
                } =
                  supabase.storage
                    .from('covers')
                    .getPublicUrl(
                      fileName,
                    );

                coverUrl =
                  data?.publicUrl ||
                  undefined;
              } else {
                console.warn(
                  '[CreateNovel] cover upload:',
                  uploadError.message,
                );
              }
            } catch (error) {
              console.warn(
                '[CreateNovel] cover upload:',
                error,
              );
            }
          }

          /*
           * IMPORTANT:
           *
           * authorId is deliberately NOT taken from the client.
           * The backend receives the authenticated access token and
           * derives created_by from request.user.id.
           */
          const story =
            await apiRequest<{
              id: string;
              title: string;
              description: string | null;
              cover_image_url: string | null;
              created_by: string;
              status: string;
            }>(
              '/writing/stories',
              {
                method: 'POST',

                body: JSON.stringify({
                  title,
                  description:
                    draft.description.trim() ||
                    undefined,

                  coverImage:
                    coverUrl,

                  /*
                   * These are defaults because the current
                   * CreateStoryForm does not expose category/
                   * visibility yet.
                   *
                   * We will add those fields in the story
                   * metadata phase.
                   */
                  category: 'General',

                  visibility: 'private',
                }),
              },
            );

          if (!story?.id) {
            throw new Error(
              'Story creation returned no story ID.',
            );
          }

          router.replace({
            pathname:
              '/writing-editor',

            params: {
              novelId:
                story.id,

              title:
                story.title ||
                title,
            },
          } as any);
        } catch (error) {
          console.warn(
            '[CreateNovel] create story:',
            error,
          );

          const message =
            error instanceof Error
              ? error.message
              : String(error);

          setTitleError(
            message ||
              'Unable to create story. Please try again.',
          );
        } finally {
          setSubmitting(false);
        }
      },
      [
        submitting,
        draft,
        router,
      ],
    );

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            theme.background,
        },
      ]}
      edges={['top']}
    >
      <ScreenHeader
        title="New Story"
        theme={theme}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >
          <CreateStoryForm
            draft={draft}
            onChange={
              handleDraftChange
            }
            theme={theme}
            isDark={isDark}
            titleError={
              titleError
            }
          />
        </ScrollView>

        <View
          style={styles.footer}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={
              handleContinue
            }
            disabled={
              submitting
            }
            style={[
              styles.continueButton,
              {
                backgroundColor:
                  theme.primary,
              },
              submitting &&
                styles.buttonDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator
                size="small"
                color="#FFF"
              />
            ) : (
              <>
                <Text
                  style={
                    styles.continueLabel
                  }
                >
                  {
                    buttonLabel
                  }
                </Text>

                <ChevronRight
                  size={18}
                  color="#FFF"
                />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (
  theme: any,
  _isDark: boolean,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },

    flex: {
      flex: 1,
    },

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
      shadowOffset: {
        width: 0,
        height: 4,
      },
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

    buttonDisabled: {
      opacity: 0.6,
    },
  });