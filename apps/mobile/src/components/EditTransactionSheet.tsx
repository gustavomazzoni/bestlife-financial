import { ElementRef, forwardRef, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TransactionType, ScheduleFrequency } from '@lifeos/shared';
import { colors, fontFamily, fontSize } from '../theme';
import { Chip } from './Chip';
import { api } from '../lib/api';
import { Category, FinancialAccount, InferredTransaction } from '../types';

export type BottomSheetRef = ElementRef<typeof BottomSheet>;

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'EXPENSE', label: 'Despesa' },
  { value: 'INCOME', label: 'Receita' },
  { value: 'SAVING', label: 'Poupança' },
  { value: 'TRANSFER', label: 'Transferência' },
];

const FREQUENCY_OPTIONS: { value: ScheduleFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'YEARLY', label: 'Anual' },
];

interface EditTransactionSheetProps {
  value: InferredTransaction | null;
  accounts: FinancialAccount[];
  onSave: (updated: InferredTransaction) => void;
}

export const EditTransactionSheet = forwardRef<
  BottomSheetRef,
  EditTransactionSheetProps
>(({ value, accounts, onSave }, ref) => {
  const [draft, setDraft] = useState<InferredTransaction | null>(value);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function loadCategories(type: string) {
    setCategoriesError(false);
    api
      .get<Category[]>(`/api/v1/categories?type=${type}`)
      .then(setCategories)
      .catch(() => setCategoriesError(true));
  }

  useEffect(() => {
    if (!draft) return;
    loadCategories(draft.type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.type]);

  if (!draft) {
    return (
      <BottomSheet ref={ref} index={-1} snapPoints={['80%']} enablePanDownToClose>
        <View style={styles.empty} />
      </BottomSheet>
    );
  }

  function update(patch: Partial<InferredTransaction>) {
    setDraft(prev => (prev ? { ...prev, ...patch } : prev));
  }

  const isValid =
    draft.amount != null &&
    !Number.isNaN(draft.amount) &&
    draft.amount > 0 &&
    draft.description.trim().length > 0;

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={['85%']}
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        testID="edit-transaction-sheet"
      >
        <Text style={styles.title}>Editar transação</Text>

        <Text style={styles.label}>Tipo</Text>
        <View style={styles.chipRow}>
          {TYPE_OPTIONS.map(opt => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={draft.type === opt.value}
              onPress={() => update({ type: opt.value, category: null })}
            />
          ))}
        </View>

        <Text style={styles.label}>Valor</Text>
        <BottomSheetTextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={draft.amount != null ? String(draft.amount) : ''}
          onChangeText={t => {
            if (!t) {
              update({ amount: null });
              return;
            }
            const parsed = Number(t.replace(',', '.'));
            if (!Number.isNaN(parsed)) update({ amount: parsed });
          }}
        />

        <Text style={styles.label}>Descrição</Text>
        <BottomSheetTextInput
          style={styles.input}
          value={draft.description}
          onChangeText={t => update({ description: t })}
        />

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
                selected={draft.category?.id === c.id}
                onPress={() => update({ category: { id: c.id, name: c.name } })}
              />
            ))}
          </View>
        )}

        {accounts.length > 0 && (
          <>
            <Text style={styles.label}>Conta</Text>
            <View style={styles.chipRow}>
              {accounts.map(a => (
                <Chip
                  key={a.id}
                  label={a.name}
                  selected={draft.accountId === a.id}
                  onPress={() =>
                    update({ accountId: draft.accountId === a.id ? null : a.id })
                  }
                />
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Data</Text>
        <Pressable
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonLabel}>
            {new Date(draft.date).toLocaleDateString('pt-BR')}
          </Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(draft.date)}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_, selected) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selected) update({ date: selected.toISOString() });
            }}
          />
        )}

        <View style={styles.recurringHeader}>
          <Text style={styles.label}>Recorrente</Text>
          <Pressable
            onPress={() =>
              update({
                isRecurring: !draft.isRecurring,
                frequency: !draft.isRecurring ? 'MONTHLY' : null,
              })
            }
            style={[styles.toggle, draft.isRecurring && styles.toggleOn]}
          >
            <View
              style={[styles.toggleThumb, draft.isRecurring && styles.toggleThumbOn]}
            />
          </Pressable>
        </View>
        {draft.isRecurring && (
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
        )}

        <Pressable
          style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
          onPress={() => onSave(draft)}
          disabled={!isValid}
          testID="save-edit-button"
        >
          <Text style={styles.saveButtonLabel}>Salvar</Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

EditTransactionSheet.displayName = 'EditTransactionSheet';

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
  recurringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border,
    padding: 2,
    marginTop: 8,
  },
  toggleOn: {
    backgroundColor: colors.accent,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  toggleThumbOn: {
    transform: [{ translateX: 18 }],
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.base,
    color: colors.accentForeground,
  },
});
