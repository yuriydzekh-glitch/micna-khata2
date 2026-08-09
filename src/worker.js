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
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const text =
      '🏗 Нова заявка з сайту Міцна Хата\n\n' +
      `Ім'я: ${name}\n` +
      `Телефон: ${phone}\n` +
      (message ? `Що потрібно: ${message}` : 'Коментар не залишено');

    tasks.push(
      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text })
      })
    );
  }

  // 2. Google Таблиця (через Google Apps Script Web App)
  if (env.GS_WEBHOOK_URL) {
    tasks.push(postToGoogleSheets(env.GS_WEBHOOK_URL, { name, phone, message, date: new Date().toISOString() }));
  }

  const results = await Promise.allSettled(tasks);
  const anyFailed = results.some(r => r.status === 'rejected');

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`task ${i} status:`, r.value.status);
    } else {
      console.log(`task ${i} failed:`, r.reason);
    }
  });

  return json({ ok: true, partial: anyFailed });
}

// Google Apps Script Web App завжди відповідає на POST редиректом (302) на службову адресу
// виконання скрипта. Стандартний fetch() при такому редиректі перетворює POST на GET
// і губить тіло запиту — тому редирект обробляємо вручну й повторюємо POST з тими самими даними.
async function postToGoogleSheets(url, payload) {
  const body = JSON.stringify(payload);
  const headers = { 'Content-Type': 'application/json' };

  let res = await fetch(url, { method: 'POST', headers, body, redirect: 'manual' });

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('Location');
    if (location) {
      res = await fetch(location, { method: 'POST', headers, body, redirect: 'follow' });
    }
  }

  return res;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
