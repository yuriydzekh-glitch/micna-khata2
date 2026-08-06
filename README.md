# Міцна Хата — сайт

Статичний сайт-візитка. Форма заявки надсилає лід одразу трьома каналами:
1. **Email** — через FormSubmit (без реєстрації, без бекенду).
2. **Telegram-бот** — через Cloudflare Pages Function.
3. **Google Таблиця** — через ту саму функцію + Google Apps Script.

Канали 2 і 3 не обов'язкові: якщо їх не налаштувати, сайт і форма продовжують нормально працювати — просто заявки будуть приходити лише на email.

## Структура
- `index.html` — вся сторінка (HTML + CSS + JS в одному файлі)
- `logo.jpg` — логотип
- `robots.txt`, `sitemap.xml` — для пошукових систем
- `_headers` — заголовки безпеки для Cloudflare Pages
- `functions/api/submit.js` — серверна функція, яка пересилає заявку в Telegram і Google Таблицю
- `google-apps-script.js` — код, який треба вставити в Google Таблицю (не на сайт!)

## Що треба донастроїти вручну

### 1. Email (FormSubmit)
В `index.html` знайди `const FORM_EMAIL = 'FORM_EMAIL@gmail.com';` і встав свою реальну пошту.
Перша реальна заявка прийде з листом-підтвердженням — треба один раз перейти по посиланню в ньому.

### 2. Telegram-бот
1. У Telegram знайди бота **@BotFather** → команда `/newbot` → задай ім'я й нік → отримаєш **токен** (виглядає як `123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`).
2. Напиши своєму новому боту будь-яке повідомлення (просто "привіт") — це обов'язково, інакше бот не зможе тобі писати.
3. Дізнайся свій **chat_id**: відкрий у браузері (заміни TOKEN на свій токен):
   `https://api.telegram.org/botTOKEN/getUpdates`
   У відповіді знайди `"chat":{"id":XXXXXXXXX` — це і є chat_id.
4. У Cloudflare Pages: Project → Settings → Environment variables → додай:
   - `TG_BOT_TOKEN` = токен бота
   - `TG_CHAT_ID` = твій chat_id
5. Заново задеплой сайт (Trigger deploy), щоб змінні підхопились.

### 3. Google Таблиця
1. Створи нову Google Таблицю (sheets.google.com → порожня таблиця).
2. Extensions → Apps Script.
3. Видали весь код-заглушку, встав вміст файлу `google-apps-script.js` з цього проєкту.
4. Deploy → New deployment → тип **Web app** → "Execute as": Me, "Who has access": Anyone.
5. Скопіюй виданий URL (виглядає як `https://script.google.com/macros/s/XXXXX/exec`).
6. У Cloudflare Pages: Environment variables → додай `GS_WEBHOOK_URL` = цей URL.
7. Заново задеплой сайт.

### 4. Google Ads
У `index.html` заміни `AW-XXXXXXXXX`, `YOUR_CONVERSION_LABEL`, `YOUR_PHONE_CONVERSION_LABEL` на реальні значення з Google Ads (5 місць у файлі).

## Деплой на Cloudflare Pages
1. cloudflare.com → Workers & Pages → Create → Pages → Connect to Git → обери репозиторій.
2. Build command — залиш порожнім, Build output directory — `/`.
3. Deploy.
4. Після цього щоразу перевіряй Forms/заявки: Netlify Forms тут не працює — заявки йдуть напряму на email, у Telegram і в Google Таблицю.

