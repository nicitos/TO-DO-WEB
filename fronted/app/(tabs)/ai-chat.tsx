// frontend/app/(tabs)/ai-chat.tsx -- ПОЛНЫЙ И ОКОНЧАТЕЛЬНЫЙ КОД

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AIMessage } from '@/types/tasks';
import { supabase } from '@/lib/supabase'; // <-- ПРАВИЛЬНЫЙ ИМПОРТ
import { useTasks } from '@/hooks/useTasks';

// Строка `const supabase = getSupabaseClient()` ПОЛНОСТЬЮ УДАЛЕНА.

export default function AIChatScreen() {
  const { refreshTasks } = useTasks();
  const [messages, setMessages] = useState<AIMessage[]>([
    { id: '1', type: 'ai', content: 'Здравствуйте! Я ваш ИИ-ассистент TaskMaster. Я могу помочь вам создавать и распределять задачи. Как я могу помочь сегодня?', timestamp: new Date() },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    const userMessage: AIMessage = { id: Date.now().toString(), type: 'user', content: inputText.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Теперь мы используем импортированный `supabase` напрямую
      const { data, error } = await supabase.functions.invoke('ask-gemini', {
        body: { query: userMessage.content },
      });

      if (error) throw error;

      const aiResponse: AIMessage = { id: (Date.now() + 1).toString(), type: 'ai', content: data.response || 'Произошла ошибка, не могу дать ответ.', timestamp: new Date() };
      setMessages(prev => [...prev, aiResponse]);

      if (data.tasks_updated) {
        await refreshTasks();
      }
    } catch (error: any) {
      const errorResponse: AIMessage = { id: (Date.now() + 1).toString(), type: 'ai', content: `К сожалению, произошла ошибка. Попробуйте еще раз.\nДетали: ${error.message}`, timestamp: new Date() };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date): string => date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <MaterialIcons name="smart-toy" size={24} color="#1976D2" />
          <Text style={styles.headerTitle}>AI Ассистент</Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, isLoading && styles.statusDotLoading]} />
            <Text style={[styles.statusText, isLoading && styles.statusTextLoading]}>{isLoading ? 'Думает...' : 'Готов'}</Text>
          </View>
        </View>
        <ScrollView ref={scrollViewRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
          {messages.map((message) => (
              <View key={message.id} style={[styles.messageRow, message.type === 'user' && styles.userMessageRow]}>
                <View style={[styles.messageBubble, message.type === 'user' ? styles.userBubble : styles.aiBubble]}>
                  <Text style={[styles.messageText, message.type === 'user' && styles.userMessageText]}>{message.content}</Text>
                  <Text style={[styles.timestamp, message.type === 'user' && styles.userTimestamp]}>{formatTime(message.timestamp)}</Text>
                </View>
              </View>
          ))}
          {isLoading && (<View style={[styles.messageRow, {alignItems: 'flex-start'}]}><View style={[styles.messageBubble, styles.aiBubble]}><ActivityIndicator size="small" color="#1976D2" /></View></View>)}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput style={styles.textInput} value={inputText} onChangeText={setInputText} placeholder="Создай задачу 'купить хлеб' на завтра..." multiline maxLength={500} />
          <TouchableOpacity style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]} onPress={handleSendMessage} disabled={!inputText.trim() || isLoading}>
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#212121', flex: 1, marginLeft: 12 },
  statusIndicator: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 6 },
  statusDotLoading: { backgroundColor: '#FFC107' },
  statusText: { fontSize: 12, color: '#4CAF50', fontWeight: '500' },
  statusTextLoading: { color: '#FFC107' },
  messagesContainer: { flex: 1, paddingHorizontal: 16 },
  messagesContent: { paddingVertical: 16 },
  messageRow: { marginBottom: 16, alignItems: 'flex-start' },
  userMessageRow: { alignItems: 'flex-end' },
  messageBubble: { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18 },
  aiBubble: { backgroundColor: '#FFFFFF', borderColor: '#E0E0E0', borderWidth: 1, borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: '#1976D2', borderBottomRightRadius: 4 },
  messageText: { fontSize: 14, lineHeight: 20, color: '#212121' },
  userMessageText: { color: '#FFFFFF' },
  timestamp: { fontSize: 10, color: '#757575', marginTop: 4, alignSelf: 'flex-end' },
  userTimestamp: { color: '#E3F2FD' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E0E0E0', ...Platform.select({ ios: { paddingBottom: 32 }, android: { paddingBottom: 12 } }) },
  textInput: { flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, maxHeight: 100, marginRight: 12, backgroundColor: '#FAFAFA' },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1976D2', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#BDBDBD' },
});