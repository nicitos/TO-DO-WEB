import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required. Check your .env file.");
}

// ====================== КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ЗДЕСЬ ======================
// Создаем "адаптер" хранилища.
// Если это НЕ веб-платформа (т.е. iOS или Android), используем AsyncStorage.
// В противном случае (веб или серверная сборка), Supabase автоматически
// использует localStorage, что является правильным поведением и не вызывает ошибок.
const storageAdapter = Platform.OS !== 'web' ? AsyncStorage : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Передаем наш адаптер в конфигурацию
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});