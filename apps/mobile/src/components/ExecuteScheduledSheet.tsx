import { ElementRef, forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, fontFamily, fontSize, radius } from '../theme';
import { Chip } from './Chip';
import { api, ApiError } from '../lib/api';
import { FinancialAccount } from '../types';

export type ExecuteScheduledSheetRef = ElementRef<typeof BottomSheetModal>;

interface ExecuteScheduledSheetItem {
  scheduledId: string;
  description: string;
}

interface ExecuteScheduledSheetProps {
  item: ExecuteScheduledSheetItem | null;
  accounts: FinancialAccount[];
  onExecuted: () => void;
}

/**
 * Confirms executing (marking as paid) a scheduled transaction — lets the
 * user pick the date it was actually paid (defaults to today) and which
 * account it came from. ScheduledTransaction itself has no account (that's
 * only known once it's paid), so this is the one place that field is set.
 */
export const ExecuteScheduledSheet = forwardRef<
  ExecuteScheduledSheetRef,
  ExecuteScheduledSheetProps
>(({ item, accounts, onExecuted }, ref) => {
  const [date, setDate] = useState(new Date());
  const [accountId, setAccountId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setDate(new Date());
      setAccountId(null);
    }
  }, [item]);

  if (!item) {
    return (
      <BottomSheetModal ref={ref} snapPoints={['50%']} enablePanDownToClose>
        <View style={styles.empty} />
      </BottomSheetModal>
    );
  }

  async function handleConfirm() {
    if (!item) return;
    setSaving(true);
    try {
      await api.post(`/api/v1/scheduled/${item.scheduledId}/execute`, {
        date: date.toISOString().split('T')[0],
        accountId: accountId ?? undefined,
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
      snapPoints={['55%']}
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        testID="execute-scheduled-sheet"
      >
        <Text style={styles.title}>Executar agendamento</Text>
        <Text style={styles.subtitle}>{item.description}</Text>

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
