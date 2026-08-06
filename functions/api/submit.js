// Cloudflare Pages Function: /api/submit
// Приймає дані форми і пересилає їх у Telegram-бот та Google Таблицю.
// Працює незалежно від FormSubmit (email) — якщо ця функція впаде, форма й сайт все одно працюють.

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'bad_json' }), { status: 400 });
  }

  // Проста серверна перевірка honeypot-поля
  if (data['bot-field']) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const name = (data.name || '').toString().slice(0, 200);
  const phone = (data.phone || '').toString().slice(0, 50);
  const message = (data.message || '').toString().slice(0, 1000);

  if (!name || !phone) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_fields' }), { status: 400 });
  }

  const tasks = [];

  // 1. Telegram
  if (env.TG_BOT_TOKEN && env.TG_CHAT_ID) {
    const text =
      '🏗 Нова заявка з сайту Міцна Хата\n\n' +
      `Ім'я: ${name}\n` +
      `Телефон: ${phone}\n` +
      (message ? `Що потрібно: ${message}` : 'Коментар не залишено');

    tasks.push(
      fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text })
      })
    );
  }

  // 2. Google Таблиця (через Google Apps Script Web App)
  if (env.GS_WEBHOOK_URL) {
    tasks.push(
      fetch(env.GS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, message, date: new Date().toISOString() })
      })
    );
  }

  // Виконуємо обидва запити паралельно, не блокуючи одне одним
  const results = await Promise.allSettled(tasks);
  const anyFailed = results.some(r => r.status === 'rejected');

  return new Response(JSON.stringify({ ok: true, partial: anyFailed }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
