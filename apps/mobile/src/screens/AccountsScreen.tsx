import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize } from '../theme';
import { Card } from '../components/Card';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useApiData } from '../hooks/useApiData';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { Debt, FinancialAccount, Investment, NetWorth } from '../types';
import { AccountsStackParamList } from '../navigation/AccountsStack';

type Props = NativeStackScreenProps<AccountsStackParamList, 'AccountsHome'>;

export function AccountsScreen({ navigation }: Props) {
  const netWorth = useApiData(() => api.get<NetWorth>('/api/v1/calculations/net-worth'));
  const accounts = useApiData(() => api.get<FinancialAccount[]>('/api/v1/accounts'));
  const investments = useApiData(() => api.get<Investment[]>('/api/v1/investments'));
  const debts = useApiData(() => api.get<Debt[]>('/api/v1/debts'));

  const loading =
    netWorth.loading || accounts.loading || investments.loading || debts.loading;
  const error = netWorth.error ?? accounts.error ?? investments.error ?? debts.error;

  if (loading) return <LoadingState />;
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          netWorth.refetch();
          accounts.refetch();
          investments.refetch();
          debts.refetch();
        }}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="accounts-screen"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Contas</Text>
        <Pressable
          onPress={() => navigation.navigate('Categories')}
          style={styles.categoriesLink}
          testID="link-categories"
        >
          <Feather name="grid" size={16} color={colors.accent} />
          <Text style={styles.categoriesLinkLabel}>Categorias</Text>
        </Pressable>
      </View>

      <View style={styles.netWorthCard}>
        <Text style={styles.netWorthLabel}>Patrimônio líquido</Text>
        <Text style={styles.netWorthValue}>
          {formatCurrency(netWorth.data?.netWorth ?? 0)}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Contas e carteira</Text>
      {!accounts.data || accounts.data.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Nenhuma conta cadastrada</Text>
        </Card>
      ) : (
        accounts.data.map(a => (
          <Card key={a.id} style={styles.itemRow} testID="account-item">
            <View style={[styles.colorDot, { backgroundColor: a.color }]} />
            <Text style={styles.itemLabel}>{a.name}</Text>
            <Text style={styles.itemValue}>{formatCurrency(a.balance)}</Text>
          </Card>
        ))
      )}

      <Text style={styles.sectionTitle}>Investimentos</Text>
      {!investments.data || investments.data.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Nenhum investimento cadastrado</Text>
        </Card>
      ) : (
        investments.data.map(i => (
          <Card key={i.id} style={styles.itemRow} testID="investment-item">
            <Text style={styles.itemLabel}>{i.name}</Text>
            <Text style={[styles.itemValue, { color: colors.income }]}>
              {formatCurrency(i.balance)}
            </Text>
          </Card>
        ))
      )}

      <Text style={styles.sectionTitle}>Dívidas e cartões</Text>
      {!debts.data || debts.data.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Nenhuma dívida cadastrada</Text>
        </Card>
      ) : (
        debts.data.map(d => (
          <Card key={d.id} style={styles.itemRow} testID="debt-item">
            <Text style={styles.itemLabel}>
              {d.name}
              {d.installmentTotal
                ? ` (${d.installmentCurrent ?? 0}/${d.installmentTotal})`
                : ''}
            </Text>
            <Text style={[styles.itemValue, { color: colors.expense }]}>
              {formatCurrency(d.balance)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize['2xl'],
    color: colors.foreground,
  },
  categoriesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoriesLinkLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.accent,
  },
  netWorthCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    gap: 6,
  },
  netWorthLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.cardForeground,
    opacity: 0.7,
  },
  netWorthValue: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize['3xl'],
    color: colors.cardForeground,
  },
  sectionTitle: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.lg,
    color: colors.foreground,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: fontFamily.body,
    color: colors.mutedForeground,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  itemLabel: {
    flex: 1,
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  itemValue: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
});
