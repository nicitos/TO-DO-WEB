// components/ui/TaskCard.tsx -- ПОЛНЫЙ КОД ФАЙЛА

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Task } from '@/types/tasks';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onToggleComplete?: () => void;
  onDelete?: () => void;
  style?: any;
}

export function TaskCard({ task, onPress, onToggleComplete, onDelete, style }: TaskCardProps) {
  const getImportanceColor = (importance: string): string => {
    switch (importance) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#2196F3';
    }
  };

  const getComplexityStars = (complexity: number): string => '★'.repeat(complexity) + '☆'.repeat(5 - complexity);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { month: '2-digit', day: '2-digit' });
  };

  const isOverdue = (): boolean => {
    if (!task.deadline || task.completed) return false;
    const deadline = new Date(task.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadline < today;
  };

  const isDueSoon = (): boolean => {
    if (!task.deadline || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const deadlineDate = new Date(task.deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate.getTime() === tomorrow.getTime();
  };

  return (
      <TouchableOpacity
          style={[
            styles.container,
            task.completed && styles.completedContainer,
            isOverdue() && styles.overdueContainer,
            isDueSoon() && styles.dueSoonContainer,
            style
          ]}
          onPress={onPress}
          activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={onToggleComplete} style={styles.checkboxContainer}><MaterialIcons name={task.completed ? 'check-circle' : 'radio-button-unchecked'} size={20} color={task.completed ? '#4CAF50' : '#757575'} /></TouchableOpacity>
            <Text style={[styles.title, task.completed && styles.completedTitle]} numberOfLines={2}>{task.title}</Text>
            <TouchableOpacity onPress={onDelete} style={styles.deleteButton}><MaterialIcons name="close" size={16} color="#757575" /></TouchableOpacity>
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.importanceBadge, { backgroundColor: getImportanceColor(task.importance) }]}><Text style={styles.importanceText}>{task.importance.toUpperCase()}</Text></View>
            <Text style={styles.complexity}>{getComplexityStars(task.complexity)}</Text>
          </View>
        </View>

        {task.description && (<Text style={[styles.description, task.completed && styles.completedText]} numberOfLines={2}>{task.description}</Text>)}

        <View style={styles.footer}>
          {task.deadline && (
              <View style={styles.deadlineContainer}>
                <MaterialIcons name="schedule" size={12} color={isOverdue() ? '#F44336' : isDueSoon() ? '#FF9800' : '#757575'} />
                <Text style={[styles.deadline, isOverdue() && styles.overdueText, isDueSoon() && styles.dueSoonText]}>{formatDate(task.deadline)}</Text>
              </View>
          )}
        </View>
      </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginVertical: 4, borderWidth: 1, borderColor: '#E0E0E0', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 2 }, web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } }) },
  completedContainer: { backgroundColor: '#F5F5F5' },
  overdueContainer: { borderColor: '#F44336', borderWidth: 1.5 },
  dueSoonContainer: { borderColor: '#FF9800', borderWidth: 1.5, backgroundColor: '#FFF8E1' },
  header: { marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  checkboxContainer: { marginRight: 8, marginTop: 2 },
  title: { flex: 1, fontSize: 14, fontWeight: '600', color: '#212121', lineHeight: 20 },
  completedTitle: { textDecorationLine: 'line-through', color: '#757575' },
  deleteButton: { padding: 2, marginLeft: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  importanceBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  importanceText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  complexity: { fontSize: 12, color: '#FFC107' },
  description: { fontSize: 12, color: '#616161', lineHeight: 16, marginBottom: 8 },
  completedText: { color: '#9E9E9E' },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 },
  deadlineContainer: { flexDirection: 'row', alignItems: 'center' },
  deadline: { fontSize: 11, color: '#757575', marginLeft: 4 },
  overdueText: { color: '#F44336', fontWeight: '600' },
  dueSoonText: { color: '#FF9800', fontWeight: '600' },
});