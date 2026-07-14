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
import { API_URL } from './src/lib/config';
import { getStoredToken, signInWithEmail, signOut } from './src/lib/auth';

/**
 * Minimal screen to exercise the Phase 2 auth bridge end-to-end.
 * Phase 7/8 replaces this with real navigation + screens.
 */
export default function App() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'checking' | 'signing-in' | 'signed-in' | 'error'
  >('checking');
  const [message, setMessage] = useState('');
  const [apiResult, setApiResult] = useState<string | null>(null);

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

  async function handleSignOut() {
    await signOut();
    setStatus('idle');
    setApiResult(null);
  }

  async function callAuthenticatedApi() {
    const token = await getStoredToken();
    const response = await fetch(`${API_URL}/api/v1/categories`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setApiResult(`${response.status} ${response.statusText}`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>LifeOS — Auth Test</Text>

      {status === 'checking' && <ActivityIndicator />}

      {status !== 'checking' && status !== 'signed-in' && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Button
            title={status === 'signing-in' ? 'Signing in…' : 'Sign in'}
            onPress={handleSignIn}
            disabled={status === 'signing-in' || !email}
          />
          {status === 'error' && <Text style={styles.error}>{message}</Text>}
        </View>
      )}

      {status === 'signed-in' && (
        <View style={styles.form}>
          <Text>Signed in — token stored.</Text>
          <Button title="Call /api/v1/categories" onPress={callAuthenticatedApi} />
          {apiResult && <Text>{apiResult}</Text>}
          <Button title="Sign out" onPress={handleSignOut} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  form: {
    width: '100%',
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  error: {
    color: '#c0392b',
  },
});
