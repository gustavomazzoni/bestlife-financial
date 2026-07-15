import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize } from '../theme';

interface ScreenHeaderProps {
  title: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, right }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize['2xl'],
    color: colors.foreground,
  },
});
