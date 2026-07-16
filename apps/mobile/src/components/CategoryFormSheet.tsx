import { ElementRef, forwardRef, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { Feather } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, radius } from '../theme';
import { api, ApiError } from '../lib/api';
import { CategoryBudgetSummary } from '../types';

export type CategoryFormSheetRef = ElementRef<typeof BottomSheet>;

interface Draft {
  name: string;
  icon: string;
  budget: string;
}

const EMPTY_DRAFT: Draft = { name: '', icon: '📊', budget: '' };

interface CategoryFormSheetProps {
  /** null = create mode; an existing category budget summary = edit mode. */
  categoryBudget: CategoryBudgetSummary | null;
  onSaved: () => void;
  onDeleted: () => void;
  onClose: () => void;
}

export const CategoryFormSheet = forwardRef<CategoryFormSheetRef, CategoryFormSheetProps>(
  ({ categoryBudget, onSaved, onDeleted, onClose }, ref) => {
    const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
      setDraft(
        categoryBudget
          ? {
              name: categoryBudget.categoryName,
              icon: categoryBudget.categoryIcon,
              budget: String(categoryBudget.budget),
            }
          : EMPTY_DRAFT
      );
    }, [categoryBudget]);

    function update(patch: Partial<Draft>) {
      setDraft(prev => ({ ...prev, ...patch }));
    }

    const budgetValue = Number(draft.budget.replace(',', '.'));
    const isValid =
      draft.name.trim().length > 0 && !Number.isNaN(budgetValue) && budgetValue > 0;

    async function handleSave() {
      if (!isValid) return;
      setSaving(true);
      try {
        if (categoryBudget) {
          await api.patch(`/api/v1/categories/${categoryBudget.categoryId}`, {
            name: draft.name,
            icon: draft.icon,
          });
          await api.patch(`/api/v1/categories/${categoryBudget.categoryId}/budget`, {
            monthlyAmount: budgetValue,
          });
        } else {
          const created = await api.post<{ id: string }>('/api/v1/categories', {
            name: draft.name,
            type: 'EXPENSE',
            icon: draft.icon,
          });
          await api.patch(`/api/v1/categories/${created.id}/budget`, {
            monthlyAmount: budgetValue,
          });
        }
        onSaved();
        onClose();
      } catch (err) {
        Alert.alert('Erro', err instanceof ApiError ? err.message : 'Erro ao salvar categoria');
      } finally {
        setSaving(false);
      }
    }

    function handleDelete() {
      if (!categoryBudget) return;
      Alert.alert(
        'Excluir categoria',
        `Excluir "${categoryBudget.categoryName}"? Categorias com transações vinculadas não podem ser excluídas.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              setDeleting(true);
              try {
                await api.delete(`/api/v1/categories/${categoryBudget.categoryId}`);
                onDeleted();
                onClose();
              } catch (err) {
                Alert.alert(
                  'Erro',
                  err instanceof ApiError ? err.message : 'Erro ao excluir categoria'
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
        <BottomSheetScrollView contentContainerStyle={styles.content} testID="category-form-sheet">
          <Text style={styles.title}>
            {categoryBudget ? 'Editar categoria' : 'Nova categoria'}
          </Text>

          <Text style={styles.label}>Nome</Text>
          <BottomSheetTextInput
            style={styles.input}
            value={draft.name}
            onChangeText={t => update({ name: t })}
            placeholder="Ex: Assinaturas"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={styles.label}>Ícone (emoji)</Text>
          <BottomSheetTextInput
            style={styles.input}
            value={draft.icon}
            onChangeText={t => update({ icon: t })}
            maxLength={4}
          />

          <Text style={styles.label}>Orçamento mensal</Text>
          <BottomSheetTextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={draft.budget}
            onChangeText={t => update({ budget: t })}
            placeholder="0,00"
            placeholderTextColor={colors.mutedForeground}
          />
          <Text style={styles.hint}>
            Categorias sem orçamento definido não aparecem nesta tela.
          </Text>

          <View style={styles.actionsRow}>
            {categoryBudget && (
              <Pressable
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={deleting}
                testID="category-delete-button"
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
              testID="category-save-button"
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

CategoryFormSheet.displayName = 'CategoryFormSheet';

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
  hint: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: 4,
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
