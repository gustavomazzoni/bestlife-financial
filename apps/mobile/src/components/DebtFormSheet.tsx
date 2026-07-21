import { ElementRef, forwardRef, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, radius } from '../theme';
import { AmountInput } from './AmountInput';
import { api, ApiError } from '../lib/api';
import { Debt } from '../types';

export type DebtFormSheetRef = ElementRef<typeof BottomSheetModal>;

interface Draft {
  name: string;
  balance: string;
  dueDate: string | null;
  installmentCurrent: string;
  installmentTotal: string;
}

const EMPTY_DRAFT: Draft = {
  name: '',
  balance: '0',
  dueDate: null,
  installmentCurrent: '',
  installmentTotal: '',
};

interface DebtFormSheetProps {
  /** null = create mode; an existing debt = edit mode. */
  debt: Debt | null;
  onSaved: () => void;
  onDeleted: () => void;
  onClose: () => void;
}

export const DebtFormSheet = forwardRef<DebtFormSheetRef, DebtFormSheetProps>(
  ({ debt, onSaved, onDeleted, onClose }, ref) => {
    const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
      setDraft(
        debt
          ? {
              name: debt.name,
              balance: debt.balance,
              dueDate: debt.dueDate,
              installmentCurrent: debt.installmentCurrent?.toString() ?? '',
              installmentTotal: debt.installmentTotal?.toString() ?? '',
            }
          : EMPTY_DRAFT
      );
    }, [debt]);

    function update(patch: Partial<Draft>) {
      setDraft(prev => ({ ...prev, ...patch }));
    }

    const balanceValue = Number(draft.balance || 0);
    const installmentTotalValue = draft.installmentTotal
      ? Number(draft.installmentTotal)
      : undefined;
    const installmentCurrentValue = draft.installmentCurrent
      ? Number(draft.installmentCurrent)
      : undefined;
    const isValid =
      draft.name.trim().length > 0 &&
      !Number.isNaN(balanceValue) &&
      balanceValue >= 0 &&
      (installmentTotalValue === undefined ||
        (Number.isInteger(installmentTotalValue) && installmentTotalValue > 0)) &&
      (installmentCurrentValue === undefined ||
        (Number.isInteger(installmentCurrentValue) &&
          installmentCurrentValue >= 0 &&
          (installmentTotalValue === undefined ||
            installmentCurrentValue <= installmentTotalValue)));

    async function handleSave() {
      if (!isValid) return;
      setSaving(true);
      try {
        const body = {
          name: draft.name,
          balance: balanceValue,
          dueDate: draft.dueDate ?? undefined,
          installmentTotal: installmentTotalValue,
          installmentCurrent: installmentCurrentValue,
        };
        if (debt) {
          await api.patch(`/api/v1/debts/${debt.id}`, body);
        } else {
          await api.post('/api/v1/debts', body);
        }
        onSaved();
        onClose();
      } catch (err) {
        Alert.alert('Erro', err instanceof ApiError ? err.message : 'Erro ao salvar dívida');
      } finally {
        setSaving(false);
      }
    }

    function handleDelete() {
      if (!debt) return;
      Alert.alert('Excluir dívida', `Excluir "${debt.name}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/api/v1/debts/${debt.id}`);
              onDeleted();
              onClose();
            } catch (err) {
              Alert.alert(
                'Erro',
                err instanceof ApiError ? err.message : 'Erro ao excluir dívida'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]);
    }

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['75%']}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content} testID="debt-form-sheet">
          <Text style={styles.title}>{debt ? 'Editar dívida' : 'Nova dívida'}</Text>

          <Text style={styles.label}>Nome</Text>
          <BottomSheetTextInput
            style={styles.input}
            value={draft.name}
            onChangeText={t => update({ name: t })}
            placeholder="Ex: Cartão Nubank"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={styles.label}>Saldo devedor</Text>
          <AmountInput
            style={styles.input}
            value={draft.balance}
            onChangeValue={t => update({ balance: t })}
          />

          <Text style={styles.label}>Vencimento (opcional)</Text>
          <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonLabel}>
              {draft.dueDate
                ? new Date(`${draft.dueDate.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR')
                : 'Sem data de vencimento'}
            </Text>
          </Pressable>
          {draft.dueDate && (
            <Pressable onPress={() => update({ dueDate: null })} hitSlop={8}>
              <Text style={styles.clearLabel}>Remover data</Text>
            </Pressable>
          )}
          {showDatePicker && (
            <DateTimePicker
              value={draft.dueDate ? new Date(`${draft.dueDate.slice(0, 10)}T00:00:00`) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, selected) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selected) update({ dueDate: selected.toISOString() });
              }}
            />
          )}

          <Text style={styles.label}>Parcelas (opcional)</Text>
          <View style={styles.installmentRow}>
            <BottomSheetTextInput
              style={[styles.input, styles.installmentInput]}
              keyboardType="number-pad"
              value={draft.installmentCurrent}
              onChangeText={t => update({ installmentCurrent: t.replace(/[^0-9]/g, '') })}
              placeholder="Atual"
              placeholderTextColor={colors.mutedForeground}
            />
            <Text style={styles.installmentSeparator}>/</Text>
            <BottomSheetTextInput
              style={[styles.input, styles.installmentInput]}
              keyboardType="number-pad"
              value={draft.installmentTotal}
              onChangeText={t => update({ installmentTotal: t.replace(/[^0-9]/g, '') })}
              placeholder="Total"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          <View style={styles.actionsRow}>
            {debt && (
              <Pressable
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={deleting}
                testID="debt-delete-button"
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
              testID="debt-save-button"
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

DebtFormSheet.displayName = 'DebtFormSheet';

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
  clearLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.xs,
    color: colors.accent,
    marginTop: 4,
  },
  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  installmentInput: {
    flex: 1,
  },
  installmentSeparator: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.base,
    color: colors.mutedForeground,
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
