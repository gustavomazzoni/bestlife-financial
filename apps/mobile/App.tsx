import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { getStoredToken, signInWithEmail } from './src/lib/auth';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors, fontFamily } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    [fontFamily.body]: PlusJakartaSans_400Regular,
    [fontFamily.bodyMedium]: PlusJakartaSans_500Medium,
    [fontFamily.bodySemiBold]: PlusJakartaSans_600SemiBold,
    [fontFamily.bodyBold]: PlusJakartaSans_700Bold,
    [fontFamily.display]: SpaceGrotesk_500Medium,
    [fontFamily.displayBold]: SpaceGrotesk_700Bold,
  });

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'checking' | 'idle' | 'signing-in' | 'signed-in' | 'error'
  >('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    getStoredToken().then(token => {
      setStatus(token ? 'signed-in' : 'idle');
    });
  }, []);

  async function handleSignIn() {
    setStatus('signing-in');
    setMessage('');
    const result = await signInWithEmail(email);
    if (result.type === 'success') {
      setStatus('signed-in');
    } else if (result.type === 'cancelled') {
      setStatus('idle');
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  }

  if (!fontsLoaded || status === 'checking') {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (status === 'signed-in') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>BestLife</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Button
          title={status === 'signing-in' ? 'Entrando…' : 'Entrar'}
          onPress={handleSignIn}
          disabled={status === 'signing-in' || !email}
          color={colors.accent}
        />
        {status === 'error' && <Text style={styles.error}>{message}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  title: {
    fontFamily: fontFamily.displayBold,
    fontSize: 28,
    color: colors.foreground,
  },
  form: {
    width: '100%',
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: fontFamily.body,
    color: colors.foreground,
    backgroundColor: colors.surface,
  },
  error: {
    color: colors.danger,
    fontFamily: fontFamily.body,
  },
});
