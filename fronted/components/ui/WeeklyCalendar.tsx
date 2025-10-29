import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TaskCard } from './TaskCard';
import { BurnoutIndicator } from './BurnoutIndicator';
import { useTasks } from '@/hooks/useTasks';
import { showAlert } from '@/lib/alert'; // <-- ИСПРАВЛЕНИЕ ЗДЕСЬ
import { Task } from '@/types/tasks';

interface WeeklyCalendarProps {
  onEditTask: (task: Task) => void;
}

export function WeeklyCalendar({ onEditTask }: WeeklyCalendarProps) {
  const insets = useSafeAreaInsets();
  // `useAlert` больше не нужен, используем `showAlert` напрямую
  const { weekDays, toggleTaskCompletion, deleteTask, loading } = useTasks();

  const handleToggleComplete = async (taskId: string) => {
    const result = await toggleTaskCompletion(taskId);
    if (result.error) showAlert('Ошибка', result.error);
  };

  const handleDeleteTask = (taskId: string) => {
    showAlert('Удалить задачу', 'Вы уверены, что хотите удалить эту задачу?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
          const result = await deleteTask(taskId);
          if (result.error) showAlert('Ошибка', result.error);
        }}
    ]);
  };

  const formatDateHeader = (date: Date): string => date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });

  if (loading) {
    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}><Text style={styles.loadingText}>Загрузка задач...</Text></View>
        </View>
    );
  }

  return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.horizontalScroll} contentContainerStyle={styles.scrollContent}>
          {weekDays.map((day) => (
              <View key={day.date.toISOString()} style={styles.dayColumn}>
                <View style={[styles.dayHeader, day.isToday && styles.todayHeader]}>
                  <Text style={[styles.dayName, day.isToday && styles.todayText]}>{day.dayName.substring(0, 3)}</Text>
                  <Text style={[styles.dayDate, day.isToday && styles.todayText]}>{formatDateHeader(day.date)}</Text>
                </View>
                <BurnoutIndicator score={day.burnoutScore} style={styles.burnoutIndicator} />
                <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.taskListContent}>
                  {day.tasks.map((task) => (
                      <TaskCard
                          key={task.id}
                          task={task}
                          onPress={() => onEditTask(task)}
                          onToggleComplete={() => handleToggleComplete(task.id)}
                          onDelete={() => handleDeleteTask(task.id)}
                          style={styles.taskCard}
                      />
                  ))}
                  {day.tasks.length === 0 && (<View style={styles.emptyDayContainer}><Text style={styles.emptyDayText}>Нет задач</Text></View>)}
                </ScrollView>
              </View>
          ))}
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#757575' },
  horizontalScroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 8 },
  dayColumn: { width: Platform.select({ web: 240, default: 160 }), marginHorizontal: 4, backgroundColor: '#FFFFFF', borderRadius: 12, marginVertical: 8, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }, android: { elevation: 4 }, web: { boxShadow: '0 4px 8px rgba(0,0,0,0.1)' } }) },
  dayHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', alignItems: 'center' },
  todayHeader: { backgroundColor: '#E3F2FD' },
  dayName: { fontSize: 14, fontWeight: '600', color: '#424242', marginBottom: 2, textTransform: 'capitalize' },
  dayDate: { fontSize: 12, color: '#757575' },
  todayText: { color: '#1976D2', fontWeight: '700' },
  burnoutIndicator: { paddingHorizontal: 16, paddingVertical: 8 },
  taskList: { flex: 1, paddingHorizontal: 8 },
  taskListContent: { paddingVertical: 8, minHeight: 200 },
  taskCard: { marginVertical: 4 },
  emptyDayContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 32 },
  emptyDayText: { fontSize: 12, color: '#BDBDBD', fontStyle: 'italic' },
});