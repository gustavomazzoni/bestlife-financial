import { ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fontFamily, fontSize } from '../theme';
import { Card } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useApiData } from '../hooks/useApiData';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { CategoryBudgetSummary } from '../types';

export function CategoriesScreen() {
  const budgets = useApiData(() =>
    api.get<CategoryBudgetSummary[]>('/api/v1/categories/budgets')
  );

  if (budgets.loading) return <LoadingState />;
  if (budgets.error) {
    return <ErrorState message={budgets.error} onRetry={budgets.refetch} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="categories-screen"
    >
      <Text style={styles.title}>Categorias</Text>

      {!budgets.data || budgets.data.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Nenhum orçamento definido ainda</Text>
        </Card>
      ) : (
        budgets.data.map(b => (
          <Card key={b.categoryId} style={styles.budgetCard} testID="budget-item">
            <Text style={styles.budgetLabel}>
              {b.categoryIcon} {b.categoryName}
            </Text>
            <Text
              style={[
                styles.budgetAmount,
                b.isOverBudget && { color: colors.danger },
              ]}
            >
              {formatCurrency(b.spent)} de {formatCurrency(b.budget)} (
              {b.pct.toFixed(0)}%)
            </Text>
            <ProgressBar pct={b.pct} color={b.categoryColor} />
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  title: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize['2xl'],
    color: colors.foreground,
  },
  emptyText: {
    fontFamily: fontFamily.body,
    color: colors.mutedForeground,
  },
  budgetCard: {
    gap: 8,
  },
  budgetLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  budgetAmount: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
});
