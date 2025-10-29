-- ========= НАЧАЛО ЕДИНОГО СКРИПТА "ЧИСТЫЙ ЛИСТ" =========

-- ===== БЛОК 1: ПОЛНАЯ ОЧИСТКА ВСЕГО, ЧТО МОГЛО БЫТЬ СОЗДАНО РАНЕЕ =====
-- Выполняется с проверками IF EXISTS, чтобы гарантированно отработать без ошибок.

DROP TRIGGER IF EXISTS on_task_change_update_burnout ON public.tasks;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.trigger_update_burnout_for_task();
DROP FUNCTION IF EXISTS public.create_new_task(text,date,text,integer);
DROP FUNCTION IF EXISTS public.reschedule_user_task(uuid,date);
DROP FUNCTION IF EXISTS public.get_burnout_scores_for_week(date);
DROP TABLE IF EXISTS public.ai_conversations;
DROP TABLE IF EXISTS public.weekly_burnout;
DROP TABLE IF EXISTS public.tasks;
DROP TABLE IF EXISTS public.user_profiles;


-- ===== БЛОК 2: СОЗДАНИЕ ВСЕХ ТАБЛИЦ С НУЛЯ В ПРАВИЛЬНОМ ПОРЯДКЕ =====

-- Таблица 1: user_profiles (ОБЯЗАТЕЛЬНА для вашего шаблона)
CREATE TABLE public.user_profiles (
    id uuid NOT NULL PRIMARY KEY,
    username text,
    email text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for users based on user_id" ON public.user_profiles FOR ALL USING (auth.uid() = id);

-- Таблица 2: tasks (основная таблица задач)
CREATE TABLE public.tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NULL,
    deadline date NULL,
    importance text NOT NULL DEFAULT 'medium'::text,
    complexity smallint NOT NULL DEFAULT 3,
    scheduled_date date NULL,
    completed boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);

-- Таблица 3: ai_conversations (для чата с ИИ)
CREATE TABLE public.ai_conversations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message text NOT NULL,
    response text NOT NULL,
    context jsonb NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for own ai_conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);


-- ===== БЛОК 3: СОЗДАНИЕ ВСЕХ ФУНКЦИЙ И ТРИГГЕРОВ С НУЛЯ =====

-- Функция 1: Автоматическое создание профиля пользователя
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email) VALUES (new.id, new.email);
  RETURN new;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Функция 2: ЕДИНАЯ функция для получения шкалы выгорания (надежный метод)
CREATE OR REPLACE FUNCTION get_burnout_scores_for_week(p_week_start date)
RETURNS TABLE (
    day_of_week smallint,
    burnout_score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RAISE NOTICE 'LOG FROM get_burnout_scores_for_week: Called for user % and week start %', auth.uid(), p_week_start; -- ОТЛАДОЧНЫЙ ЛОГ
    RETURN QUERY
    SELECT
        EXTRACT(ISODOW FROM d.day)::smallint as day_of_week,
        COALESCE(
            (SELECT SUM(t.complexity)
             FROM public.tasks t
             WHERE t.user_id = auth.uid()
               AND t.scheduled_date = d.day
               AND t.completed = false),
        0)::double precision AS burnout_score
    FROM generate_series(p_week_start, p_week_start + interval '6 days', interval '1 day') AS d(day);
END;
$$;

-- Функции для ИИ
CREATE OR REPLACE FUNCTION public.create_new_task(p_title text, p_scheduled_date date, p_importance text DEFAULT 'medium', p_complexity integer DEFAULT 3) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE new_task_id uuid; BEGIN INSERT INTO public.tasks (user_id, title, scheduled_date, importance, complexity) VALUES (auth.uid(), p_title, p_scheduled_date, p_importance, p_complexity) RETURNING id INTO new_task_id; RETURN new_task_id; END; $$;
CREATE OR REPLACE FUNCTION public.reschedule_user_task(p_task_id uuid, p_new_date date) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE public.tasks SET scheduled_date = p_new_date, updated_at = now() WHERE id = p_task_id AND user_id = auth.uid(); END; $$;

-- ========= КОНЕЦ СКРИПТА "ЧИСТЫЙ ЛИСТ" =========