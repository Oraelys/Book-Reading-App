// components/author/CreateStoryForm.tsx
//
// Reusable Step 1 content for the Create Story flow.
// Controlled component: the parent screen owns the draft state and decides
// what happens next (Skip vs Next, persistence, navigation), so this same
// component can be reused by the Mobile Author App, Admin App, and a future
// web version without change.
import React, { useCallback } from 'react';
import CoverImagePicker from './CoverImagePicker';
import FormInput from './FormInput';
import FormTextArea from './FormTextArea';

export interface NovelDraft {
  coverImageUri: string | null;
  title: string;
  description: string;
}

export const EMPTY_NOVEL_DRAFT: NovelDraft = {
  coverImageUri: null,
  title: '',
  description: '',
};

/** True when the user hasn't touched anything yet — drives the Skip/Next label. */
export function isNovelDraftEmpty(draft: NovelDraft): boolean {
  return !draft.coverImageUri && !draft.title.trim() && !draft.description.trim();
}

interface CreateStoryFormProps {
  draft: NovelDraft;
  onChange: (patch: Partial<NovelDraft>) => void;
  theme: any;
  isDark: boolean;
  uploadingCover?: boolean;
  titleError?: string;
}

function CreateStoryFormBase({
  draft, onChange, theme, isDark, uploadingCover, titleError,
}: CreateStoryFormProps) {
  const handleCoverSelected = useCallback((uri: string) => {
    onChange({ coverImageUri: uri });
  }, [onChange]);

  const handleTitleChange = useCallback((text: string) => {
    onChange({ title: text });
  }, [onChange]);

  const handleDescriptionChange = useCallback((text: string) => {
    onChange({ description: text });
  }, [onChange]);

  return (
    <>
      <CoverImagePicker
        imageUri={draft.coverImageUri}
        onImageSelected={handleCoverSelected}
        theme={theme}
        isDark={isDark}
        uploading={uploadingCover}
      />

      <FormInput
        label="Title"
        placeholder="Give your story a title"
        value={draft.title}
        onChangeText={handleTitleChange}
        theme={theme}
        error={titleError}
        returnKeyType="next"
      />

      <FormTextArea
        label="Description"
        placeholder="What is your story about? (optional)"
        value={draft.description}
        onChangeText={handleDescriptionChange}
        theme={theme}
        minHeight={120}
      />
    </>
  );
}

export default React.memo(CreateStoryFormBase);