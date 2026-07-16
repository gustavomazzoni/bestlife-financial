import { ElementRef, forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { Feather } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, radius } from '../theme';
import { api, ApiError } from '../lib/api';
import { Investment } from '../types';

export type InvestmentFormSheetRef = ElementRef<typeof BottomSheet>;

interface Draft {
  name: string;
  category: string;
  balance: string;
}

const EMPTY_DRAFT: Draft = { name: '', category: '', balance: '0' };

interface InvestmentFormSheetProps {
  /** null = create mode; an existing investment = edit mode. */
  investment: Investment | null;
  onSaved: () => void;
  onDeleted: () => void;
  onClose: () => void;
}

export const InvestmentFormSheet = forwardRef<
  InvestmentFormSheetRef,
  InvestmentFormSheetProps
>(({ investment, onSaved, onDeleted, onClose }, ref) => {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDraft(
      investment
        ? { name: investment.name, category: investment.category, balance: investment.balance }
        : EMPTY_DRAFT
    );
  }, [investment]);

  function update(patch: Partial<Draft>) {
    setDraft(prev => ({ ...prev, ...patch }));
  }

  const balanceValue = Number(draft.balance.replace(',', '.'));
  const isValid =
    draft.name.trim().length > 0 &&
    draft.category.trim().length > 0 &&
    !Number.isNaN(balanceValue) &&
    balanceValue >= 0;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    try {
      const body = { name: draft.name, category: draft.category, balance: balanceValue };
      if (investment) {
        await api.patch(`/api/v1/investments/${investment.id}`, body);
      } else {
        await api.post('/api/v1/investments', body);
      }
      onSaved();
      onClose();
    } catch (err) {
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Erro ao salvar investimento');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!investment) return;
    Alert.alert('Excluir investimento', `Excluir "${investment.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await api.delete(`/api/v1/investments/${investment.id}`);
            onDeleted();
            onClose();
          } catch (err) {
            Alert.alert(
              'Erro',
              err instanceof ApiError ? err.message : 'Erro ao excluir investimento'
            );
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={['55%']}
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content} testID="investment-form-sheet">
        <Text style={styles.title}>{investment ? 'Editar investimento' : 'Novo investimento'}</Text>

        <Text style={styles.label}>Nome</Text>
        <BottomSheetTextInput
          style={styles.input}
          value={draft.name}
          onChangeText={t => update({ name: t })}
          placeholder="Ex: Tesouro Selic"
          placeholderTextColor={colors.mutedForeground}
        />

        <Text style={styles.label}>Categoria</Text>
        <BottomSheetTextInput
          style={styles.input}
          value={draft.category}
          onChangeText={t => update({ category: t })}
          placeholder="Ex: Renda fixa"
          placeholderTextColor={colors.mutedForeground}
        />

        <Text style={styles.label}>Saldo</Text>
        <BottomSheetTextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={draft.balance}
          onChangeText={t => update({ balance: t })}
        />

        {balanceValue < 0 && (
          <Text style={[styles.label, { color: colors.danger }]}>
            O saldo não pode ser negativo.
          </Text>
        )}

        <View style={styles.actionsRow}>
          {investment && (
            <Pressable
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={deleting}
              testID="investment-delete-button"
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
            testID="investment-save-button"
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
});

InvestmentFormSheet.displayName = 'InvestmentFormSheet';

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
