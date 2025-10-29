import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CreateTaskData, Task } from '@/types/tasks';
import { useTasks } from '@/hooks/useTasks';
import { showAlert } from '@/lib/alert';

interface TaskCreateModalProps {
  visible: boolean;
  onClose: () => void;
  task?: Task;
  initialDate?: string;
}

export function TaskCreateModal({ visible, onClose, task, initialDate }: TaskCreateModalProps) {
  const { createTask, updateTask } = useTasks();

  const [formData, setFormData] = useState<CreateTaskData>({ title: '', description: '', deadline: '', importance: 'medium', complexity: 3, scheduled_date: '', });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'scheduled_date' | 'deadline'>('scheduled_date');

  useEffect(() => {
    if (visible) {
      if (task) { setFormData({ title: task.title, description: task.description || '', deadline: task.deadline || '', importance: task.importance, complexity: task.complexity, scheduled_date: task.scheduled_date || '' }); }
      else { setFormData({ title: '', description: '', deadline: '', importance: 'medium', complexity: 3, scheduled_date: initialDate || new Date().toISOString().split('T')[0] }); }
    }
  }, [visible, task, initialDate]);

  // ====================== ИСПРАВЛЕНИЕ ЗДЕСЬ ======================
  const handleSave = async () => {
    if (!formData.title.trim()) {
      showAlert('Ошибка', 'Название задачи обязательно для заполнения', [], 'error');
      return;
    }
    setLoading(true);
    try {
      const result = task ? await updateTask(task.id, formData) : await createTask(formData);
      if (result.error) {
        showAlert('Ошибка', result.error, [], 'error');
      } else {
        showAlert('Успех', task ? 'Задача обновлена' : 'Задача создана', [], 'success');
        onClose();
      }
    } catch (error: any) {
      // Здесь я восстановил 'any'
      showAlert('Ошибка', error.message || 'Не удалось сохранить задачу', [], 'error');
    } finally {
      setLoading(false);
    }
  };
  // =============================================================

  const formatDateForDisplay = (dateString?: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setFormData(prev => ({ ...prev, [datePickerTarget]: selectedDate.toISOString().split('T')[0] }));
    }
  };

  const openDatePicker = (target: 'scheduled_date' | 'deadline') => {
    setDatePickerTarget(target);
    setShowDatePicker(true);
  };

  const getDateForPicker = (target: 'scheduled_date' | 'deadline') => formData[target] ? new Date(formData[target] as string) : new Date();

  return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}><MaterialIcons name="close" size={24} color="#757575" /></TouchableOpacity>
            <Text style={styles.title}>{task ? 'Редактировать задачу' : 'Новая задача'}</Text>
            <TouchableOpacity onPress={handleSave} style={[styles.saveButton, loading && styles.saveButtonDisabled]} disabled={loading}><Text style={styles.saveButtonText}>{loading ? 'Сохранение...' : 'Сохранить'}</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}><Text style={styles.label}>Название *</Text><TextInput style={styles.textInput} value={formData.title} onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))} placeholder="Введите название задачи" maxLength={100} /></View>
            <View style={styles.inputGroup}><Text style={styles.label}>Описание</Text><TextInput style={[styles.textInput, styles.textArea]} value={formData.description} onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))} placeholder="Добавить описание (необязательно)" multiline numberOfLines={3} maxLength={500} /></View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Запланированная дата</Text>
              {Platform.OS === 'web' ? (
                  <TextInput style={styles.textInput} value={formatDateForInput(formData.scheduled_date)} onChangeText={(text) => setFormData(prev => ({...prev, scheduled_date: text}))} placeholder="ГГГГ-ММ-ДД"/>
              ) : (
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('scheduled_date')}><Text style={styles.dateText}>{formatDateForDisplay(formData.scheduled_date)}</Text><MaterialIcons name="calendar-today" size={20} color="#757575" /></TouchableOpacity>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Дедлайн</Text>
              {Platform.OS === 'web' ? (
                  <TextInput style={styles.textInput} value={formatDateForInput(formData.deadline)} onChangeText={(text) => setFormData(prev => ({...prev, deadline: text}))} placeholder="ГГГГ-ММ-ДД (необязательно)"/>
              ) : (
                  <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('deadline')}><Text style={styles.dateText}>{formData.deadline ? formatDateForDisplay(formData.deadline) : 'Необязательно'}</Text><MaterialIcons name="calendar-today" size={20} color="#757575" /></TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}><Text style={styles.label}>Важность</Text><View style={styles.segmentedControl}>{(['low', 'medium', 'high'] as const).map((importance) => (<TouchableOpacity key={importance} style={[styles.segmentButton, formData.importance === importance && styles.segmentButtonActive]} onPress={() => setFormData(prev => ({ ...prev, importance }))}><Text style={[styles.segmentButtonText, formData.importance === importance && styles.segmentButtonTextActive]}>{importance === 'low' ? 'Низкая' : importance === 'medium' ? 'Средняя' : 'Высокая'}</Text></TouchableOpacity>))}</View></View>
            <View style={styles.inputGroup}><Text style={styles.label}>Сложность ({formData.complexity}/5)</Text><View style={styles.complexityContainer}>{[1, 2, 3, 4, 5].map((level) => (<TouchableOpacity key={level} style={styles.starButton} onPress={() => setFormData(prev => ({ ...prev, complexity: level as 1 | 2 | 3 | 4 | 5 }))}><Text style={styles.star}>{level <= formData.complexity ? '★' : '☆'}</Text></TouchableOpacity>))}</View></View>
          </ScrollView>
          {showDatePicker && Platform.OS !== 'web' && (<DateTimePicker value={getDateForPicker(datePickerTarget)} mode="date" display="default" onChange={onDateChange}/>)}
        </View>
      </Modal>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#FFFFFF' }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingTop: Platform.OS === 'ios' ? 50 : 20 }, closeButton: { padding: 8 }, title: { fontSize: 18, fontWeight: '600', color: '#212121' }, saveButton: { backgroundColor: '#1976D2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }, saveButtonDisabled: { backgroundColor: '#BDBDBD' }, saveButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 }, form: { flex: 1, paddingHorizontal: 16, paddingTop: 16 }, inputGroup: { marginBottom: 24 }, label: { fontSize: 14, fontWeight: '600', color: '#424242', marginBottom: 8 }, textInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: '#212121', backgroundColor: '#FAFAFA' }, textArea: { height: 80, textAlignVertical: 'top' }, segmentedControl: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 8, padding: 4 }, segmentButton: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center' }, segmentButtonActive: { backgroundColor: '#1976D2' }, segmentButtonText: { fontSize: 14, fontWeight: '500', color: '#757575' }, segmentButtonTextActive: { color: '#FFFFFF' }, complexityContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 }, starButton: { padding: 8 }, star: { fontSize: 24, color: '#FFC107' }, dateInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#FAFAFA' }, dateText: { fontSize: 16, color: '#212121' }, });