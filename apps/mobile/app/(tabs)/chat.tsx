import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/src/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hello! I'm AIOS, your enterprise AI assistant. How can I help you today?",
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await apiClient.post('/api/ai/chat', {
        messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
      });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data?.content ?? response.data?.message ?? 'I received your message.',
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, messages, isTyping]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
            {item.role === 'assistant' && (
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>AI</Text>
              </View>
            )}
            <View style={[styles.bubbleContent, item.role === 'user' ? styles.contentUser : styles.contentAssistant]}>
              <Text style={styles.bubbleText}>{item.content}</Text>
              <Text style={styles.bubbleTime}>{formatTime(item.createdAt)}</Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          isTyping ? (
            <View style={[styles.bubble, styles.bubbleAssistant]}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>AI</Text>
              </View>
              <View style={styles.contentAssistant}>
                <ActivityIndicator size="small" color="#6366f1" />
              </View>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask anything..."
          placeholderTextColor="#4b5563"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || isTyping}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  list: { padding: 16, paddingBottom: 8 },
  bubble: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  bubbleUser: { justifyContent: 'flex-end' },
  bubbleAssistant: { justifyContent: 'flex-start' },
  avatarBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  bubbleContent: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  contentUser: { backgroundColor: '#6366f1', borderBottomRightRadius: 4 },
  contentAssistant: {
    backgroundColor: '#111827',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  bubbleText: { color: '#ffffff', fontSize: 14, lineHeight: 20 },
  bubbleTime: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    gap: 10,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    backgroundColor: '#1f2937',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
