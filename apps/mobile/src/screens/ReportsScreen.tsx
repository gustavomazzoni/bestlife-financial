import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFloatingTabBarHeight } from '../navigation/tabBarMetrics';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { colors, fontFamily, fontSize } from '../theme';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { DonutChart } from '../components/DonutChart';
import { IconBadge } from '../components/IconBadge';
import { ProgressBar } from '../components/ProgressBar';
import { ScreenHeader } from '../components/ScreenHeader';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useApiData } from '../hooks/useApiData';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { CategoryBudgetSummary, SpendingBreakdown } from '../types';

interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
}

const CATEGORY_PALETTE = [
  colors.accent,
  colors.expense,
  colors.saving,
  colors.warning,
  '#8B5CF6',
  '#EC4899',
  '#0EA5E9',
];

export function ReportsScreen() {
  const tabBarHeight = useFloatingTabBarHeight();
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  const summary = useApiData(() =>
    api.get<MonthlySummary[]>('/api/v1/transactions/summary?period=month&months=6')
  );
  const breakdown = useApiData(() =>
    api.get<SpendingBreakdown>(
      `/api/v1/calculations/spending-breakdown?month=${selectedMonth}`
    )
  );
  const budgets = useApiData(() =>
    api.get<CategoryBudgetSummary[]>(
      `/api/v1/categories/budgets?month=${selectedMonth}`
    )
  );

  const months = summary.data?.map(m => m.month) ?? [];
  const currentMonthSummary = summary.data?.find(m => m.month === selectedMonth);

  const donutSegments = useMemo(
    () =>
      (breakdown.data?.byCategory ?? []).slice(0, 7).map((c, i) => ({
        value: c.amount,
        color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
      })),
    [breakdown.data]
  );

  const loading = summary.loading || breakdown.loading || budgets.loading;
  const error = summary.error ?? breakdown.error ?? budgets.error;

  if (loading) return <LoadingState />;
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          summary.refetch();
          breakdown.refetch();
          budgets.refetch();
        }}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 20 }]}
      testID="reports-screen"
    >
      <ScreenHeader eyebrow="Para onde vai o dinheiro" title="Relatório" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthPicker}>
        <View style={styles.monthPickerRow}>
          {months.map(m => (
            <Chip
              key={m}
              label={format(new Date(`${m}-01T00:00:00`), 'MMM/yy', { locale: ptBR })}
              selected={m === selectedMonth}
              onPress={() => setSelectedMonth(m)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Entradas</Text>
          <Text style={[styles.summaryValue, { color: colors.income }]}>
            {formatCurrency(currentMonthSummary?.income ?? 0)}
          </Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Saídas</Text>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>
            {formatCurrency(currentMonthSummary?.expenses ?? 0)}
          </Text>
        </Card>
      </View>

      {donutSegments.length > 0 && (
        <Card style={styles.donutCard}>
          <DonutChart segments={donutSegments} />
          <View style={styles.legend}>
            {(breakdown.data?.byCategory ?? []).slice(0, 7).map((c, i) => (
              <View key={c.categoryId} style={styles.legendRow}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] },
                  ]}
                />
                <Text style={styles.legendLabel} numberOfLines={1}>
                  {c.categoryName}
                </Text>
                <Text style={styles.legendValue}>{c.percentage.toFixed(0)}%</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <Text style={styles.sectionTitle}>Orçamento por categoria</Text>
      {!budgets.data || budgets.data.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Nenhum orçamento definido</Text>
        </Card>
      ) : (
        budgets.data.map(b => (
          <Card key={b.categoryId} style={styles.budgetCard} testID="budget-item">
            <View style={styles.budgetHeader}>
              <View style={styles.budgetHeaderLeft}>
                <IconBadge size={30} color={b.categoryColor} letter={b.categoryName} />
                <Text style={styles.budgetLabel}>{b.categoryName}</Text>
              </View>
              <Text
                style={[
                  styles.budgetAmount,
                  b.isOverBudget && { color: colors.danger },
                ]}
              >
                {formatCurrency(b.spent)} / {formatCurrency(b.budget)}
              </Text>
            </View>
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
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
  },
  monthPicker: {
    marginVertical: 4,
  },
  monthPickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
  },
  summaryLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12,
    color: colors.mutedForeground,
  },
  summaryValue: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize.lg,
    marginTop: 3,
  },
  donutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legend: {
    flex: 1,
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.foreground,
  },
  legendValue: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  sectionTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.base,
    color: colors.foreground,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: fontFamily.body,
    color: colors.mutedForeground,
  },
  budgetCard: {
    gap: 11,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  budgetLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
    flexShrink: 1,
  },
  budgetAmount: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.mutedForeground,
  },
});
