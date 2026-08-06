// Головний Worker-скрипт.
// Усі запити, що НЕ /api/submit, автоматично йдуть на статичні файли з папки public/
// (це відбувається "само собою" — Cloudflare спершу шукає збіг серед статики,
// і тільки якщо не знайшов — віддає керування сюди, в fetch()).

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/submit' && request.method === 'POST') {
      return handleSubmit(request, env);
    }

    // Все інше — звичайні статичні файли сайту
    return env.ASSETS.fetch(request);
  }
};

async function handleSubmit(request, env) {
  let data;
  try {
    data = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'bad_json' }, 400);
  }

  // Проста серверна перевірка honeypot-поля — якщо бот заповнив приховане поле, тихо ігноруємо
  if (data['bot-field']) {
    return json({ ok: true });
  }

  const name = (data.name || '').toString().slice(0, 200);
  const phone = (data.phone || '').toString().slice(0, 50);
  const message = (data.message || '').toString().slice(0, 1000);

  if (!name || !phone) {
    return json({ ok: false, error: 'missing_fields' }, 400);
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

  const results = await Promise.allSettled(tasks);
  const anyFailed = results.some(r => r.status === 'rejected');

  return json({ ok: true, partial: anyFailed });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
