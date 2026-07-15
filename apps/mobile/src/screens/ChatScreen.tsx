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
import { Feather } from '@expo/vector-icons';
import { startOfDay } from 'date-fns';
import { colors, fontFamily, fontSize } from '../theme';
import { Chip } from '../components/Chip';
import { TransactionPreviewCard } from '../components/TransactionPreviewCard';
import {
  EditTransactionSheet,
  BottomSheetRef,
} from '../components/EditTransactionSheet';
import { api, ApiError } from '../lib/api';
import { FinancialAccount, InferTransactionResult, InferredTransaction } from '../types';

const SUGGESTIONS = [
  'Almocei 35 reais',
  'Uber ontem 28 reais',
  'Salário do mês 8000',
  'Conta de luz 180, vence dia 28 todo mês',
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

let messageCounter = 0;
function nextId() {
  messageCounter += 1;
  return `msg-${messageCounter}`;
}

export function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const sheetRef = useRef<BottomSheetRef>(null);

  useEffect(() => {
    api
      .get<FinancialAccount[]>('/api/v1/accounts')
      .then(setAccounts)
      .catch(() => setAccounts([]));
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

  async function handleConfirm(message: Extract<ChatMessage, { role: 'assistant' }>) {
    updateMessage(message.id, { status: 'saving' });
    const inferred = message.result.inferred;

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
      updateMessage(message.id, { status: 'confirmed' });
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erro ao salvar';
      updateMessage(message.id, { status: 'error', errorMessage });
    }
  }

  function handleEdit(message: Extract<ChatMessage, { role: 'assistant' }>) {
    setEditingMessageId(message.id);
    sheetRef.current?.expand();
  }

  function handleSheetSave(updated: InferredTransaction) {
    if (editingMessageId) {
      setMessages(prev =>
        prev.map(m =>
          m.id === editingMessageId && m.role === 'assistant'
            ? { ...m, result: { ...m.result, inferred: updated }, status: 'pending' }
            : m
        )
      );
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
      {messages.length === 0 ? (
        <View style={styles.emptyState} testID="chat-empty-state">
          <Feather name="message-circle" size={32} color={colors.accent} />
          <Text style={styles.emptyTitle}>Conte o que você gastou ou recebeu</Text>
          <View style={styles.suggestions}>
            {SUGGESTIONS.map(s => (
              <Chip key={s} label={s} onPress={() => sendText(s)} />
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
                <View style={styles.assistantWrapper}>
                  <Text style={styles.errorMessage}>{item.text}</Text>
                </View>
              );
            }
            return (
              <View style={styles.assistantWrapper}>
                <TransactionPreviewCard
                  inferred={item.result.inferred}
                  confidence={item.result.confidence}
                  accounts={accounts}
                  status={item.status}
                  errorMessage={item.errorMessage}
                  onConfirm={() => handleConfirm(item)}
                  onEdit={() => handleEdit(item)}
                />
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Digite uma transação…"
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
        onSave={handleSheetSave}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.base,
    color: colors.foreground,
    textAlign: 'center',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
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
    borderRadius: 16,
    borderTopRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '80%',
  },
  userBubbleText: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.accentForeground,
  },
  assistantWrapper: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  errorMessage: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    color: colors.danger,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    color: colors.foreground,
    backgroundColor: colors.background,
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
