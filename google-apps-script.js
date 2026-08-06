// Цей код треба вставити в Google Apps Script (не в сам сайт!).
// Інструкція встановлення — у README.md, розділ "Google Таблиця".

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  // Якщо це перший запуск і в таблиці ще немає заголовків — додає їх
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Дата', "Ім'я", 'Телефон', 'Повідомлення']);
  }

  sheet.appendRow([
    new Date(data.date || new Date()),
    data.name || '',
    data.phone || '',
    data.message || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
