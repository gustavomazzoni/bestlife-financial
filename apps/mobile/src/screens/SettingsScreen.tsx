import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize, radius } from '../theme';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { Chip } from '../components/Chip';
import { useApiData } from '../hooks/useApiData';
import { useAuth } from '../lib/authContext';
import { api, ApiError } from '../lib/api';
import { FinancialAccount, UserPreferences, UserProfile } from '../types';
import { HomeStackParamList } from '../navigation/HomeStack';

type Props = NativeStackScreenProps<HomeStackParamList, 'Settings'>;

interface Draft {
  activeIncomeMonthly: string;
  passiveIncomeMonthly: string;
  dreamLifestyleCost: string;
  currentInvestments: string;
}

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const profile = useApiData(() => api.get<UserProfile>('/api/v1/user/profile'));
  const preferences = useApiData(() =>
    api.get<UserPreferences>('/api/v1/user/preferences')
  );
  const accounts = useApiData(() => api.get<FinancialAccount[]>('/api/v1/accounts'));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingDefaultAccount, setSavingDefaultAccount] = useState(false);

  useEffect(() => {
    if (profile.data) {
      setDraft({
        activeIncomeMonthly: String(profile.data.activeIncomeMonthly),
        passiveIncomeMonthly: String(profile.data.passiveIncomeMonthly),
        dreamLifestyleCost: profile.data.dreamLifestyleCost != null
          ? String(profile.data.dreamLifestyleCost)
          : '',
        currentInvestments: String(profile.data.currentInvestments),
      });
    }
  }, [profile.data]);

  function update(patch: Partial<Draft>) {
    setDraft(prev => (prev ? { ...prev, ...patch } : prev));
  }

  if (profile.loading || accounts.loading || preferences.loading || !draft) {
    return <LoadingState />;
  }
  if (profile.error) {
    return <ErrorState message={profile.error} onRetry={profile.refetch} />;
  }

  async function handleSetDefaultAccount(accountId: string) {
    setSavingDefaultAccount(true);
    try {
      await api.patch('/api/v1/user/preferences', {
        defaultExpenseAccountId:
          preferences.data?.defaultExpenseAccountId === accountId ? null : accountId,
      });
      preferences.refetch();
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Erro ao salvar conta padrão'
      );
    } finally {
      setSavingDefaultAccount(false);
    }
  }

  function parsed(value: string): number {
    return Number(value.replace(',', '.'));
  }

  const activeIncome = parsed(draft.activeIncomeMonthly);
  const passiveIncome = parsed(draft.passiveIncomeMonthly);
  const dreamCost = parsed(draft.dreamLifestyleCost);
  const investments = parsed(draft.currentInvestments);
  const isValid =
    !Number.isNaN(activeIncome) &&
    activeIncome >= 0 &&
    !Number.isNaN(passiveIncome) &&
    passiveIncome >= 0 &&
    !Number.isNaN(dreamCost) &&
    dreamCost > 0 &&
    !Number.isNaN(investments) &&
    investments >= 0;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    try {
      await api.patch('/api/v1/user/profile', {
        activeIncomeMonthly: activeIncome,
        passiveIncomeMonthly: passiveIncome,
        dreamLifestyleCost: dreamCost,
        currentInvestments: investments,
      });
      profile.refetch();
      Alert.alert('Salvo', 'Seu perfil foi atualizado.');
    } catch (err) {
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  return (
    <View style={styles.container} testID="settings-screen">
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton} hitSlop={8}>
          <Feather name="chevron-left" size={18} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Configurações</Text>
          <Text style={styles.subtitle}>Seu perfil financeiro</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Renda ativa mensal</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={draft.activeIncomeMonthly}
          onChangeText={t => update({ activeIncomeMonthly: t })}
        />

        <Text style={styles.label}>Renda passiva mensal</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={draft.passiveIncomeMonthly}
          onChangeText={t => update({ passiveIncomeMonthly: t })}
        />

        <Text style={styles.label}>Custo de vida dos sonhos</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={draft.dreamLifestyleCost}
          onChangeText={t => update({ dreamLifestyleCost: t })}
        />

        <Text style={styles.label}>Investimentos atuais</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={draft.currentInvestments}
          onChangeText={t => update({ currentInvestments: t })}
        />

        <Text style={styles.label}>Conta padrão para gastos</Text>
        {accounts.data && accounts.data.length > 0 ? (
          <View style={styles.chipRow} testID="default-expense-account-picker">
            {accounts.data.map(a => (
              <Chip
                key={a.id}
                label={a.name}
                selected={preferences.data?.defaultExpenseAccountId === a.id}
                onPress={() => !savingDefaultAccount && handleSetDefaultAccount(a.id)}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Nenhuma conta cadastrada</Text>
        )}

        <Pressable
          style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isValid || saving}
          testID="settings-save-button"
        >
          {saving ? (
            <ActivityIndicator color={colors.accentForeground} size="small" />
          ) : (
            <Text style={styles.saveButtonLabel}>Salvar</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.signOutButton}
          onPress={handleSignOut}
          testID="settings-sign-out-button"
        >
          <Feather name="log-out" size={16} color={colors.danger} />
          <Text style={styles.signOutButtonLabel}>Sair</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.lg,
    color: colors.foreground,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  label: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    color: colors.foreground,
    backgroundColor: colors.surface,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  saveButton: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.base,
    color: colors.accentForeground,
  },
  signOutButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  signOutButtonLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.base,
    color: colors.danger,
  },
});
