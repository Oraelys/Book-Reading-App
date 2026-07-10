// components/author/FormTextArea.tsx
import React, { memo } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface FormTextAreaProps extends TextInputProps {
  label: string;
  theme: any;
  error?: string;
  minHeight?: number;
}

const FormTextArea = memo(({ label, theme, error, minHeight = 100, style, ...rest }: FormTextAreaProps) => (
  <View style={styles.wrapper}>
    <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: theme.surface,
          color: theme.text,
          borderColor: error ? '#EF4444' : theme.border,
          minHeight,
        },
        style,
      ]}
      placeholderTextColor={theme.textSecondary}
      multiline
      textAlignVertical="top"
      {...rest}
    />
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
));

FormTextArea.displayName = 'FormTextArea';
export default FormTextArea;

const styles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  error: { color: '#EF4444', fontSize: 12, marginTop: 4 },
});