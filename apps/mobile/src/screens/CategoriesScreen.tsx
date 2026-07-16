import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize, radius } from '../theme';
import { Card } from '../components/Card';
import { IconBadge } from '../components/IconBadge';
import { ProgressBar } from '../components/ProgressBar';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useApiData } from '../hooks/useApiData';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { CategoryBudgetSummary } from '../types';
import { AccountsStackParamList } from '../navigation/AccountsStack';

type Props = NativeStackScreenProps<AccountsStackParamList, 'Categories'>;

export function CategoriesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const budgets = useApiData(() =>
    api.get<CategoryBudgetSummary[]>('/api/v1/categories/budgets')
  );

  if (budgets.loading) return <LoadingState />;
  if (budgets.error) {
    return <ErrorState message={budgets.error} onRetry={budgets.refetch} />;
  }

  return (
    <View style={styles.container} testID="categories-screen">
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton} hitSlop={8}>
          <Feather name="chevron-left" size={18} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Categorias</Text>
          <Text style={styles.subtitle}>Orçamento mensal por categoria</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 20 }]}
      >
        {!budgets.data || budgets.data.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Nenhum orçamento definido ainda</Text>
          </Card>
        ) : (
          budgets.data.map(b => (
            <Card key={b.categoryId} style={styles.budgetCard} testID="budget-item">
              <View style={styles.budgetHeader}>
                <IconBadge size={38} color={b.categoryColor} letter={b.categoryName} />
                <View style={styles.budgetMain}>
                  <Text style={styles.budgetLabel}>{b.categoryName}</Text>
                  <Text style={styles.budgetSpent}>
                    {formatCurrency(b.spent)} de {formatCurrency(b.budget)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.budgetPct,
                    { color: b.isOverBudget ? colors.danger : colors.foreground },
                  ]}
                >
                  {b.pct.toFixed(0)}%
                </Text>
              </View>
              <ProgressBar pct={b.pct} color={b.categoryColor} />
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.lg,
    color: colors.foreground,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 11,
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
    alignItems: 'center',
    gap: 12,
  },
  budgetMain: {
    flex: 1,
    minWidth: 0,
  },
  budgetLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  budgetSpent: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.mutedForeground,
  },
  budgetPct: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize.sm,
  },
});
