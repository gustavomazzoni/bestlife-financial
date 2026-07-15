import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize } from '../theme';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Algo deu errado.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryLabel}>Tentar novamente</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  message: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  retryLabel: {
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accentForeground,
  },
});
