import { ElementRef, forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { ScheduleFrequency } from '@lifeos/shared';
import { colors, fontFamily, fontSize, radius } from '../theme';
import { Chip } from './Chip';
import { IconBadge } from './IconBadge';
import { api, ApiError } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { Category, ScheduledTransaction } from '../types';

export type ScheduledDetailSheetRef = ElementRef<typeof BottomSheet>;

const FREQUENCY_OPTIONS: { value: ScheduleFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'YEARLY', label: 'Anual' },
];

const FREQUENCY_LABEL: Record<ScheduleFrequency, string> = {
  ONCE: 'Única vez',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
};

const typeColor: Record<string, string> = {
  INCOME: colors.income,
  EXPENSE: colors.expense,
  SAVING: colors.saving,
  TRANSFER: colors.transfer,
};

function formatDateOnly(date: string): string {
  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR');
}

interface ScheduledDetailSheetProps {
  scheduled: ScheduledTransaction | null;
  /** Called after a successful edit — the sheet stays open showing the saved data. */
  onSaved: () => void;
  /** Called after a successful cancel/delete — the caller should close the sheet. */
  onDeleted: () => void;
}

export const ScheduledDetailSheet = forwardRef<
  ScheduledDetailSheetRef,
  ScheduledDetailSheetProps
