import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fontFamily, fontSize } from '../theme';
import { Card } from '../components/Card';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useApiData } from '../hooks/useApiData';
import { api } from '../lib/api';
import { formatCurrency, formatRelativeDate } from '../lib/format';
import { NetWorth, Transaction, UpcomingItem } from '../types';

const typeColor: Record<string, string> = {
  INCOME: colors.income,
  EXPENSE: colors.expense,
  SAVING: colors.saving,
  TRANSFER: colors.transfer,
};

export function HomeScreen() {
  const netWorth = useApiData(() => api.get<NetWorth>('/api/v1/calculations/net-worth'));
  const upcoming = useApiData(() => api.get<UpcomingItem[]>('/api/v1/dashboard/upcoming?days=7'));
  const recent = useApiData(() =>
    api.get<Transaction[]>('/api/v1/transactions?limit=6&sortBy=date&sortOrder=desc')
  );

  const loading = netWorth.loading || upcoming.loading || recent.loading;
  const error = netWorth.error ?? upcoming.error ?? recent.error;

  if (loading) return <LoadingState />;
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          netWorth.refetch();
          upcoming.refetch();
          recent.refetch();
        }}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="home-screen"
    >
      <Text style={styles.greeting}>Início</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Patrimônio líquido</Text>
        <Text style={styles.balanceValue}>
          {formatCurrency(netWorth.data?.netWorth ?? 0)}
        </Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Contas</Text>
            <Text style={styles.balanceItemValue}>
              {formatCurrency(netWorth.data?.accountsTotal ?? 0)}
            </Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Investimentos</Text>
            <Text style={styles.balanceItemValue}>
              {formatCurrency(netWorth.data?.investmentsTotal ?? 0)}
            </Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>Dívidas</Text>
            <Text style={styles.balanceItemValue}>
              {formatCurrency(netWorth.data?.debtsTotal ?? 0)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>A vencer</Text>
      {!upcoming.data || upcoming.data.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Feather name="check-circle" size={20} color={colors.accent} />
          <Text style={styles.emptyText}>Nada nos próximos 7 dias</Text>
        </Card>
      ) : (
        upcoming.data.map(item => (
          <Card
            key={item.id}
            style={[styles.rowCard, item.isToday && styles.rowCardToday]}
            testID="upcoming-item"
          >
            <Text style={styles.rowIcon}>{item.categoryIcon ?? '📊'}</Text>
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{item.description}</Text>
              <Text style={styles.rowSubtitle}>
                {item.isToday ? 'Hoje' : formatRelativeDate(item.date)}
                {item.isRecurring ? ' · Recorrente' : ''}
              </Text>
            </View>
            <Text style={[styles.rowAmount, { color: typeColor[item.type] }]}>
              {formatCurrency(item.amount)}
            </Text>
          </Card>
        ))
      )}

      <Text style={styles.sectionTitle}>Transações recentes</Text>
      {!recent.data || recent.data.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhuma transação ainda</Text>
        </Card>
      ) : (
        recent.data.map(t => (
          <Card key={t.id} style={styles.rowCard} testID="recent-transaction-item">
            <Text style={styles.rowIcon}>{t.category?.icon ?? '📊'}</Text>
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{t.description}</Text>
              <Text style={styles.rowSubtitle}>{t.category?.name ?? '—'}</Text>
            </View>
            <Text style={[styles.rowAmount, { color: typeColor[t.type] }]}>
              {formatCurrency(t.amount)}
            </Text>
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
    paddingBottom: 100,
    gap: 12,
  },
  greeting: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize['2xl'],
    color: colors.foreground,
    marginBottom: 4,
  },
  balanceCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  balanceLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.cardForeground,
    opacity: 0.7,
  },
  balanceValue: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize['3xl'],
    color: colors.cardForeground,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    gap: 2,
  },
  balanceItemLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.cardForeground,
    opacity: 0.6,
  },
  balanceItemValue: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.cardForeground,
  },
  sectionTitle: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.lg,
    color: colors.foreground,
    marginTop: 8,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontFamily: fontFamily.body,
    color: colors.mutedForeground,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowCardToday: {
    borderColor: colors.warning,
    borderWidth: 1.5,
  },
  rowIcon: {
    fontSize: 22,
  },
  rowMain: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  rowSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  rowAmount: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
  },
});
