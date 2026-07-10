// components/author/AutosaveIndicator.tsx
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Check, AlertCircle } from 'lucide-react-native';
import { AutosaveStatus } from '@/hooks/useAutosave';

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  theme: any;
}

function AutosaveIndicatorBase({ status, theme }: AutosaveIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <View style={styles.container}>
      {status === 'saving' && (
        <>
          <ActivityIndicator size="small" color={theme.textSecondary} />
          <Text style={[styles.text, { color: theme.textSecondary }]}>Saving…</Text>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check size={14} color={theme.success} />
          <Text style={[styles.text, { color: theme.success }]}>Saved</Text>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle size={14} color={theme.error} />
          <Text style={[styles.text, { color: theme.error }]}>Couldn't save</Text>
        </>
      )}
    </View>
  );
}

export default React.memo(AutosaveIndicatorBase);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontSize: 12, fontWeight: '600' },
});