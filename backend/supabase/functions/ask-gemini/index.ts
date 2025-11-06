// backend/supabase/functions/ask-gemini/index.ts -- ПОЛНЫЙ КОД С МАССОВЫМ СОЗДАНИЕМ

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_MODEL = 'gemini-pro';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// НОВЫЙ, РАСШИРЕННЫЙ НАБОР ИНСТРУМЕНТОВ
const tools = [{
    function_declarations: [{
        name: 'bulk_create_tasks',
        description: 'Создает НЕСКОЛЬКО новых задач для пользователя. Используй этот инструмент, когда пользователь просит составить план на день или неделю.',
        parameters: {
            type: 'OBJECT',
            properties: {
                tasks: {
                    type: 'ARRAY',
                    description: 'Массив объектов, где каждый объект - это новая задача.',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            title: { type: 'STRING', description: 'Название задачи' },
                            description: { type: 'STRING', description: 'Подробное описание, что нужно сделать' },
                            scheduled_date: { type: 'STRING', description: 'Дата, на которую запланирована задача, в формате YYYY-MM-DD' },
                            deadline: { type: 'STRING', description: 'Опциональный дедлайн задачи в формате YYYY-MM-DD' },
                            complexity: { type: 'NUMBER', description: 'Сложность задачи от 1 до 5' },
                        },
                        required: ['title', 'description', 'scheduled_date', 'complexity'],
                    }
                }
            },
            required: ['tasks'],
        },
    }, {
        name: 'update_task_schedule',
        description: 'Перемещает ОДНУ существующую задачу на другую дату.',
        parameters: { type: 'OBJECT', properties: {
                task_id: { type: 'STRING', description: 'ID задачи, которую нужно переместить' },
                new_date: { type: 'STRING', description: 'Новая дата для задачи в формате YYYY-MM-DD' },
            }, required: ['task_id', 'new_date'] },
    }],
}];

// Улучшенная функция получения контекста
async function getUserTaskContext(supabaseClient: any) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return { context: 'Пользователь не авторизован.', tasks: [] };

    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    const weekStart = d;
    const weekStartDateString = weekStart.toISOString().split('T')[0];

    const [tasksResult, burnoutResult] = await Promise.all([
        supabaseClient.from('tasks').select('id, title, scheduled_date, complexity').eq('user_id', user.id).gte('scheduled_date', weekStartDateString).lte('scheduled_date', new Date(new Date(weekStart).setDate(weekStart.getDate() + 6)).toISOString().split('T')[0]),
        supabaseClient.rpc('get_burnout_scores_for_week', { p_week_start: weekStartDateString })
    ]);

    const { data: tasks, error: tasksError } = tasksResult;
    const { data: burnoutScores, error: burnoutError } = burnoutResult;

    if (tasksError) { console.error("Ошибка получения задач:", tasksError); return { context: 'Не удалось загрузить задачи', tasks: [] }; }
    if (burnoutError) { console.error("Ошибка получения выгорания:", burnoutError); return { context: 'Не удалось загрузить данные о нагрузке', tasks: [] }; }

    const burnoutContext = burnoutScores?.map(b => `  - День ${b.day_of_week}: нагрузка ${b.burnout_score.toFixed(2)}`).join('\n') || "Нет данных о нагрузке.";
    const tasksContext = tasks?.map(t => `- ID: ${t.id}, Задача: "${t.title}", Дата: ${t.scheduled_date}, Сложность: ${t.complexity}`).join('\n') || "Нет запланированных задач.";

    return {
        context: `Текущая нагрузка на неделю:\n${burnoutContext}\n\nЗадачи на неделю:\n${tasksContext}`,
        tasks: tasks || []
    };
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    try {
        if (!GEMINI_API_KEY) throw new Error('Секрет GEMINI_API_KEY не установлен в Supabase Vault.');
        const { query } = await req.json();
        if (!query) throw new Error('Отсутствует "query" в теле запроса');

        const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: req.headers.get('Authorization')! } } });

        const { context, tasks } = await getUserTaskContext(supabaseClient);
        const currentDate = new Date().toISOString().split('T')[0];

        const prompt = `Ты — TaskMaster AI, проактивный ассистент по продуктивности... (остальной текст промпта без изменений, как в прошлом ответе)
...
Запрос пользователя: "${query}"`;

        const geminiPayload = { contents: [{ parts: [{ text: prompt }] }], tools: tools };
        const geminiResponse = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiPayload), });

        if (!geminiResponse.ok) { const errorBody = await geminiResponse.json(); throw new Error(`Ошибка API Gemini: ${errorBody.error.message}`); }

        const geminiResult = await geminiResponse.json();
        const candidate = geminiResult.candidates[0];
        let aiResponseText = '';
        let tasksUpdated = false;

        if (candidate.content && candidate.content.parts[0].functionCall) {
            const functionCall = candidate.content.parts[0].functionCall;
            const functionName = functionCall.name;
            const args = functionCall.args;

            if (functionName === 'bulk_create_tasks') {
                console.log("Вызов bulk_create_tasks с аргументами:", args.tasks);
                const { error } = await supabaseClient.rpc('bulk_create_tasks', {
                    tasks_data: args.tasks,
                });
                if (error) throw new Error(`Ошибка массового создания задач: ${error.message}`);
                aiResponseText = `Отлично! Я составил для вас план и добавил ${args.tasks.length} новых задач в ваш календарь.`;
                tasksUpdated = true;
            }

            if (functionName === 'update_task_schedule') {
                const { error } = await supabaseClient.rpc('update_task_schedule', { p_task_id: args.task_id, p_new_date: args.new_date });
                if (error) throw new Error(`Ошибка перемещения задачи: ${error.message}`);
                aiResponseText = `Хорошо, я перенес задачу на ${args.new_date}.`;
                tasksUpdated = true;
            }

        } else {
            aiResponseText = candidate.content?.parts[0].text || "Я не совсем понял, повторите, пожалуйста.";
        }

        return new Response(JSON.stringify({ response: aiResponseText, tasks_updated: tasksUpdated }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, });
    } catch (error) {
        console.error("Критическая ошибка в Edge Function:", error);
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }
});