// services/tasks.ts -- ПОЛНЫЙ КОД С ЛОГАМИ

// frontend/services/tasks.ts -- ПОЛНЫЙ КОД

import { supabase } from '@/lib/supabase'; // <-- ИЗМЕНЕН ИМПОРТ
import { Task, CreateTaskData, UpdateTaskData, BurnoutScore, AIConversation } from '@/types/tasks';

const sanitizeDates = (taskData: Partial<CreateTaskData> | Partial<UpdateTaskData>) => {
  const sanitizedData = { ...taskData };
  if ('deadline' in sanitizedData && (sanitizedData.deadline === '' || sanitizedData.deadline === undefined)) { sanitizedData.deadline = null; }
  if ('scheduled_date' in sanitizedData && (sanitizedData.scheduled_date === '' || sanitizedData.scheduled_date === undefined)) { sanitizedData.scheduled_date = null; }
  return sanitizedData;
};

export const taskService = {
  getWeekStart(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    return d;
  },

  async createTask(taskData: CreateTaskData): Promise<{ data: Task | null; error: string | null }> {
    console.log('[LOG] services/tasks.ts: Вызвана createTask с данными:', taskData);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { data: null, error: 'User not authenticated' };
      const cleanData = sanitizeDates(taskData);
      const taskWithUserId = { ...cleanData, user_id: user.id };
      const { data, error } = await supabase.from('tasks').insert([taskWithUserId]).select().single();
      if (error) { console.error('Task creation error:', error); return { data: null, error: error.message }; }
      return { data, error: null };
    } catch (err) {
      console.error('Task creation exception:', err);
      return { data: null, error: 'Failed to create task' };
    }
  },

  async getTasksByDateRange(startDate: string, endDate: string): Promise<{ data: Task[] | null; error: string | null }> {
    console.log(`[LOG] services/tasks.ts: Вызвана getTasksByDateRange с ${startDate} по ${endDate}`);
    try {
      const { data, error } = await supabase.from('tasks').select('*').gte('scheduled_date', startDate).lte('scheduled_date', endDate).order('scheduled_date', { ascending: true });
      if (error) { console.error("Error fetching tasks by date range:", error); return { data: null, error: error.message }; }
      return { data: data || [], error: null };
    } catch (err) {
      return { data: null, error: 'Failed to fetch tasks by date range' };
    }
  },

  async updateTask(id: string, updates: UpdateTaskData): Promise<{ data: Task | null; error: string | null }> {
    console.log(`[LOG] services/tasks.ts: Вызвана updateTask для ID ${id} с обновлениями:`, updates);
    try {
      const cleanUpdates = sanitizeDates(updates);
      const { data, error } = await supabase.from('tasks').update({ ...cleanUpdates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) { console.error("Error updating task:", error); return { data: null, error: error.message }; }
      return { data, error: null };
    } catch (err) {
      return { data: null, error: 'Failed to update task' };
    }
  },

  async deleteTask(id: string): Promise<{ error: string | null }> {
    console.log(`[LOG] services/tasks.ts: Вызвана deleteTask для ID ${id}`);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) { return { error: error.message }; }
      return { error: null };
    } catch (err) {
      return { error: 'Failed to delete task' };
    }
  },

  async getBurnoutScores(weekStart: string): Promise<{ data: BurnoutScore[] | null; error: string | null }> {
    console.log(`[LOG] services/tasks.ts: Вызвана getBurnoutScores для недели, начинающейся с: ${weekStart}`);
    try {
      const { data, error } = await supabase.rpc('get_burnout_scores_for_week', { p_week_start: weekStart });
      if (error) {
        console.error("[ERROR] services/tasks.ts: Ошибка при вызове RPC get_burnout_scores_for_week:", error);
        return { data: null, error: error.message };
      }
      console.log('[LOG] services/tasks.ts: Получен ответ от RPC:', data);
      return { data: data || [], error: null };
    } catch (err) {
      console.error("[ERROR] services/tasks.ts: Исключение в getBurnoutScores:", err);
      return { data: null, error: 'Failed to fetch burnout scores' };
    }
  },

  async getTasks(): Promise<{ data: Task[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      return { data: null, error: 'Failed to fetch tasks' };
    }
  },

  async saveConversation(message: string, response: string, context?: any): Promise<{ data: AIConversation | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
          .from('ai_conversations')
          .insert([{
            user_id: user.id,
            message,
            response,
            context
          }])
          .select()
          .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      return { data: null, error: 'Failed to save conversation' };
    }
  },

  async getConversationHistory(limit: number = 10): Promise<{ data: AIConversation[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
          .from('ai_conversations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      return { data: null, error: 'Failed to fetch conversation history' };
    }
  },

  formatDateForDB(date: Date): string { return date.toISOString().split('T')[0]; },
  getDayName(date: Date): string { return date.toLocaleDateString('ru-RU', { weekday: 'long' }); },
  isToday(date: Date): boolean { return date.toDateString() === new Date().toDateString(); }
};