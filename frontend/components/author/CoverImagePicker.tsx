// components/author/CoverImagePicker.tsx
import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Pencil } from 'lucide-react-native';

interface CoverImagePickerProps {
  imageUri?: string | null;
  onImageSelected: (uri: string) => void;
  theme: any;
  isDark: boolean;
  uploading?: boolean;
}

function CoverImagePickerBase({
  imageUri, onImageSelected, theme, isDark, uploading,
}: CoverImagePickerProps) {
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);

  const handlePick = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      onImageSelected(result.assets[0].uri);
    }
  }, [onImageSelected]);

  return (
    <Pressable onPress={handlePick} style={styles.container} disabled={uploading}>
      {imageUri ? (
        <>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <View style={[styles.editBadge, { backgroundColor: theme.primary }]}>
            {uploading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Pencil size={14} color="#FFF" />
            )}
          </View>
        </>
      ) : (
        <View
          style={[
            styles.placeholder,
            { borderColor: theme.border, backgroundColor: theme.surface },
          ]}
        >
          {uploading ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <>
              <Camera size={28} color={theme.textSecondary} />
              <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                Add Cover
              </Text>
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default React.memo(CoverImagePickerBase);

const getStyles = (theme: any, _isDark: boolean) =>
  StyleSheet.create({
    container: {
      width: 140,
      height: 187,
      alignSelf: 'center',
      marginBottom: 24,
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
    },
    placeholder: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    placeholderText: {
      fontSize: 13,
      fontWeight: '600',
    },
    editBadge: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });