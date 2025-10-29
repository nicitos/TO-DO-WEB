// backend/supabase/functions/ask-gemini/index.ts -- ПОЛНЫЙ ФИНАЛЬНЫЙ КОД

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Используем модель, которая точно доступна для ключа из AI Studio
const GEMINI_MODEL = 'gemini-pro'; 
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const tools = [{
    function_declarations: [{
        name: 'create_task',
        description: 'Создает новую задачу для пользователя',
        parameters: { type: 'OBJECT', properties: { title: { type: 'STRING', description: 'Название задачи' }, scheduled_date: { type: 'STRING', description: 'Дата, на которую нужно запланировать задачу, в формате YYYY-MM-DD' } }, required: ['title', 'scheduled_date'] },
    }, {
        name: 'reschedule_task',
        description: 'Перемещает существующую задачу на другую дату, находя ее по названию',
        parameters: { type: 'OBJECT', properties: { task_title: { type: 'STRING', description: 'Название или ключевые слова из названия задачи' }, new_date: { type: 'STRING', description: 'Новая дата для задачи в формате YYYY-MM-DD' } }, required: ['task_title', 'new_date'] },
    }],
}];

async function getUserTaskContext(supabaseClient: any) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return { context: 'Пользователь не авторизован.', tasks: [] };
    const today = new Date(); const weekStart = new Date(today); weekStart.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    const { data: tasks, error } = await supabaseClient.from('tasks').select('id, title, scheduled_date').eq('user_id', user.id).gte('scheduled_date', weekStart.toISOString().split('T')[0]).lte('scheduled_date', weekEnd.toISOString().split('T')[0]);
    if (error) { console.error('Ошибка получения задач:', error); return { context: 'Не удалось загрузить данные о задачах.', tasks: [] }; }
    if (!tasks || tasks.length === 0) return { context: 'У пользователя нет запланированных задач на эту неделю.', tasks: [] };
    const taskStrings = tasks.map(t => `- ID: ${t.id}, Задача: "${t.title}", Дата: ${t.scheduled_date || 'не указана'}`).join('\n');
    return { context: `Вот список задач пользователя на текущую неделю:\n${taskStrings}`, tasks: tasks };
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
        const prompt = `Ты — TaskMaster AI, дружелюбный и умный ассистент по продуктивности. Твоя цель — помогать пользователям управлять задачами. Анализируй запрос пользователя и решай, нужно ли вызвать одну из твоих функций. Если пользователь просит переместить задачу, найди ее ID в предоставленном контексте по названию. Если сомневаешься, уточни у пользователя. Сегодняшняя дата: ${currentDate}.\nКонтекст по задачам пользователя:\n${context}\nВопрос пользователя: "${query}"`;
        const geminiPayload = { contents: [{ parts: [{ text: prompt }] }], tools: tools, };
        const geminiResponse = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiPayload), });
        if (!geminiResponse.ok) { const errorBody = await geminiResponse.json(); throw new Error(`Ошибка API Gemini: ${errorBody.error.message}`); }
        const geminiResult = await geminiResponse.json();
        const candidate = geminiResult.candidates[0];
        let aiResponseText = ''; let tasksUpdated = false;

        if (candidate.content && candidate.content.parts[0].functionCall) {
            const { name: functionName, args } = candidate.content.parts[0].functionCall;
            if (functionName === 'create_task') {
                const { error } = await supabaseClient.rpc('create_new_task', { p_title: args.title, p_scheduled_date: args.scheduled_date });
                if (error) throw new Error(`Ошибка создания задачи: ${error.message}`);
                aiResponseText = `Готово! Я создал задачу "${args.title}" на ${args.scheduled_date}.`;
                tasksUpdated = true;
            }
            if (functionName === 'reschedule_task') {
                const foundTask = tasks.find(t => t.title.toLowerCase().includes(args.task_title.toLowerCase()));
                if (!foundTask) {
                    aiResponseText = `Я не смог найти задачу с названием, похожим на "${args.task_title}". Пожалуйста, уточните.`;
                } else {
                    const { error } = await supabaseClient.rpc('reschedule_user_task', { p_task_id: foundTask.id, p_new_date: args.new_date });
                    if (error) throw new Error(`Ошибка перемещения задачи: ${error.message}`);
                    aiResponseText = `Хорошо, я перенес задачу "${foundTask.title}" на ${args.new_date}.`;
                    tasksUpdated = true;
                }
            }
        } else {
            aiResponseText = candidate.content.parts[0].text;
        }
        return new Response(JSON.stringify({ response: aiResponseText, tasks_updated: tasksUpdated }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
    }
});