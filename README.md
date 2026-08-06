# Міцна Хата — сайт

Сайт розміщується на **Cloudflare Workers (static assets)**. Це НЕ класичний Cloudflare Pages — інша структура репозиторію, тому важливо зберігати папки як є.

Форма заявки надсилає лід трьома каналами:
1. **Email** — через FormSubmit.
2. **Telegram-бот** — через Worker-скрипт `src/worker.js`.
3. **Google Таблиця** — через той самий Worker + Google Apps Script.

Канали 2 і 3 не обов'язкові: без налаштування сайт і форма все одно працюють, заявки просто приходитимуть лише на email.

## Структура репозиторію (обов'язково саме така)
```
wrangler.toml          — конфігурація деплою (яку папку роздавати, де лежить Worker)
src/
  worker.js             — Worker-скрипт: роздає сайт + обробляє /api/submit
public/
  index.html            — сама сторінка
  logo.jpg
  robots.txt
  sitemap.xml
  _headers              — заголовки безпеки
google-apps-script.js   — код для Google Таблиці (НЕ для сайту, вставляється окремо в Google)
```

⚠️ Все, що показується на сайті, лежить у `public/`. Усе, що виконується на сервері — в `src/worker.js`. Не потрібно вручну нічого прописувати в Cloudflare — `wrangler.toml` уже містить всі налаштування.

## Що треба донастроїти вручну

### 1. Email (FormSubmit)
В `public/index.html` вже стоїть `micna.khata@gmail.com` — при першій реальній заявці прийде лист-підтвердження, перейди по посиланню один раз.

### 2. Telegram-бот
1. У Telegram напиши **@BotFather** → `/newbot` → отримаєш токен.
2. Напиши своєму боту будь-яке повідомлення.
3. Дізнайся chat_id: відкрий `https://api.telegram.org/botТВІЙ_ТОКЕН/getUpdates`, знайди `"chat":{"id":XXXXXXXXX`.
4. Cloudflare → проєкт `micna-khata` → **Settings → Variables and secrets** → Add:
   - `TG_BOT_TOKEN` = токен бота
   - `TG_CHAT_ID` = chat_id
5. Зроби новий деплой (Deployments → New deployment, або будь-який коміт на GitHub).

### 3. Google Таблиця
1. Створи Google Таблицю → Extensions → Apps Script.
2. Встав код з `google-apps-script.js`.
3. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
4. Скопіюй виданий URL.
5. Cloudflare → Settings → Variables and secrets → додай `GS_WEBHOOK_URL` = цей URL.
6. Новий деплой.

### 4. Google Ads
У `public/index.html` заміни `AW-XXXXXXXXX`, `YOUR_CONVERSION_LABEL`, `YOUR_PHONE_CONVERSION_LABEL` на реальні значення з Google Ads.

## Деплой
Проєкт уже підключений до GitHub — кожен push у `main` автоматично тригерить `npx wrangler deploy`, який читає `wrangler.toml` і деплоїть і сайт, і Worker разом.


