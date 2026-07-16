import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily } from '../theme';

interface IconBadgeProps {
  /** Background color — usually the category/account color. */
  color?: string;
  /** Single letter or short glyph, rendered bold and centered. */
  letter?: string;
  /** Emoji or icon element, takes priority over `letter` if provided. */
  icon?: ReactNode;
  size?: number;
}

/** Rounded-square colored avatar used for categories/accounts throughout the app. */
export function IconBadge({ color = colors.accent, letter, icon, size = 40 }: IconBadgeProps) {
  const borderRadius = Math.round(size * 0.28);
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius, backgroundColor: color },
      ]}
    >
      {icon ?? (
        <Text style={[styles.letter, { fontSize: Math.round(size * 0.36) }]}>
          {letter?.slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  letter: {
    fontFamily: fontFamily.bodyBold,
    color: '#fff',
  },
});
