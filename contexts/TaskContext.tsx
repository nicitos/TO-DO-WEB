// contexts/TaskContext.tsx -- ПОЛНЫЙ КОД С ЛОГАМИ

import React, { createContext, ReactNode, useState, useEffect } from 'react';
import { Task, CreateTaskData, UpdateTaskData, WeekDay, BurnoutScore } from '@/types/tasks';
import { taskService } from '@/services/tasks';
import { useAuth } from '@/template';

interface TaskContextType {
  tasks: Task[];
  weekDays: WeekDay[];
  currentWeekStart: Date;
  loading: boolean;
  error: string | null;
  createTask: (taskData: CreateTaskData) => Promise<{ error: string | null }>;
  updateTask: (id: string, updates: UpdateTaskData) => Promise<{ error: string | null }>;
  deleteTask: (id: string) => Promise<{ error: string | null }>;
  moveTaskToDate: (taskId: string, date: string) => Promise<{ error: string | null }>;
  toggleTaskCompletion: (taskId: string) => Promise<{ error: string | null }>;
  loadWeek: (weekStart: Date) => Promise<void>;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToCurrentWeek: () => void;
  refreshTasks: () => Promise<void>;
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weekDays, setWeekDays] = useState<WeekDay[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(taskService.getWeekStart(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeWeekDays = (weekStart: Date, tasksData: Task[], burnoutData: BurnoutScore[]): WeekDay[] => {
    console.log('[LOG] TaskContext: initializeWeekDays вызвана. Получены данные о выгорании:', burnoutData);
    const days: WeekDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayTasks = tasksData.filter(task => task.scheduled_date && new Date(task.scheduled_date).toDateString() === date.toDateString());

      const postgresDayOfWeek = i + 1;
      const burnoutScore = burnoutData.find(b => b.day_of_week === postgresDayOfWeek)?.burnout_score || 0;
      if (burnoutData.length > 0) {
        console.log(`[LOG] TaskContext: День ${i+1}, ищу day_of_week=${postgresDayOfWeek}, найден score=${burnoutScore}`);
      }

      days.push({ date, dayName: taskService.getDayName(date), dayNumber: date.getDate(), isToday: taskService.isToday(date), tasks: dayTasks, burnoutScore });
    }
    console.log('[LOG] TaskContext: Сформирован финальный массив дней:', days.map(d => ({date: d.date.toISOString().split('T')[0], score: d.burnoutScore})));
    return days;
  };

  const loadWeek = async (weekStart: Date) => {
    console.log('[LOG] TaskContext: Загружаю неделю, начиная с', weekStart.toISOString().split('T')[0]);
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const startDateStr = taskService.formatDateForDB(weekStart);
      const endDateStr = taskService.formatDateForDB(weekEnd);

      const [tasksResult, burnoutResult] = await Promise.all([
        taskService.getTasksByDateRange(startDateStr, endDateStr),
        taskService.getBurnoutScores(startDateStr)
      ]);

      if (tasksResult.error) throw new Error(tasksResult.error);
      if (burnoutResult.error) console.warn('Failed to load burnout scores:', burnoutResult.error);

      setTasks(tasksResult.data || []);
      setWeekDays(initializeWeekDays(weekStart, tasksResult.data || [], burnoutResult.data || []));
      setCurrentWeekStart(weekStart);

    } catch (err: any) {
      console.error('Load week error:', err);
      setError('Failed to load week data: ' + err.message);
      setTasks([]);
      setWeekDays(initializeWeekDays(weekStart, [], []));
    } finally {
      setLoading(false);
    }
  };

  const refreshTasks = async () => {
    console.log('[LOG] TaskContext: Вызвана refreshTasks');
    await loadWeek(currentWeekStart);
  };

  const createTask = async (taskData: CreateTaskData): Promise<{ error: string | null }> => {
    console.log('[LOG] TaskContext: Вызвана createTask');
    const { error } = await taskService.createTask(taskData);
    if (error) {
      setError(error);
      return { error };
    }
    await refreshTasks();
    return { error: null };
  };

  const updateTask = async (id: string, updates: UpdateTaskData): Promise<{ error: string | null }> => {
    console.log('[LOG] TaskContext: Вызвана updateTask');
    const { error } = await taskService.updateTask(id, updates);
    if (error) {
      setError(error);
      return { error };
    }
    await refreshTasks();
    return { error: null };
  };

  const deleteTask = async (id: string): Promise<{ error: string | null }> => {
    console.log('[LOG] TaskContext: Вызвана deleteTask');
    const { error } = await taskService.deleteTask(id);
    if (error) {
      setError(error);
      return { error };
    }
    await refreshTasks();
    return { error: null };
  };

  const moveTaskToDate = async (taskId: string, date: string): Promise<{ error: string | null }> => {
    return await updateTask(taskId, { scheduled_date: date });
  };

  const toggleTaskCompletion = async (taskId: string): Promise<{ error: string | null }> => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      return { error: 'Task not found' };
    }
    return await updateTask(taskId, { completed: !task.completed });
  };

  const goToPreviousWeek = () => {
    const previousWeek = new Date(currentWeekStart);
    previousWeek.setDate(previousWeek.getDate() - 7);
    loadWeek(previousWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    loadWeek(nextWeek);
  };

  const goToCurrentWeek = () => {
    loadWeek(taskService.getWeekStart(new Date()));
  };

  useEffect(() => {
    if (user) {
      loadWeek(taskService.getWeekStart(new Date()));
    } else {
      setTasks([]);
      setWeekDays([]);
      setLoading(false);
    }
  }, [user]);

  const contextValue: TaskContextType = {
    tasks,
    weekDays,
    currentWeekStart,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    moveTaskToDate,
    toggleTaskCompletion,
    loadWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    refreshTasks
  };

  return (
      <TaskContext.Provider value={contextValue}>
        {children}
      </TaskContext.Provider>
  );
}