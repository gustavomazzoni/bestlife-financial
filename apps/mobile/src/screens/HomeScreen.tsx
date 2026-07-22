import { useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransactionType } from '@lifeos/shared';
import { colors, fontFamily, fontSize, radius, shadow } from '../theme';
import { Card } from '../components/Card';
import { IconBadge } from '../components/IconBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import {
  TransactionDetailSheet,
  TransactionDetailSheetRef,
} from '../components/TransactionDetailSheet';
import {
  ExecuteScheduledSheet,
  ExecuteScheduledSheetRef,
} from '../components/ExecuteScheduledSheet';
import { useApiData } from '../hooks/useApiData';
import { api } from '../lib/api';
import { formatCurrency, formatRelativeDate } from '../lib/format';
import { FinancialAccount, NetWorth, Transaction, UpcomingItem } from '../types';

interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
}

const typeColor: Record<string, string> = {
  INCOME: colors.income,
  EXPENSE: colors.expense,
  SAVING: colors.saving,
  TRANSFER: colors.transfer,
};

export function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const netWorth = useApiData(() => api.get<NetWorth>('/api/v1/calculations/net-worth'));
  const accounts = useApiData(() => api.get<FinancialAccount[]>('/api/v1/accounts'));
  const summary = useApiData(() =>
    api.get<MonthlySummary[]>('/api/v1/transactions/summary?period=month&months=1')
  );
  const upcoming = useApiData(() => api.get<UpcomingItem[]>('/api/v1/dashboard/upcoming?days=7'));
  const recent = useApiData(() =>
    api.get<Transaction[]>('/api/v1/transactions?limit=6&sortBy=date&sortOrder=desc')
  );
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const detailSheetRef = useRef<TransactionDetailSheetRef>(null);

  function openTransaction(t: Transaction) {
    setSelectedTransaction(t);
    detailSheetRef.current?.present();
  }

  const [executingItem, setExecutingItem] = useState<{
    scheduledId: string;
    description: string;
    amount: string;
    type: TransactionType;
    accountId: string | null;
  } | null>(null);
  const executeSheetRef = useRef<ExecuteScheduledSheetRef>(null);

  function openExecute(item: UpcomingItem) {
    setExecutingItem({
      scheduledId: item.scheduledId,
      description: item.description,
      amount: item.amount,
      type: item.type,
      accountId: item.accountId,
    });
    executeSheetRef.current?.present();
  }

  const loading =
    netWorth.loading || accounts.loading || summary.loading || upcoming.loading || recent.loading;
  const refreshing =
    netWorth.refreshing ||
    accounts.refreshing ||
    summary.refreshing ||
    upcoming.refreshing ||
    recent.refreshing;
  const error =
    netWorth.error ?? accounts.error ?? summary.error ?? upcoming.error ?? recent.error;

  function refetchAll() {
    netWorth.refetch();
    accounts.refetch();
    summary.refetch();
    upcoming.refetch();
    recent.refetch();
  }

  if (loading) return <LoadingState />;
  if (error) {
    return <ErrorState message={error} onRetry={refetchAll} />;
  }

  const monthSummary = summary.data?.[summary.data.length - 1];
  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <View style={styles.container} testID="home-screen">
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={styles.todayLabel}>{todayLabel}</Text>
          <Text style={styles.greeting}>Olá!</Text>
        </View>
        <Pressable
          style={styles.profileButton}
          onPress={() => navigation.navigate('Settings' as never)}
          testID="settings-button"
        >
          <Feather name="settings" size={18} color={colors.foreground} />
        </Pressable>
      </View>

    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: 20 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refetchAll} tintColor={colors.accent} />
      }
    >
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Saldo em contas</Text>
          <View style={styles.accountsPill}>
            <Text style={styles.accountsPillLabel}>
              {accounts.data?.length ?? 0} contas
            </Text>
          </View>
        </View>
        <Text style={styles.balanceValue}>
          {formatCurrency(netWorth.data?.accountsTotal ?? 0)}
        </Text>
        <View style={styles.balanceRow}>
          <View style={styles.balancePill}>
            <Text style={styles.balancePillLabel}>Entradas · mês</Text>
            <Text style={[styles.balancePillValue, { color: colors.incomeSoft }]}>
              {formatCurrency(monthSummary?.income ?? 0)}
            </Text>
          </View>
          <View style={styles.balancePill}>
            <Text style={styles.balancePillLabel}>Saídas · mês</Text>
            <Text style={[styles.balancePillValue, { color: colors.expenseSoft }]}>
              {formatCurrency(monthSummary?.expenses ?? 0)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>A vencer</Text>
        <Pressable onPress={() => navigation.navigate('Calendar' as never)}>
          <Text style={styles.sectionLink}>Calendário &rarr;</Text>
        </Pressable>
      </View>
      {!upcoming.data || upcoming.data.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Feather name="check-circle" size={20} color={colors.accent} />
          <Text style={styles.emptyText}>Nada nos próximos 7 dias</Text>
        </Card>
      ) : (
        upcoming.data.map(item => (
          <Card
            key={item.id}
            style={[styles.rowCard, item.isOverdue && styles.rowCardOverdue]}
            testID="upcoming-item"
          >
            <IconBadge
              color={item.isOverdue ? colors.expenseSoft : colors.warningSoft}
              icon={
                <Feather
                  name={item.isOverdue ? 'alert-triangle' : 'clock'}
                  size={17}
                  color={item.isOverdue ? colors.danger : colors.warning}
                />
              }
            />
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{item.description}</Text>
              <Text style={[styles.rowSubtitle, item.isOverdue && styles.rowSubtitleOverdue]}>
                {item.isOverdue
                  ? `Atrasado · ${formatRelativeDate(item.date)}`
                  : item.isToday
                    ? 'Hoje'
                    : formatRelativeDate(item.date)}
                {item.isRecurring ? ' · Recorrente' : ''}
              </Text>
            </View>
            <View style={styles.rowAmountGroup}>
              <Text style={[styles.rowAmount, { color: typeColor[item.type] }]}>
                {formatCurrency(item.amount)}
              </Text>
              {item.isOverdue ? (
                <Text style={styles.rowOverdueTag}>Atrasado</Text>
              ) : (
                item.isToday && <Text style={styles.rowDue}>Hoje</Text>
              )}
            </View>
            <Pressable
              onPress={() => openExecute(item)}
              style={styles.executeButton}
              hitSlop={8}
              testID="upcoming-execute-btn"
            >
              <Feather name="check-circle" size={20} color={colors.accent} />
            </Pressable>
          </Card>
        ))
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transações recentes</Text>
        <Pressable onPress={() => navigation.navigate('Reports' as never)}>
          <Text style={styles.sectionLink}>Relatório &rarr;</Text>
        </Pressable>
      </View>
      {!recent.data || recent.data.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhuma transação ainda</Text>
        </Card>
      ) : (
        <Card style={styles.listCard}>
          {recent.data.map((t, i) => (
            <Pressable
              key={t.id}
              style={[styles.listRow, i > 0 && styles.listRowBorder]}
              onPress={() => openTransaction(t)}
              testID="recent-transaction-item"
            >
              <IconBadge
                color={t.category?.color ?? colors.mutedForeground2}
                letter={t.category?.name ?? t.description}
                size={40}
              />
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {t.description}
                </Text>
                <Text style={styles.rowSubtitle}>
                  {t.category?.name ?? '—'} · {formatRelativeDate(t.date.slice(0, 10))}
                </Text>
              </View>
              <Text style={[styles.rowAmount, { color: typeColor[t.type] }]}>
                {formatCurrency(t.amount)}
              </Text>
            </Pressable>
          ))}
        </Card>
      )}
    </ScrollView>
    <TransactionDetailSheet
      ref={detailSheetRef}
      transaction={selectedTransaction}
      accounts={accounts.data ?? []}
      onSaved={() => {
        recent.refetch();
        summary.refetch();
        netWorth.refetch();
        accounts.refetch();
      }}
      onDeleted={() => {
        detailSheetRef.current?.dismiss();
        recent.refetch();
        summary.refetch();
        netWorth.refetch();
        accounts.refetch();
      }}
    />
    <ExecuteScheduledSheet
      ref={executeSheetRef}
      item={executingItem}
      accounts={accounts.data ?? []}
      onExecuted={() => {
        executeSheetRef.current?.dismiss();
        upcoming.refetch();
        recent.refetch();
        summary.refetch();
        netWorth.refetch();
      }}
    />
    </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  todayLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textTransform: 'capitalize',
  },
  greeting: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize.xl,
    color: colors.foreground,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  balanceCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 22,
    paddingBottom: 20,
    ...shadow.dark,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  accountsPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  accountsPillLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  balanceValue: {
    fontFamily: fontFamily.displayBold,
    fontSize: 38,
    color: colors.cardForeground,
    letterSpacing: -1,
    marginTop: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  balancePill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    padding: 12,
  },
  balancePillLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
  },
  balancePillValue: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize.base,
    marginTop: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  sectionLink: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.accent,
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
    gap: 13,
    marginBottom: 10,
  },
  rowCardOverdue: {
    borderColor: colors.danger,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 15,
  },
  listRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  rowSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  rowSubtitleOverdue: {
    color: colors.danger,
    fontFamily: fontFamily.bodySemiBold,
  },
  rowAmountGroup: {
    alignItems: 'flex-end',
  },
  executeButton: {
    marginLeft: 4,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAmount: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize.sm,
  },
  rowDue: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    color: colors.warning,
    marginTop: 1,
  },
  rowOverdueTag: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    color: colors.danger,
    marginTop: 1,
  },
});
