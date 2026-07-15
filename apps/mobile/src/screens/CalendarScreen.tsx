import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { colors, fontFamily } from '../theme';

export function CalendarScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Calendário</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontFamily: fontFamily.displayBold,
    fontSize: 24,
    color: colors.foreground,
  },
});
