import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, radius, shadow } from '../theme';
import { formatCurrency } from '../lib/format';
import { isInferredComplete } from '../lib/inferredTransaction';
import { InferredTransaction, FinancialAccount } from '../types';

const typeColor: Record<string, string> = {
  INCOME: colors.income,
  EXPENSE: colors.expense,
  SAVING: colors.saving,
  TRANSFER: colors.transfer,
};

const typeLabel: Record<string, string> = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  SAVING: 'Poupança',
  TRANSFER: 'Transferência',
};

interface TransactionPreviewCardProps {
  inferred: InferredTransaction;
  confidence: number;
  accounts: FinancialAccount[];
  status: 'pending' | 'saving' | 'confirmed' | 'error';
  errorMessage?: string;
  onConfirm: () => void;
  onEdit: () => void;
}

export function TransactionPreviewCard({
  inferred,
  confidence,
  accounts,
  status,
  errorMessage,
  onConfirm,
  onEdit,
}: TransactionPreviewCardProps) {
  const account = accounts.find(a => a.id === inferred.accountId);
  const confidenceColor =
    confidence >= 0.8 ? colors.income : confidence >= 0.5 ? colors.warning : colors.danger;
  const complete = isInferredComplete(inferred);

  return (
    <View style={styles.card} testID="transaction-preview-card">
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: typeColor[inferred.type] }]}>
          <Text style={styles.typeBadgeLabel}>{typeLabel[inferred.type]}</Text>
        </View>
        <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
      </View>

      <Text style={styles.amount}>
        {inferred.amount != null ? formatCurrency(inferred.amount) : '—'}
      </Text>
      <Text style={styles.description}>{inferred.description}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaItem}>
          {inferred.category ? `${inferred.category.name}` : 'Sem categoria'}
        </Text>
        {account && (
          <Text style={styles.metaItem}>
            · {account.type === 'CREDIT_CARD' ? `💳 ${account.name}` : account.name}
            {inferred.installments > 1 ? ` ${inferred.installments}x` : ''}
          </Text>
        )}
        <Text style={styles.metaItem}>
          · {new Date(inferred.date).toLocaleDateString('pt-BR')}
        </Text>
        {inferred.isRecurring && (
          <View style={styles.recurringTag}>
            <Feather name="repeat" size={11} color={colors.accent} />
            <Text style={styles.recurringTagLabel}>{inferred.frequency}</Text>
          </View>
        )}
      </View>

      {status === 'error' && (
        <Text style={styles.errorText}>{errorMessage ?? 'Erro ao salvar'}</Text>
      )}
      {!complete && status !== 'confirmed' && (
        <Text style={styles.incompleteHint}>Complete os dados para confirmar</Text>
      )}

      {status === 'confirmed' ? (
        <View style={styles.confirmedRow}>
          <Feather name="check-circle" size={16} color={colors.income} />
          <Text style={styles.confirmedLabel}>Salvo</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            onPress={onEdit}
            style={styles.editButton}
            disabled={status === 'saving'}
            testID="edit-button"
          >
            <Text style={styles.editButtonLabel}>Editar</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            style={[styles.confirmButton, !complete && styles.confirmButtonDisabled]}
            disabled={status === 'saving' || !complete}
            testID="confirm-button"
          >
            {status === 'saving' ? (
              <ActivityIndicator color={colors.accentForeground} size="small" />
            ) : (
              <Text style={styles.confirmButtonLabel}>Confirmar</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    minWidth: 240,
    maxWidth: '85%',
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeBadgeLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.xs,
    color: '#fff',
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  amount: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize.xl,
    color: colors.foreground,
  },
  description: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  metaItem: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  recurringTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 4,
  },
  recurringTagLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.xs,
    color: colors.accent,
  },
  errorText: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.danger,
  },
  incompleteHint: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  editButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  editButtonLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.accentForeground,
  },
  confirmedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  confirmedLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.income,
  },
});
