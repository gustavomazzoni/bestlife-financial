import { ElementRef, forwardRef, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { TransactionType, ScheduleFrequency } from '@lifeos/shared';
import { colors, fontFamily, fontSize, radius } from '../theme';
import { AmountInput } from './AmountInput';
import { Chip } from './Chip';
import { api } from '../lib/api';
import { isInferredComplete } from '../lib/inferredTransaction';
import { Category, CreditCard, FinancialAccount, InferredTransaction } from '../types';

export type BottomSheetRef = ElementRef<typeof BottomSheetModal>;

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
  creditCards: CreditCard[];
  onConfirm: (updated: InferredTransaction) => void;
  onDelete: () => void;
}

export const EditTransactionSheet = forwardRef<
  BottomSheetRef,
  EditTransactionSheetProps
>(({ value, accounts, creditCards, onConfirm, onDelete }, ref) => {
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
      <BottomSheetModal ref={ref} snapPoints={['80%']} enablePanDownToClose>
        <View style={styles.empty} />
      </BottomSheetModal>
    );
  }

  function update(patch: Partial<InferredTransaction>) {
    setDraft(prev => (prev ? { ...prev, ...patch } : prev));
  }

  const isValid =
    isInferredComplete(draft) &&
    draft.amount != null &&
    !Number.isNaN(draft.amount) &&
    draft.amount > 0 &&
    draft.description.trim().length > 0;

  function handleDelete() {
    Alert.alert(
      'Excluir mensagem',
      'Descartar esta transação sem salvar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: onDelete },
      ]
    );
  }

  return (
    <BottomSheetModal
      ref={ref}
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
              onPress={() =>
                update({
                  type: opt.value,
                  category: null,
                  accountId: null,
                  toAccountId: null,
                  creditCardId: null,
                })
              }
            />
          ))}
        </View>

        <Text style={styles.label}>Valor</Text>
        <AmountInput
          style={styles.input}
          value={draft.amount != null ? String(draft.amount) : ''}
          onChangeValue={t => update({ amount: t === '' ? null : Number(t) })}
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

        {draft.type === 'TRANSFER' ? (
          <>
            {accounts.length > 0 && (
              <>
                <Text style={styles.label}>De</Text>
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
            {(accounts.length > 0 || creditCards.length > 0) && (
              <>
                <Text style={styles.label}>Para</Text>
                <View style={styles.chipRow}>
                  {accounts.map(a => (
                    <Chip
                      key={a.id}
                      label={a.name}
                      selected={draft.toAccountId === a.id}
                      onPress={() =>
                        update({
                          toAccountId: draft.toAccountId === a.id ? null : a.id,
                          creditCardId: null,
                        })
                      }
                    />
                  ))}
                  {creditCards.map(c => (
                    <Chip
                      key={c.id}
                      icon="💳"
                      label={c.name}
                      selected={draft.creditCardId === c.id}
                      onPress={() =>
                        update({
                          creditCardId: draft.creditCardId === c.id ? null : c.id,
                          toAccountId: null,
                        })
                      }
                    />
                  ))}
                </View>
              </>
            )}
          </>
        ) : (
          <>
            {(accounts.length > 0 ||
              (draft.type === 'EXPENSE' && creditCards.length > 0)) && (
              <>
                <Text style={styles.label}>Conta</Text>
                <View style={styles.chipRow}>
                  {accounts.map(a => (
                    <Chip
                      key={a.id}
                      label={a.name}
                      selected={draft.accountId === a.id}
                      onPress={() =>
                        update({
                          accountId: draft.accountId === a.id ? null : a.id,
                          creditCardId: null,
                        })
                      }
                    />
                  ))}
                  {draft.type === 'EXPENSE' &&
                    creditCards.map(c => (
                      <Chip
                        key={c.id}
                        icon="💳"
                        label={c.name}
                        selected={draft.creditCardId === c.id}
                        onPress={() =>
                          update({
                            creditCardId: draft.creditCardId === c.id ? null : c.id,
                            accountId: null,
                            installments: 1,
                          })
                        }
                      />
                    ))}
                </View>
              </>
            )}
            {draft.type === 'EXPENSE' && draft.creditCardId && (
              <>
                <Text style={styles.label}>Parcelas</Text>
                <View style={styles.stepperRow}>
                  <Pressable
                    onPress={() =>
                      update({ installments: Math.max(1, draft.installments - 1) })
                    }
                    style={styles.stepperButton}
                    hitSlop={8}
                  >
                    <Feather name="minus" size={16} color={colors.foreground} />
                  </Pressable>
                  <Text style={styles.stepperValue}>{draft.installments}x</Text>
                  <Pressable
                    onPress={() =>
                      update({ installments: Math.min(24, draft.installments + 1) })
                    }
                    style={styles.stepperButton}
                    hitSlop={8}
                  >
                    <Feather name="plus" size={16} color={colors.foreground} />
                  </Pressable>
                </View>
              </>
            )}
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

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.deleteButton}
            onPress={handleDelete}
            testID="delete-edit-button"
          >
            <Feather name="trash-2" size={16} color={colors.danger} />
          </Pressable>
          <Pressable
            style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
            onPress={() => onConfirm(draft)}
            disabled={!isValid}
            testID="confirm-edit-button"
          >
            <Text style={styles.saveButtonLabel}>Confirmar</Text>
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
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
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize.base,
    color: colors.foreground,
    minWidth: 32,
    textAlign: 'center',
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
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
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
    borderRadius: 12,
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
});
