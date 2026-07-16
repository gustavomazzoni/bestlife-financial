import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily, fontSize } from '../theme';

interface ScreenHeaderProps {
  /** Small muted line above the title, e.g. "Organize-se" / "Seu patrimônio". */
  eyebrow?: string;
  title: string;
  right?: ReactNode;
}

export function ScreenHeader({ eyebrow, title, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.textGroup}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  textGroup: {
    gap: 2,
  },
  eyebrow: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  title: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize['2xl'],
    color: colors.foreground,
    letterSpacing: -0.5,
  },
});
