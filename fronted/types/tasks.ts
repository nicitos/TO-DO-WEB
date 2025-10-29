export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  deadline?: string | null;
  importance: 'low' | 'medium' | 'high';
  complexity: 1 | 2 | 3 | 4 | 5;
  scheduled_date?: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskData {
  title: string;
  description?: string | null;
  deadline?: string | null;
  importance: 'low' | 'medium' | 'high';
  complexity: 1 | 2 | 3 | 4 | 5;
  scheduled_date?: string | null;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  completed?: boolean;
}

export interface BurnoutScore {
  // Этот тип используется для данных, которые возвращает RPC
  day_of_week: number;
  burnout_score: number;
}

export interface AIConversation {
  id: string;
  user_id: string;
  message: string;
  response: string;
  context?: any;
  created_at: string;
}

export interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  tasks: Task[];
  burnoutScore: number;
}

export interface AIMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface TaskSuggestion {
  taskId: string;
  currentDate?: string;
  suggestedDate: string;
  reason: string;
}