>(({ scheduled, onSaved, onDeleted }, ref) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [draft, setDraft] = useState<ScheduledTransaction | null>(scheduled);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDraft(scheduled);
    setMode('view');
  }, [scheduled]);

  function loadCategories(type: string) {
    setCategoriesError(false);
    api
      .get<Category[]>(`/api/v1/categories?type=${type}`)
      .then(setCategories)
      .catch(() => setCategoriesError(true));
  }

  useEffect(() => {
    if (mode === 'edit' && draft) loadCategories(draft.type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, draft?.type]);

  if (!draft) {
    return (
      <BottomSheet ref={ref} index={-1} snapPoints={['70%']} enablePanDownToClose>
        <View style={styles.empty} />
      </BottomSheet>
    );
  }

  function update(patch: Partial<ScheduledTransaction>) {
    setDraft(prev => (prev ? { ...prev, ...patch } : prev));
  }

  const amountValue = Number(draft.amount);
  const isValid =
    !Number.isNaN(amountValue) && amountValue > 0 && draft.description.trim().length > 0;

  async function handleSave() {
    if (!draft || !isValid) return;
    setSaving(true);
    try {
      await api.patch(`/api/v1/scheduled/${draft.id}`, {
        amount: amountValue,
        description: draft.description,
        categoryId: draft.categoryId,
        frequency: draft.frequency !== 'ONCE' ? draft.frequency : undefined,
        startDate: draft.startDate,
        endDate: draft.endDate,
      });
      setMode('view');
      onSaved();
    } catch (err) {
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Erro ao salvar agendamento');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Cancelar agendamento',
      `Cancelar "${draft?.description}"? ${
        draft?.frequency === 'ONCE'
          ? 'Essa ação não pode ser desfeita.'
          : 'Isso interrompe as próximas ocorrências recorrentes.'
      }`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar agendamento',
          style: 'destructive',
          onPress: async () => {
            if (!draft) return;
            setDeleting(true);
            try {
              await api.delete(`/api/v1/scheduled/${draft.id}`);
              onDeleted();
            } catch (err) {
              Alert.alert(
                'Erro',
                err instanceof ApiError ? err.message : 'Erro ao cancelar agendamento'
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
      snapPoints={['75%']}
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        testID="scheduled-detail-sheet"
      >
        {mode === 'view' ? (
          <>
            <View style={styles.viewHeader}>
              <IconBadge
                color={colors.warningSoft}
                icon={<Feather name="clock" size={19} color={colors.warning} />}
                size={44}
              />
              <View style={styles.viewHeaderText}>
                <Text style={styles.title} numberOfLines={1}>
                  {draft.description}
                </Text>
                <Text style={styles.subtitle}>{draft.category?.name ?? 'Sem categoria'}</Text>
              </View>
            </View>

            <Text style={[styles.amountDisplay, { color: typeColor[draft.type] }]}>
              {formatCurrency(draft.amount)}
            </Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Frequência</Text>
              <Text style={styles.detailValue}>{FREQUENCY_LABEL[draft.frequency]}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Próxima ocorrência</Text>
              <Text style={styles.detailValue}>{formatDateOnly(draft.nextOccurrence)}</Text>
            </View>
            {draft.endDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Até</Text>
                <Text style={styles.detailValue}>{formatDateOnly(draft.endDate)}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>{draft.isActive ? 'Ativo' : 'Inativo'}</Text>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.editButton}
                onPress={() => setMode('edit')}
                testID="scheduled-edit-button"
              >
                <Feather name="edit-2" size={15} color={colors.foreground} />
                <Text style={styles.editButtonLabel}>Editar</Text>
              </Pressable>
              <Pressable
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={deleting}
                testID="scheduled-delete-button"
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <>
                    <Feather name="x-circle" size={15} color={colors.danger} />
                    <Text style={styles.deleteButtonLabel}>Cancelar</Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Editar agendamento</Text>

            <Text style={styles.label}>Valor</Text>
            <BottomSheetTextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={draft.amount}
              onChangeText={t => update({ amount: t.replace(',', '.') })}
            />

            <Text style={styles.label}>Descrição</Text>
            <BottomSheetTextInput
              style={styles.input}
              value={draft.description}
              onChangeText={t => update({ description: t })}
            />

            <Text style={styles.label}>
              {draft.frequency === 'ONCE' ? 'Data' : 'Próxima ocorrência'}
            </Text>
            <Pressable style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
              <Text style={styles.dateButtonLabel}>{formatDateOnly(draft.startDate)}</Text>
            </Pressable>
            {showStartDatePicker && (
              <DateTimePicker
                value={new Date(`${draft.startDate.slice(0, 10)}T00:00:00`)}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_, selected) => {
                  setShowStartDatePicker(Platform.OS === 'ios');
                  if (selected) update({ startDate: selected.toISOString() });
                }}
              />
            )}

            <Text style={styles.label}>Categoria</Text>
            {categoriesError ? (
              <View style={styles.fetchErrorRow}>
                <Text style={styles.fetchErrorText}>Não foi possível carregar categorias.</Text>
                <Pressable onPress={() => loadCategories(draft.type)} hitSlop={8}>
                  <Text style={styles.fetchErrorRetry}>Tentar novamente</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.chipRow}>
                {categories.map(c => (
                  <Chip
                    key={c.id}
                    label={c.name}
                    icon={c.icon}
                    selected={draft.categoryId === c.id}
                    onPress={() => update({ categoryId: c.id, category: c })}
                  />
                ))}
              </View>
            )}

            {draft.frequency !== 'ONCE' && (
              <>
                <Text style={styles.label}>Frequência</Text>
                <View style={styles.chipRow}>
                  {FREQUENCY_OPTIONS.map(opt => (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      selected={draft.frequency === opt.value}
                      onPress={() => update({ frequency: opt.value })}
                    />
                  ))}
                </View>

                <Text style={styles.label}>Até (opcional)</Text>
                <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateButtonLabel}>
                    {draft.endDate ? formatDateOnly(draft.endDate) : 'Sem data final'}
                  </Text>
                </Pressable>
                {draft.endDate && (
                  <Pressable onPress={() => update({ endDate: null })} hitSlop={8}>
                    <Text style={styles.clearDateLabel}>Remover data final</Text>
                  </Pressable>
                )}
                {showDatePicker && (
                  <DateTimePicker
                    value={
                      draft.endDate
                        ? new Date(`${draft.endDate.slice(0, 10)}T00:00:00`)
                        : new Date()
                    }
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(_, selected) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selected) update({ endDate: selected.toISOString() });
                    }}
                  />
                )}
              </>
            )}

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setDraft(scheduled);
                  setMode('view');
                }}
                disabled={saving}
              >
                <Text style={styles.cancelButtonLabel}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!isValid || saving}
                testID="scheduled-save-button"
              >
                {saving ? (
                  <ActivityIndicator color={colors.accentForeground} size="small" />
                ) : (
                  <Text style={styles.saveButtonLabel}>Salvar</Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

ScheduledDetailSheet.displayName = 'ScheduledDetailSheet';

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
  viewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 4,
  },
  viewHeaderText: {
    flex: 1,
    minWidth: 0,
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
    marginTop: 1,
  },
  amountDisplay: {
    fontFamily: fontFamily.displayBold,
    fontSize: 32,
    marginTop: 12,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  detailLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  detailValue: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  editButtonLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.background,
  },
  deleteButtonLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.danger,
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
  fetchErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fetchErrorText: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.danger,
  },
  fetchErrorRetry: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.xs,
    color: colors.accent,
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
  clearDateLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.xs,
    color: colors.accent,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
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
