import { useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontFamily, fontSize, radius, shadow } from '../theme';
import { Card } from '../components/Card';
import { IconBadge } from '../components/IconBadge';
import { ScreenHeader } from '../components/ScreenHeader';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import {
  AccountFormSheet,
  AccountFormSheetRef,
} from '../components/AccountFormSheet';
import {
  InvestmentFormSheet,
  InvestmentFormSheetRef,
} from '../components/InvestmentFormSheet';
import { DebtFormSheet, DebtFormSheetRef } from '../components/DebtFormSheet';
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

  const [selectedAccount, setSelectedAccount] = useState<FinancialAccount | null>(null);
  const accountSheetRef = useRef<AccountFormSheetRef>(null);
  function openAccount(a: FinancialAccount | null) {
    setSelectedAccount(a);
    accountSheetRef.current?.expand();
  }

  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const investmentSheetRef = useRef<InvestmentFormSheetRef>(null);
  function openInvestment(i: Investment | null) {
    setSelectedInvestment(i);
    investmentSheetRef.current?.expand();
  }

  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const debtSheetRef = useRef<DebtFormSheetRef>(null);
  function openDebt(d: Debt | null) {
    setSelectedDebt(d);
    debtSheetRef.current?.expand();
  }

  const loading =
    netWorth.loading || accounts.loading || investments.loading || debts.loading;
  const refreshing =
    netWorth.refreshing || accounts.refreshing || investments.refreshing || debts.refreshing;
  const error = netWorth.error ?? accounts.error ?? investments.error ?? debts.error;

  function refetchAll() {
    netWorth.refetch();
    accounts.refetch();
    investments.refetch();
    debts.refetch();
  }

  if (loading) return <LoadingState />;
  if (error) {
    return <ErrorState message={error} onRetry={refetchAll} />;
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refetchAll} tintColor={colors.accent} />
        }
        testID="accounts-screen"
      >
        <ScreenHeader eyebrow="Seu patrimônio" title="Contas" />

        <View style={styles.netWorthCard}>
          <Text style={styles.netWorthLabel}>Patrimônio líquido</Text>
          <Text style={styles.netWorthValue}>
            {formatCurrency(netWorth.data?.netWorth ?? 0)}
          </Text>
          <Text style={styles.netWorthHint}>Contas + investimentos − dívidas</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Contas e carteira</Text>
          <View style={styles.sectionHeaderRight}>
            <Text style={styles.sectionTotal}>
              {formatCurrency(netWorth.data?.accountsTotal ?? 0)}
            </Text>
            <Pressable
              onPress={() => openAccount(null)}
              style={styles.addButton}
              hitSlop={8}
              testID="add-account-button"
            >
              <Feather name="plus" size={16} color={colors.accent} />
            </Pressable>
          </View>
        </View>
        {!accounts.data || accounts.data.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Nenhuma conta cadastrada</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {accounts.data.map((a, i) => (
              <Pressable
                key={a.id}
                style={[styles.itemRow, i > 0 && styles.itemRowBorder]}
                onPress={() => openAccount(a)}
                testID="account-item"
              >
                <IconBadge size={38} color={a.color} letter={a.name} />
                <Text style={styles.itemLabel}>{a.name}</Text>
                <Text style={styles.itemValue}>{formatCurrency(a.balance)}</Text>
              </Pressable>
            ))}
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Investimentos</Text>
          <View style={styles.sectionHeaderRight}>
            <Text style={[styles.sectionTotal, { color: colors.income }]}>
              {formatCurrency(netWorth.data?.investmentsTotal ?? 0)}
            </Text>
            <Pressable
              onPress={() => openInvestment(null)}
              style={styles.addButton}
              hitSlop={8}
              testID="add-investment-button"
            >
              <Feather name="plus" size={16} color={colors.accent} />
            </Pressable>
          </View>
        </View>
        {!investments.data || investments.data.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Nenhum investimento cadastrado</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {investments.data.map((i, idx) => (
              <Pressable
                key={i.id}
                style={[styles.itemRow, idx > 0 && styles.itemRowBorder]}
                onPress={() => openInvestment(i)}
                testID="investment-item"
              >
                <IconBadge size={38} color={colors.saving} letter={i.name} />
                <Text style={styles.itemLabel}>{i.name}</Text>
                <Text style={[styles.itemValue, { color: colors.income }]}>
                  {formatCurrency(i.balance)}
                </Text>
              </Pressable>
            ))}
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dívidas e cartões</Text>
          <View style={styles.sectionHeaderRight}>
            <Text style={[styles.sectionTotal, { color: colors.expense }]}>
              {formatCurrency(netWorth.data?.debtsTotal ?? 0)}
            </Text>
            <Pressable
              onPress={() => openDebt(null)}
              style={styles.addButton}
              hitSlop={8}
              testID="add-debt-button"
            >
              <Feather name="plus" size={16} color={colors.accent} />
            </Pressable>
          </View>
        </View>
        {!debts.data || debts.data.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Nenhuma dívida cadastrada</Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {debts.data.map((d, i) => (
              <Pressable
                key={d.id}
                style={[styles.itemRow, i > 0 && styles.itemRowBorder]}
                onPress={() => openDebt(d)}
                testID="debt-item"
              >
                <IconBadge size={38} color={colors.expense} letter={d.name} />
                <Text style={styles.itemLabel}>
                  {d.name}
                  {d.installmentTotal
                    ? ` (${d.installmentCurrent ?? 0}/${d.installmentTotal})`
                    : ''}
                </Text>
                <Text style={[styles.itemValue, { color: colors.expense }]}>
                  {formatCurrency(d.balance)}
                </Text>
              </Pressable>
            ))}
          </Card>
        )}

        <Pressable
          onPress={() => navigation.navigate('Categories')}
          style={styles.categoriesLink}
          testID="link-categories"
        >
          <IconBadge size={38} color={colors.surfaceMuted} icon={<Feather name="grid" size={17} color={colors.foreground} />} />
          <View style={styles.categoriesLinkText}>
            <Text style={styles.categoriesLinkTitle}>Gerenciar categorias</Text>
            <Text style={styles.categoriesLinkSubtitle}>Orçamentos e categorização</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground2} />
        </Pressable>
      </ScrollView>

      <AccountFormSheet
        ref={accountSheetRef}
        account={selectedAccount}
        onSaved={() => {
          accounts.refetch();
          netWorth.refetch();
        }}
        onDeleted={() => {
          accounts.refetch();
          netWorth.refetch();
        }}
        onClose={() => accountSheetRef.current?.close()}
      />
      <InvestmentFormSheet
        ref={investmentSheetRef}
        investment={selectedInvestment}
        onSaved={() => {
          investments.refetch();
          netWorth.refetch();
        }}
        onDeleted={() => {
          investments.refetch();
          netWorth.refetch();
        }}
        onClose={() => investmentSheetRef.current?.close()}
      />
      <DebtFormSheet
        ref={debtSheetRef}
        debt={selectedDebt}
        onSaved={() => {
          debts.refetch();
          netWorth.refetch();
        }}
        onDeleted={() => {
          debts.refetch();
          netWorth.refetch();
        }}
        onClose={() => debtSheetRef.current?.close()}
      />
    </>
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
  },
  netWorthCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 18,
    ...shadow.dark,
  },
  netWorthLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  netWorthValue: {
    fontFamily: fontFamily.displayBold,
    fontSize: 32,
    color: colors.cardForeground,
    letterSpacing: -0.8,
    marginTop: 5,
  },
  netWorthHint: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  sectionTotal: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize.sm,
    color: colors.accent,
  },
  emptyText: {
    fontFamily: fontFamily.body,
    color: colors.mutedForeground,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 14,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  itemLabel: {
    flex: 1,
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  itemValue: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  categoriesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 15,
    marginBottom: 12,
  },
  categoriesLinkText: {
    flex: 1,
  },
  categoriesLinkTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  categoriesLinkSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.mutedForeground,
  },
});
