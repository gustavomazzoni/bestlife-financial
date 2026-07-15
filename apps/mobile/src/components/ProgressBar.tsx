import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

interface ProgressBarProps {
  pct: number; // 0-100+
  color?: string;
  overBudgetColor?: string;
}

export function ProgressBar({
  pct,
  color = colors.accent,
  overBudgetColor = colors.danger,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, pct));
  const isOver = pct > 100;

  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            backgroundColor: isOver ? overBudgetColor : color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
