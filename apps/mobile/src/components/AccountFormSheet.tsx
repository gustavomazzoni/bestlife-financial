import { ElementRef, forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { Feather } from '@expo/vector-icons';
import { FinancialAccountType } from '@lifeos/shared';
import { colors, fontFamily, fontSize, radius } from '../theme';
import { Chip } from './Chip';
import { api, ApiError } from '../lib/api';
import { FinancialAccount } from '../types';

export type AccountFormSheetRef = ElementRef<typeof BottomSheet>;

const TYPE_OPTIONS: { value: FinancialAccountType; label: string }[] = [
  { value: 'CHECKING', label: 'Conta corrente' },
  { value: 'SAVINGS', label: 'Poupança' },
  { value: 'WALLET', label: 'Carteira' },
];

interface Draft {
  name: string;
  type: FinancialAccountType;
  balance: string;
}

const EMPTY_DRAFT: Draft = { name: '', type: 'CHECKING', balance: '0' };

interface AccountFormSheetProps {
  /** null = create mode; an existing account = edit mode. */
  account: FinancialAccount | null;
  onSaved: () => void;
  onDeleted: () => void;
  onClose: () => void;
}

export const AccountFormSheet = forwardRef<AccountFormSheetRef, AccountFormSheetProps>(
  ({ account, onSaved, onDeleted, onClose }, ref) => {
    const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
      setDraft(
        account
          ? { name: account.name, type: account.type, balance: account.balance }
          : EMPTY_DRAFT
      );
    }, [account]);

    function update(patch: Partial<Draft>) {
      setDraft(prev => ({ ...prev, ...patch }));
    }

    const balanceValue = Number(draft.balance.replace(',', '.'));
    const isValid = draft.name.trim().length > 0 && !Number.isNaN(balanceValue);

    async function handleSave() {
      if (!isValid) return;
      setSaving(true);
      try {
        const body = { name: draft.name, type: draft.type, balance: balanceValue };
        if (account) {
          await api.patch(`/api/v1/accounts/${account.id}`, body);
        } else {
          await api.post('/api/v1/accounts', body);
        }
        onSaved();
        onClose();
      } catch (err) {
        Alert.alert('Erro', err instanceof ApiError ? err.message : 'Erro ao salvar conta');
      } finally {
        setSaving(false);
      }
    }

    function handleDelete() {
      if (!account) return;
      Alert.alert(
        'Excluir conta',
        `Excluir "${account.name}"? Transações vinculadas serão mantidas, mas deixarão de estar associadas a essa conta.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              setDeleting(true);
              try {
                await api.delete(`/api/v1/accounts/${account.id}`);
                onDeleted();
                onClose();
              } catch (err) {
                Alert.alert(
                  'Erro',
                  err instanceof ApiError ? err.message : 'Erro ao excluir conta'
                );
              } finally {
                setDeleting(false);
              }
            },
          },
        ]
      );
    }

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['60%']}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content} testID="account-form-sheet">
          <Text style={styles.title}>{account ? 'Editar conta' : 'Nova conta'}</Text>

          <Text style={styles.label}>Nome</Text>
          <BottomSheetTextInput
            style={styles.input}
            value={draft.name}
            onChangeText={t => update({ name: t })}
            placeholder="Ex: Nubank"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.chipRow}>
            {TYPE_OPTIONS.map(opt => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={draft.type === opt.value}
                onPress={() => update({ type: opt.value })}
              />
            ))}
          </View>

          <Text style={styles.label}>Saldo</Text>
          <BottomSheetTextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={draft.balance}
            onChangeText={t => update({ balance: t })}
          />

          <View style={styles.actionsRow}>
            {account && (
              <Pressable
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={deleting}
                testID="account-delete-button"
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <Feather name="trash-2" size={16} color={colors.danger} />
                )}
              </Pressable>
            )}
            <Pressable
              style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!isValid || saving}
              testID="account-save-button"
            >
              {saving ? (
                <ActivityIndicator color={colors.accentForeground} size="small" />
              ) : (
                <Text style={styles.saveButtonLabel}>Salvar</Text>
              )}
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

AccountFormSheet.displayName = 'AccountFormSheet';

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.surface,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 8,
  },
  title: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize.xl,
    color: colors.foreground,
    marginBottom: 8,
  },
  label: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  deleteButton: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.background,
  },
  saveButton: {
    flex: 1,
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
    fontSize: fontSize.sm,
    color: colors.accentForeground,
  },
});
