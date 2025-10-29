// app/(tabs)/index.tsx -- ПОЛНЫЙ КОД ФАЙЛА

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WeekNavigation } from '@/components/ui/WeekNavigation';
import { WeeklyCalendar } from '@/components/ui/WeeklyCalendar';
import { TaskCreateModal } from '@/components/ui/TaskCreateModal';
import { Task } from '@/types/tasks';

export default function TasksScreen() {
    const [showCreateModal, setShowCreateModal] = useState(false);
    // Состояние для хранения задачи, которую пользователь хочет отредактировать
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

    // Эта функция будет вызываться из календаря при клике на задачу
    const handleEditTask = (task: Task) => {
        setEditingTask(task); // Запоминаем задачу
        setShowCreateModal(true); // Открываем модальное окно
    };

    // Функция для открытия модального окна для создания НОВОЙ задачи
    const handleOpenCreateModal = () => {
        setEditingTask(undefined); // Убеждаемся, что нет редактируемой задачи
        setShowCreateModal(true);
    };

    // Функция для закрытия модального окна в любом случае
    const handleCloseModal = () => {
        setShowCreateModal(false);
        setEditingTask(undefined); // Сбрасываем редактируемую задачу
    };

    return (
        <SafeAreaView style={styles.container}>
            <WeekNavigation />

            {/* Передаем в календарь новую функцию для обработки клика на задачу */}
            <WeeklyCalendar onEditTask={handleEditTask} />

            <TouchableOpacity
                style={styles.fab}
                onPress={handleOpenCreateModal} // Теперь вызываем специальную функцию
                activeOpacity={0.8}
            >
                <MaterialIcons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <TaskCreateModal
                visible={showCreateModal}
                onClose={handleCloseModal} // Используем общую функцию закрытия
                task={editingTask} // Передаем задачу в модальное окно. Если undefined - это создание, если есть - редактирование.
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#1976D2',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});