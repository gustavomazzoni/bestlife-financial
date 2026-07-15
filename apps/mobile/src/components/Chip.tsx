import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontFamily, fontSize } from '../theme';

interface ChipProps {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
}

export function Chip({ label, icon, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text
        style={[styles.label, selected && styles.labelSelected]}
        numberOfLines={1}
      >
        {icon ? `${icon} ` : ''}
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  labelSelected: {
    color: colors.accentForeground,
  },
});
