// frontend/app/(tabs)/profile.tsx -- ПОЛНЫЙ КОД

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth';      // <-- ИЗМЕНЕН ИМПОРТ
import { showAlert } from '@/lib/alert';  // <-- ИЗМЕНЕН ИМПОРТ
import { supabase } from '@/lib/supabase';  // <-- ИЗМЕНЕН ИМПОРТ
import { useTasks } from '@/hooks/useTasks';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { tasks } = useTasks();

  const handleLogout = () => {
    showAlert(
      'Выйти из системы',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        { 
          text: 'Выйти', 
          style: 'destructive', 
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              showAlert('Ошибка', error.message);
            } else {
              router.replace('/login');
            }
          }
        }
      ]
    );
  };

  const handleNotifications = () => { showAlert('Уведомления', 'Настройка push-уведомлений о дедлайнах и рекомендациях ИИ будет доступна в следующих обновлениях.', [{ text: 'Понятно', style: 'default' }] ); };
  const handleTheme = () => { showAlert('Тема оформления', 'Темная и светлая темы будут добавлены в ближайших обновлениях. Сейчас используется светлая тема.', [{ text: 'Понятно', style: 'default' }] ); };
  const handleDataSync = () => { showAlert('Данные и синхронизация', 'Ваши задачи автоматически синхронизируются в облаке. Все данные защищены и доступны на всех ваших устройствах.', [{ text: 'Отлично', style: 'default' }] ); };
  const handleHelp = () => { showAlert('Помощь и поддержка', 'Нужна помощь?\n\n• Кликайте на задачи для их изменения\n• Отслеживайте уровень выгорания\n• Используйте ИИ-ассистент для создания задач\n\nСвязь: support@taskmaster.ai', [{ text: 'Понятно', style: 'default' }] ); };
  const handleAbout = () => { showAlert('О программе', 'TaskMaster AI v1.0\n\nИнтеллектуальное управление задачами с недельным планированием и ИИ-оптимизацией.\n\nРазработано с ❤️ для продуктивности', [{ text: 'Спасибо', style: 'default' }] ); };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(task => {
      if (!task.deadline || task.completed) return false;
      // Убедимся, что deadline не null перед созданием Date
      return task.deadline && new Date(task.deadline) < new Date();
    }).length;

    return { total, completed, pending, overdue };
  };

  const stats = getTaskStats();

  return (
    <SafeAreaView style={styles.container}><ScrollView style={styles.content} showsVerticalScrollIndicator={false}><View style={styles.header}><View style={styles.avatarContainer}><MaterialIcons name="person" size={48} color="#1976D2" /></View><Text style={styles.userName}>{user?.email || 'Пользователь'}</Text><Text style={styles.userEmail}>{user?.email}</Text></View><View style={styles.statsContainer}><Text style={styles.sectionTitle}>Статистика задач</Text><View style={styles.statsGrid}><View style={styles.statCard}><Text style={styles.statNumber}>{stats.total}</Text><Text style={styles.statLabel}>Всего задач</Text></View><View style={styles.statCard}><Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.completed}</Text><Text style={styles.statLabel}>Выполнено</Text></View><View style={styles.statCard}><Text style={[styles.statNumber, { color: '#FF9800' }]}>{stats.pending}</Text><Text style={styles.statLabel}>В процессе</Text></View><View style={styles.statCard}><Text style={[styles.statNumber, { color: '#F44336' }]}>{stats.overdue}</Text><Text style={styles.statLabel}>Просрочено</Text></View></View></View><View style={styles.menuContainer}><Text style={styles.sectionTitle}>Настройки</Text><TouchableOpacity style={styles.menuItem} onPress={handleNotifications}><MaterialIcons name="notifications" size={24} color="#757575" /><Text style={styles.menuText}>Уведомления</Text><MaterialIcons name="chevron-right" size={24} color="#BDBDBD" /></TouchableOpacity><TouchableOpacity style={styles.menuItem} onPress={handleTheme}><MaterialIcons name="palette" size={24} color="#757575" /><Text style={styles.menuText}>Тема</Text><MaterialIcons name="chevron-right" size={24} color="#BDBDBD" /></TouchableOpacity><TouchableOpacity style={styles.menuItem} onPress={handleDataSync}><MaterialIcons name="backup" size={24} color="#757575" /><Text style={styles.menuText}>Данные и синхронизация</Text><MaterialIcons name="chevron-right" size={24} color="#BDBDBD" /></TouchableOpacity><TouchableOpacity style={styles.menuItem} onPress={handleHelp}><MaterialIcons name="help" size={24} color="#757575" /><Text style={styles.menuText}>Помощь и поддержка</Text><MaterialIcons name="chevron-right" size={24} color="#BDBDBD" /></TouchableOpacity><TouchableOpacity style={styles.menuItem} onPress={handleAbout}><MaterialIcons name="info" size={24} color="#757575" /><Text style={styles.menuText}>О программе</Text><MaterialIcons name="chevron-right" size={24} color="#BDBDBD" /></TouchableOpacity></View><View style={styles.actionContainer}><TouchableOpacity style={styles.logoutButton} onPress={handleLogout}><MaterialIcons name="logout" size={24} color="#F44336" /><Text style={styles.logoutText}>Выйти из системы</Text></TouchableOpacity></View></ScrollView></SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F8F9FA' }, content: { flex: 1 }, header: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#FFFFFF', marginBottom: 16 }, avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }, userName: { fontSize: 24, fontWeight: '600', color: '#212121', marginBottom: 4 }, userEmail: { fontSize: 14, color: '#757575' }, statsContainer: { backgroundColor: '#FFFFFF', paddingVertical: 24, paddingHorizontal: 16, marginBottom: 16 }, sectionTitle: { fontSize: 18, fontWeight: '600', color: '#212121', marginBottom: 16 }, statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, statCard: { width: '48%', backgroundColor: '#F8F9FA', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 }, statNumber: { fontSize: 28, fontWeight: '700', color: '#1976D2', marginBottom: 4 }, statLabel: { fontSize: 12, color: '#757575', textAlign: 'center' }, menuContainer: { backgroundColor: '#FFFFFF', paddingVertical: 16, marginBottom: 16 }, menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }, menuText: { flex: 1, fontSize: 16, color: '#212121', marginLeft: 16 }, actionContainer: { backgroundColor: '#FFFFFF', paddingVertical: 16, marginBottom: 32 }, logoutButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 }, logoutText: { fontSize: 16, color: '#F44336', marginLeft: 16, fontWeight: '500' }, });