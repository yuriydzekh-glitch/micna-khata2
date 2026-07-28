# Міцна Хата — сайт

Статичний сайт-візитка (без бекенду). Форма заявки працює через Netlify Forms.

## Структура
- `index.html` — вся сторінка (HTML + CSS + JS в одному файлі)
- `logo.jpg` — логотип, підвантажується напряму сторінкою
- `robots.txt`, `sitemap.xml` — для пошукових систем
- `netlify.toml` — налаштування деплою на Netlify

## Деплой
Сайт деплоїться на Netlify автоматично при кожному push у гілку `main`.

## Що треба донастроїти вручну
- В `index.html` замінити `AW-XXXXXXXXX` на свій Google Ads Conversion ID (5 місць у файлі)
- Замінити `YOUR_CONVERSION_LABEL` і `YOUR_PHONE_CONVERSION_LABEL` на мітки конверсій з Google Ads
- Перевірити заявки: Netlify → Site → Forms (після першого деплою)
