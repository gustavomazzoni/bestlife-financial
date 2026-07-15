import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, fontFamily, fontSize } from '../theme';
import { requestLoginCode, verifyLoginCode } from '../lib/auth';

interface LoginScreenProps {
  onSignedIn: () => void;
}

type Step = 'email' | 'code';

export function LoginScreen({ onSignedIn }: LoginScreenProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSendCode() {
    setLoading(true);
    setError('');
    const result = await requestLoginCode(email.trim());
    setLoading(false);
    if (result.type === 'success') {
      setStep('code');
    } else {
      setError(result.message);
    }
  }

  async function handleVerifyCode() {
    setLoading(true);
    setError('');
    const result = await verifyLoginCode(email.trim(), code.trim());
    setLoading(false);
    if (result.type === 'success') {
      onSignedIn();
    } else {
      setError(result.message);
    }
  }

  function useAnotherEmail() {
    setStep('email');
    setCode('');
    setError('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.content} testID="login-screen">
        <Text style={styles.title}>BestLife</Text>

        {step === 'email' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Digite seu e-mail para entrar</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              testID="login-email-input"
            />
            <Pressable
              style={[
                styles.button,
                (loading || !email.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleSendCode}
              disabled={loading || !email.trim()}
              testID="send-code-button"
            >
              {loading ? (
                <ActivityIndicator color={colors.accentForeground} />
              ) : (
                <Text style={styles.buttonLabel}>Enviar código</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>
              Digite o código enviado para {email}
            </Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
              editable={!loading}
              testID="login-code-input"
            />
            <Pressable
              style={[
                styles.button,
                (loading || code.length !== 6) && styles.buttonDisabled,
              ]}
              onPress={handleVerifyCode}
              disabled={loading || code.length !== 6}
              testID="verify-code-button"
            >
              {loading ? (
                <ActivityIndicator color={colors.accentForeground} />
              ) : (
                <Text style={styles.buttonLabel}>Verificar</Text>
              )}
            </Pressable>
            <Pressable onPress={useAnotherEmail} disabled={loading}>
              <Text style={styles.secondaryLabel}>Usar outro e-mail</Text>
            </Pressable>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    padding: 24,
  },
  title: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize['3xl'],
    color: colors.foreground,
  },
  form: {
    width: '100%',
    gap: 12,
  },
  label: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: fontSize.base,
    fontFamily: fontFamily.body,
    color: colors.foreground,
    backgroundColor: colors.surface,
  },
  codeInput: {
    textAlign: 'center',
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize['2xl'],
    letterSpacing: 8,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.base,
    color: colors.accentForeground,
  },
  secondaryLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.accent,
    textAlign: 'center',
  },
  error: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.danger,
    textAlign: 'center',
  },
});
