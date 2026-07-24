import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
import { getStoredToken, signOut } from './src/lib/auth';
import { api, setUnauthorizedHandler } from './src/lib/api';
import { AuthContext } from './src/lib/authContext';
import { LoginScreen } from './src/screens/LoginScreen';
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

  const [status, setStatus] = useState<'checking' | 'idle' | 'signed-in'>(
    'checking'
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
      setStatus('idle');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    getStoredToken().then(async token => {
      if (!token) {
        setStatus('idle');
        return;
      }
      // A stored token isn't necessarily still valid — it may have been
      // issued by a different backend (e.g. switching from local dev to
      // production) or revoked server-side. Confirm it against the
      // current API before trusting it, instead of routing to Home and
      // leaving every screen stuck on a doomed 401 retry.
      try {
        await api.get('/api/v1/user/profile');
        setStatus('signed-in');
      } catch {
        await signOut();
        setStatus('idle');
      }
    });
  }, []);

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
          <BottomSheetModalProvider>
            <AuthContext.Provider
              value={{
                signOut: () => {
                  signOut();
                  setStatus('idle');
                },
              }}
            >
              <RootNavigator />
            </AuthContext.Provider>
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <LoginScreen onSignedIn={() => setStatus('signed-in')} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
