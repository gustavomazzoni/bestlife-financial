import { ElementRef, forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { TransactionType } from '@lifeos/shared';
import { colors, fontFamily, fontSize, radius } from '../theme';
import { AmountInput } from './AmountInput';
import { Chip } from './Chip';
import { IconBadge } from './IconBadge';
import { api, ApiError } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { Category, CreditCard, FinancialAccount, Transaction } from '../types';

export type TransactionDetailSheetRef = ElementRef<typeof BottomSheetModal>;

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'EXPENSE', label: 'Despesa' },
  { value: 'INCOME', label: 'Receita' },
  { value: 'SAVING', label: 'Poupança' },
  { value: 'TRANSFER', label: 'Transferência' },
];

const typeColor: Record<string, string> = {
  INCOME: colors.income,
  EXPENSE: colors.expense,
  SAVING: colors.saving,
  TRANSFER: colors.transfer,
};

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  accounts: FinancialAccount[];
  creditCards: CreditCard[];
  /** Called after a successful edit — the sheet stays open showing the saved data. */
  onSaved: () => void;
  /** Called after a successful delete — the caller should close the sheet. */
  onDeleted: () => void;
}

export const TransactionDetailSheet = forwardRef<
  TransactionDetailSheetRef,
  TransactionDetailSheetProps
>(({ transaction, accounts, creditCards, onSaved, onDeleted }, ref) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [draft, setDraft] = useState<Transaction | null>(transaction);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDraft(transaction);
    setMode('view');
  }, [transaction]);

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
      <BottomSheetModal ref={ref} snapPoints={['75%']} enablePanDownToClose>
        <View style={styles.empty} />
      </BottomSheetModal>
    );
  }

  function update(patch: Partial<Transaction>) {
    setDraft(prev => (prev ? { ...prev, ...patch } : prev));
  }

  const amountValue = Number(draft.amount);
  const isValid =
    !Number.isNaN(amountValue) && amountValue > 0 && draft.description.trim().length > 0;

  async function handleSave() {
    if (!draft || !isValid) return;
    setSaving(true);
    try {
      await api.patch(`/api/v1/transactions/${draft.id}`, {
        amount: amountValue,
        description: draft.description,
        date: draft.date,
        type: draft.type,
        categoryId: draft.categoryId,
        accountId: draft.accountId,
        toAccountId: draft.toAccountId,
        creditCardId: draft.creditCardId,
      });
      setMode('view');
      onSaved();
    } catch (err) {
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Erro ao salvar transação');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      'Excluir transação',
      `Excluir "${draft?.description}"? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            if (!draft) return;
            setDeleting(true);
            try {
              await api.delete(`/api/v1/transactions/${draft.id}`);
              onDeleted();
            } catch (err) {
              Alert.alert(
                'Erro',
                err instanceof ApiError ? err.message : 'Erro ao excluir transação'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  const account = accounts.find(a => a.id === draft.accountId);
  const toAccount = accounts.find(a => a.id === draft.toAccountId);
  const creditCard = creditCards.find(c => c.id === draft.creditCardId);

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['75%']}
      enablePanDownToClose
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        testID="transaction-detail-sheet"
      >
        {mode === 'view' ? (
          <>
            <View style={styles.viewHeader}>
              <IconBadge
                color={draft.category?.color ?? colors.mutedForeground2}
                letter={draft.category?.name ?? draft.description}
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
              <Text style={styles.detailLabel}>Data</Text>
              <Text style={styles.detailValue}>
                {new Date(`${draft.date.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tipo</Text>
              <Text style={styles.detailValue}>
                {TYPE_OPTIONS.find(t => t.value === draft.type)?.label ?? draft.type}
              </Text>
            </View>
            {account && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {draft.type === 'TRANSFER' ? 'De' : 'Conta'}
                </Text>
                <Text style={styles.detailValue}>{account.name}</Text>
              </View>
            )}
            {toAccount && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Para</Text>
                <Text style={styles.detailValue}>{toAccount.name}</Text>
              </View>
            )}
            {creditCard && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {draft.type === 'TRANSFER' ? 'Para' : 'Cartão'}
                </Text>
                <Text style={styles.detailValue}>
                  💳 {creditCard.name}
                  {draft.installmentTotal
                    ? ` (${draft.installmentCurrent}/${draft.installmentTotal})`
                    : ''}
                </Text>
              </View>
            )}
            {draft.notes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notas</Text>
                <Text style={styles.detailValue}>{draft.notes}</Text>
              </View>
            )}

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.editButton}
                onPress={() => setMode('edit')}
                testID="transaction-edit-button"
              >
                <Feather name="edit-2" size={15} color={colors.foreground} />
                <Text style={styles.editButtonLabel}>Editar</Text>
              </Pressable>
              <Pressable
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={deleting}
                testID="transaction-delete-button"
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <>
                    <Feather name="trash-2" size={15} color={colors.danger} />
                    <Text style={styles.deleteButtonLabel}>Excluir</Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <>
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
                      categoryId: '',
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
              value={draft.amount}
              onChangeValue={t => update({ amount: t })}
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
                    selected={draft.categoryId === c.id}
                    onPress={() => update({ categoryId: c.id, category: c })}
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
              (accounts.length > 0 ||
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
                            })
                          }
                        />
                      ))}
                  </View>
                </>
              )
            )}

            <Text style={styles.label}>Data</Text>
            <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateButtonLabel}>
                {new Date(`${draft.date.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR')}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(`${draft.date.slice(0, 10)}T00:00:00`)}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_, selected) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selected) update({ date: selected.toISOString() });
                }}
              />
            )}

            <View style={styles.actionsRow}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setDraft(transaction);
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
                testID="transaction-save-button"
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
    </BottomSheetModal>
  );
});

TransactionDetailSheet.displayName = 'TransactionDetailSheet';

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
