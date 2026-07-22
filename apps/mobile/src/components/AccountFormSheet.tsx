import { ElementRef, forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { Feather } from '@expo/vector-icons';
import { FinancialAccountType } from '@lifeos/shared';
import { colors, fontFamily, fontSize, radius } from '../theme';
import { AmountInput } from './AmountInput';
import { Chip } from './Chip';
import { api, ApiError } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { Category, FinancialAccount } from '../types';

export type AccountFormSheetRef = ElementRef<typeof BottomSheetModal>;

const TYPE_OPTIONS: { value: FinancialAccountType; label: string }[] = [
  { value: 'CHECKING', label: 'Conta corrente' },
  { value: 'SAVINGS', label: 'Poupança' },
  { value: 'WALLET', label: 'Carteira' },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito' },
];

interface Draft {
  name: string;
  type: FinancialAccountType;
  balance: string;
  creditLimit: string;
  closingDay: string;
  dueDay: string;
}

const EMPTY_DRAFT: Draft = {
  name: '',
  type: 'CHECKING',
  balance: '0',
  creditLimit: '',
  closingDay: '',
  dueDay: '',
};

interface AccountFormSheetProps {
  /** null = create mode; an existing account = edit mode. */
  account: FinancialAccount | null;
  /** All accounts, used as the funding-source picker for the credit card payoff sub-flow. */
  accounts: FinancialAccount[];
  onSaved: () => void;
  onDeleted: () => void;
  onClose: () => void;
}

export const AccountFormSheet = forwardRef<AccountFormSheetRef, AccountFormSheetProps>(
  ({ account, accounts, onSaved, onDeleted, onClose }, ref) => {
    const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [showPayoff, setShowPayoff] = useState(false);
    const [payoffAccountId, setPayoffAccountId] = useState<string | null>(null);
    const [payoffAmount, setPayoffAmount] = useState('0');
    const [payingOff, setPayingOff] = useState(false);

    useEffect(() => {
      setDraft(
        account
          ? {
              name: account.name,
              type: account.type,
              balance: account.balance,
              creditLimit: account.creditLimit ?? '',
              closingDay: account.closingDay != null ? String(account.closingDay) : '',
              dueDay: account.dueDay != null ? String(account.dueDay) : '',
            }
          : EMPTY_DRAFT
      );
      setShowPayoff(false);
      setPayoffAccountId(null);
      setPayoffAmount(account?.balance ?? '0');
    }, [account]);

    function update(patch: Partial<Draft>) {
      setDraft(prev => ({ ...prev, ...patch }));
    }

    const isCreditCard = draft.type === 'CREDIT_CARD';
    const balanceValue = Number(draft.balance || 0);
    const creditLimitValue = Number(draft.creditLimit || 0);
    const closingDayValue = Number(draft.closingDay);
    const dueDayValue = Number(draft.dueDay);
    const isValid =
      draft.name.trim().length > 0 &&
      !Number.isNaN(balanceValue) &&
      (!isCreditCard ||
        (creditLimitValue > 0 &&
          Number.isInteger(closingDayValue) &&
          closingDayValue >= 1 &&
          closingDayValue <= 31 &&
          Number.isInteger(dueDayValue) &&
          dueDayValue >= 1 &&
          dueDayValue <= 31));

    async function handleSave() {
      if (!isValid) return;
      setSaving(true);
      try {
        const body = {
          name: draft.name,
          type: draft.type,
          balance: balanceValue,
          ...(isCreditCard
            ? {
                creditLimit: creditLimitValue,
                closingDay: closingDayValue,
                dueDay: dueDayValue,
              }
            : {}),
        };
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

    async function handlePayoff() {
      if (!account || !payoffAccountId) return;
      const amount = Number(payoffAmount || 0);
      if (!(amount > 0)) return;

      setPayingOff(true);
      try {
        const categories = await api.get<Category[]>('/api/v1/categories?type=TRANSFER');
        const categoryId = categories[0]?.id;
        if (!categoryId) {
          throw new Error('Categoria de transferência não encontrada');
        }
        await api.post('/api/v1/transactions', {
          amount,
          description: `Pagamento fatura ${account.name}`,
          date: new Date().toISOString(),
          type: 'TRANSFER',
          categoryId,
          accountId: payoffAccountId,
          toAccountId: account.id,
        });
        setShowPayoff(false);
        onSaved();
      } catch (err) {
        Alert.alert('Erro', err instanceof ApiError ? err.message : 'Erro ao pagar fatura');
      } finally {
        setPayingOff(false);
      }
    }

    const payoffSourceAccounts = accounts.filter(
      a => a.type !== 'CREDIT_CARD' && a.id !== account?.id
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['80%']}
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

          <Text style={styles.label}>{isCreditCard ? 'Saldo devedor atual' : 'Saldo'}</Text>
          <AmountInput
            style={styles.input}
            value={draft.balance}
            onChangeValue={t => update({ balance: t })}
          />

          {isCreditCard && (
            <>
              <Text style={styles.label}>Limite</Text>
              <AmountInput
                style={styles.input}
                value={draft.creditLimit}
                onChangeValue={t => update({ creditLimit: t })}
              />

              <View style={styles.dayRow}>
                <View style={styles.dayField}>
                  <Text style={styles.label}>Dia de fechamento</Text>
                  <BottomSheetTextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={draft.closingDay}
                    onChangeText={t => update({ closingDay: t.replace(/[^0-9]/g, '') })}
                    placeholder="10"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
                <View style={styles.dayField}>
                  <Text style={styles.label}>Dia de vencimento</Text>
                  <BottomSheetTextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    value={draft.dueDay}
                    onChangeText={t => update({ dueDay: t.replace(/[^0-9]/g, '') })}
                    placeholder="17"
                    placeholderTextColor={colors.mutedForeground}
                  />
                </View>
              </View>
            </>
          )}

          {account && isCreditCard && (
            <>
              <Pressable
                style={styles.payoffToggle}
                onPress={() => setShowPayoff(v => !v)}
                testID="toggle-payoff"
              >
                <Feather name="credit-card" size={15} color={colors.accent} />
                <Text style={styles.payoffToggleLabel}>Pagar fatura</Text>
                <Feather
                  name={showPayoff ? 'chevron-up' : 'chevron-down'}
                  size={15}
                  color={colors.mutedForeground}
                />
              </Pressable>

              {showPayoff && (
                <View style={styles.payoffBox}>
                  {payoffSourceAccounts.length === 0 ? (
                    <Text style={styles.emptyText}>Nenhuma conta cadastrada</Text>
                  ) : (
                    <>
                      <Text style={styles.label}>Pagar com</Text>
                      <View style={styles.chipRow}>
                        {payoffSourceAccounts.map(a => (
                          <Chip
                            key={a.id}
                            label={a.name}
                            selected={payoffAccountId === a.id}
                            onPress={() =>
                              setPayoffAccountId(payoffAccountId === a.id ? null : a.id)
                            }
                          />
                        ))}
                      </View>

                      <Text style={styles.label}>Valor</Text>
                      <AmountInput
                        style={styles.input}
                        value={payoffAmount}
                        onChangeValue={setPayoffAmount}
                      />

                      <Pressable
                        style={[
                          styles.payoffButton,
                          (!payoffAccountId || payingOff) && styles.saveButtonDisabled,
                        ]}
                        onPress={handlePayoff}
                        disabled={!payoffAccountId || payingOff}
                        testID="confirm-payoff-button"
                      >
                        {payingOff ? (
                          <ActivityIndicator color={colors.accentForeground} size="small" />
                        ) : (
                          <Text style={styles.saveButtonLabel}>
                            Confirmar pagamento de {formatCurrency(payoffAmount || '0')}
                          </Text>
                        )}
                      </Pressable>
                    </>
                  )}
                </View>
              )}
            </>
          )}

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
      </BottomSheetModal>
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
  emptyText: {
    fontFamily: fontFamily.body,
    color: colors.mutedForeground,
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
  dayRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dayField: {
    flex: 1,
  },
  payoffToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
  },
  payoffToggleLabel: {
    flex: 1,
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.accent,
  },
  payoffBox: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    padding: 14,
    gap: 4,
    backgroundColor: colors.background,
  },
  payoffButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
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
