import { ElementRef, forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { TransactionType } from '@lifeos/shared';
import { colors, fontFamily, fontSize, radius } from '../theme';
import { AmountInput } from './AmountInput';
import { Chip } from './Chip';
import { api, ApiError } from '../lib/api';
import { FinancialAccount } from '../types';

export type ExecuteScheduledSheetRef = ElementRef<typeof BottomSheetModal>;

interface ExecuteScheduledSheetItem {
  scheduledId: string;
  description: string;
  amount: string;
  type: TransactionType;
  accountId: string | null;
}

interface ExecuteScheduledSheetProps {
  item: ExecuteScheduledSheetItem | null;
  accounts: FinancialAccount[];
  onExecuted: () => void;
}

/**
 * Confirms executing (marking as paid) a scheduled transaction — lets the
 * user pick the date it was actually paid (defaults to today), override the
 * amount for this occurrence only (e.g. a utility bill that varies month to
 * month), and which account it came from — pre-filled from the schedule's
 * own accountId when it has one ("automatic debit"), but always editable,
 * since execution is still a deliberate manual action even for those.
 */
export const ExecuteScheduledSheet = forwardRef<
  ExecuteScheduledSheetRef,
  ExecuteScheduledSheetProps
>(({ item, accounts, onExecuted }, ref) => {
  const [date, setDate] = useState(new Date());
  const [accountId, setAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState('0');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setDate(new Date());
      setAccountId(item.accountId);
      setAmount(item.amount);
    }
  }, [item]);

  if (!item) {
    return (
      <BottomSheetModal ref={ref} snapPoints={['50%']} enablePanDownToClose>
        <View style={styles.empty} />
      </BottomSheetModal>
    );
  }

  const selectedAccount = accounts.find(a => a.id === accountId);
  const amountValue = Number(amount || 0);
  const insufficientFunds =
    item.type === 'EXPENSE' &&
    !!selectedAccount &&
    Number(selectedAccount.balance) - amountValue < 0;

  async function handleConfirm() {
    if (!item) return;
    setSaving(true);
    try {
      await api.post(`/api/v1/scheduled/${item.scheduledId}/execute`, {
        date: date.toISOString().split('T')[0],
        accountId: accountId ?? undefined,
        amount: amountValue,
      });
      onExecuted();
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof ApiError ? err.message : 'Erro ao executar transação'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['60%']}
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        testID="execute-scheduled-sheet"
      >
        <Text style={styles.title}>Executar agendamento</Text>
        <Text style={styles.subtitle}>{item.description}</Text>

        <Text style={styles.label}>Valor</Text>
        <AmountInput style={styles.input} value={amount} onChangeValue={setAmount} />

        <Text style={styles.label}>Data</Text>
        <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateButtonLabel}>{date.toLocaleDateString('pt-BR')}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            maximumDate={new Date()}
            onChange={(_, selected) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selected) setDate(selected);
            }}
          />
        )}

        {accounts.length > 0 && (
          <>
            <Text style={styles.label}>Conta</Text>
            <View style={styles.chipRow}>
              {accounts.map(a => (
                <Chip
                  key={a.id}
                  label={a.name}
                  selected={accountId === a.id}
                  onPress={() => setAccountId(accountId === a.id ? null : a.id)}
                />
              ))}
            </View>
          </>
        )}

        {insufficientFunds && (
          <View style={styles.warningBanner}>
            <Feather name="alert-triangle" size={14} color={colors.danger} />
            <Text style={styles.warningText}>
              Saldo insuficiente em {selectedAccount?.name} para este valor.
            </Text>
          </View>
        )}

        <Pressable
          style={styles.confirmButton}
          onPress={handleConfirm}
          disabled={saving}
          testID="execute-confirm-button"
        >
          {saving ? (
            <ActivityIndicator color={colors.accentForeground} size="small" />
          ) : (
            <Text style={styles.confirmButtonLabel}>Confirmar</Text>
          )}
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

ExecuteScheduledSheet.displayName = 'ExecuteScheduledSheet';

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.surface,
  },
  empty: {
    flex: 1,
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
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
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
  dateButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.background,
  },
  dateButtonLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
  },
  warningText: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.danger,
  },
  confirmButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.base,
    color: colors.accentForeground,
  },
});
