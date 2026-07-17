import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { startOfDay } from 'date-fns';
import { colors, fontFamily, fontSize, radius, shadow } from '../theme';
import { TransactionPreviewCard } from '../components/TransactionPreviewCard';
import {
  EditTransactionSheet,
  BottomSheetRef,
} from '../components/EditTransactionSheet';
import { api, ApiError } from '../lib/api';
import { FinancialAccount, InferTransactionResult, InferredTransaction } from '../types';
import { TAB_BAR_HEIGHT } from '../navigation/tabBarMetrics';

const SUGGESTIONS: { text: string; icon: keyof typeof Feather.glyphMap; color: string }[] = [
  { text: 'Almocei 35 reais', icon: 'coffee', color: colors.expense },
  { text: 'Uber ontem 28 reais', icon: 'navigation', color: colors.saving },
  { text: 'Salário do mês 8000', icon: 'trending-up', color: colors.income },
  { text: 'Conta de luz 180, vence dia 28 todo mês', icon: 'zap', color: colors.warning },
];

type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | {
      id: string;
      role: 'assistant';
      result: InferTransactionResult;
      status: 'pending' | 'saving' | 'confirmed' | 'error';
      errorMessage?: string;
    }
  | { id: string; role: 'error'; text: string };

function nextId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [accountsError, setAccountsError] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const sheetRef = useRef<BottomSheetRef>(null);

  function loadAccounts() {
    setAccountsError(false);
    api
      .get<FinancialAccount[]>('/api/v1/accounts')
      .then(setAccounts)
      .catch(() => setAccountsError(true));
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  async function sendText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setMessages(prev => [...prev, { id: nextId(), role: 'user', text: trimmed }]);
    setInputText('');
    setSending(true);

    try {
      const result = await api.post<InferTransactionResult>(
        '/api/v1/transactions/infer',
        { text: trimmed }
      );
      setMessages(prev => [
        ...prev,
        { id: nextId(), role: 'assistant', result, status: 'pending' },
      ]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao processar mensagem';
      setMessages(prev => [...prev, { id: nextId(), role: 'error', text: message }]);
    } finally {
      setSending(false);
    }
  }

  function updateMessage(id: string, patch: Partial<Extract<ChatMessage, { role: 'assistant' }>>) {
    setMessages(prev =>
      prev.map(m => (m.id === id && m.role === 'assistant' ? { ...m, ...patch } : m))
    );
  }

  async function confirmTransaction(messageId: string, inferred: InferredTransaction) {
    updateMessage(messageId, { status: 'saving' });

    try {
      const txDate = new Date(inferred.date);
      const isFuture = startOfDay(txDate) > startOfDay(new Date());

      if (isFuture) {
        await api.post('/api/v1/scheduled', {
          amount: inferred.amount,
          description: inferred.description,
          type: inferred.type,
          categoryId: inferred.category?.id ?? '',
          frequency: inferred.isRecurring ? (inferred.frequency ?? 'MONTHLY') : 'ONCE',
          startDate: inferred.date,
          necessityLevel: inferred.necessityLevel ?? undefined,
          valueAlignment: inferred.valueAlignment ?? undefined,
          notes: inferred.notes,
        });
      } else {
        await api.post('/api/v1/transactions', {
          amount: inferred.amount,
          description: inferred.description,
          date: inferred.date,
          type: inferred.type,
          categoryId: inferred.category?.id ?? '',
          necessityLevel: inferred.necessityLevel ?? undefined,
          valueAlignment: inferred.valueAlignment ?? undefined,
          accountId: inferred.accountId ?? undefined,
          notes: inferred.notes,
        });
      }
      updateMessage(messageId, { status: 'confirmed' });
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erro ao salvar';
      updateMessage(messageId, { status: 'error', errorMessage });
    }
  }

  function handleEdit(message: Extract<ChatMessage, { role: 'assistant' }>) {
    setEditingMessageId(message.id);
    sheetRef.current?.expand();
  }

  function handleSheetConfirm(updated: InferredTransaction) {
    if (editingMessageId) {
      setMessages(prev =>
        prev.map(m =>
          m.id === editingMessageId && m.role === 'assistant'
            ? { ...m, result: { ...m.result, inferred: updated } }
            : m
        )
      );
      confirmTransaction(editingMessageId, updated);
    }
    sheetRef.current?.close();
    setEditingMessageId(null);
  }

  function handleSheetDelete() {
    if (editingMessageId) {
      setMessages(prev => prev.filter(m => m.id !== editingMessageId));
    }
    sheetRef.current?.close();
    setEditingMessageId(null);
  }

  const editingMessage = messages.find(
    m => m.id === editingMessageId && m.role === 'assistant'
  ) as Extract<ChatMessage, { role: 'assistant' }> | undefined;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID="chat-screen"
    >
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton} hitSlop={8}>
          <Feather name="chevron-left" size={18} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerText}>
          <View style={styles.headerStatus}>
            <View style={styles.headerIcon}>
              <Feather name="message-circle" size={17} color={colors.accent} />
            </View>
            <Text style={styles.headerTitle}>Assistente</Text>
          </View>
          <View style={styles.headerStatus}>
            <View style={styles.headerStatusDot} />
            <Text style={styles.headerStatusLabel}>Lance as transações por mensagem</Text>
          </View>
        </View>
      </View>

      {accountsError && (
        <View style={styles.accountsErrorBanner}>
          <Feather name="alert-triangle" size={14} color={colors.danger} />
          <Text style={styles.accountsErrorText}>
            Não foi possível carregar suas contas.
          </Text>
          <Pressable onPress={loadAccounts} hitSlop={8}>
            <Text style={styles.accountsErrorRetry}>Tentar novamente</Text>
          </Pressable>
        </View>
      )}

      {messages.length === 0 ? (
        <View style={styles.emptyState} testID="chat-empty-state">
          <View style={styles.emptyIcon}>
            <Feather name="message-circle" size={26} color="#fff" />
          </View>
          <Text style={styles.emptyTitle}>Escreva, e eu organizo.</Text>
          <Text style={styles.emptySubtitle}>
            Conte um gasto, receita ou conta a pagar em linguagem natural. Eu categorizo e
            lanço pra você.
          </Text>
          <Text style={styles.emptyEyebrow}>Experimente</Text>
          <View style={styles.suggestions}>
            {SUGGESTIONS.map(s => (
              <Pressable
                key={s.text}
                style={styles.suggestionRow}
                onPress={() => sendText(s.text)}
              >
                <View style={[styles.suggestionIcon, { backgroundColor: s.color }]}>
                  <Feather name={s.icon} size={13} color="#fff" />
                </View>
                <Text style={styles.suggestionText}>{s.text}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (item.role === 'user') {
              return (
                <View style={styles.userBubbleWrapper}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userBubbleText}>{item.text}</Text>
                  </View>
                </View>
              );
            }
            if (item.role === 'error') {
              return (
                <View style={styles.assistantRow}>
                  <View style={styles.assistantAvatar}>
                    <Feather name="message-circle" size={14} color={colors.accent} />
                  </View>
                  <Text style={styles.errorMessage}>{item.text}</Text>
                </View>
              );
            }
            return (
              <View style={styles.assistantRow}>
                <View style={styles.assistantAvatar}>
                  <Feather name="message-circle" size={14} color={colors.accent} />
                </View>
                <TransactionPreviewCard
                  inferred={item.result.inferred}
                  confidence={item.result.confidence}
                  accounts={accounts}
                  status={item.status}
                  errorMessage={item.errorMessage}
                  onConfirm={() => confirmTransaction(item.id, item.result.inferred)}
                  onEdit={() => handleEdit(item)}
                />
              </View>
            );
          }}
        />
      )}

      <View style={[styles.inputBar, { paddingBottom: insets.bottom }]}>
        <TextInput
          style={styles.textInput}
          placeholder="Ex: gastei 80 no mercado hoje"
          placeholderTextColor={colors.mutedForeground}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => sendText(inputText)}
          editable={!sending}
        />
        <Pressable
          onPress={() => sendText(inputText)}
          disabled={sending || !inputText.trim()}
          style={styles.sendButton}
          testID="send-button"
        >
          <Feather name="arrow-up" size={18} color={colors.accentForeground} />
        </Pressable>
      </View>

      <EditTransactionSheet
        ref={sheetRef}
        value={editingMessage?.result.inferred ?? null}
        accounts={accounts}
        onConfirm={handleSheetConfirm}
        onDelete={handleSheetDelete}
      />
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  headerStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  headerStatusLabel: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    color: colors.accent,
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
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountsErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.warningSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  accountsErrorText: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.danger,
  },
  accountsErrorRetry: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    color: colors.accent,
  },
  emptyState: {
    flex: 1,
    padding: 24,
    paddingTop: 24,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...shadow.accent,
  },
  emptyTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 22,
    color: colors.foreground,
    letterSpacing: -0.4,
  },
  emptySubtitle: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: 6,
    lineHeight: 20,
  },
  emptyEyebrow: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    color: colors.mutedForeground2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 26,
    marginBottom: 12,
  },
  suggestions: {
    gap: 9,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    padding: 13,
  },
  suggestionIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    flex: 1,
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  userBubbleWrapper: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    borderTopRightRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 11,
    maxWidth: '80%',
  },
  userBubbleText: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.accentForeground,
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 12,
  },
  assistantAvatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  errorMessage: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.danger,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingTop: 10,
    paddingHorizontal: 14,
    height: TAB_BAR_HEIGHT,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    color: colors.foreground,
    backgroundColor: colors.surface,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
