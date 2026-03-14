// ════════════════════════════════════════════════════
//  HY花楹美學 — 預約系統 Google Apps Script
//  使用說明：
//  1. 開啟 Google Sheets，建立新試算表
//  2. 點選「擴充功能」→「Apps Script」
//  3. 將此檔案全部內容貼入編輯器（取代原有內容）
//  4. 點選「部署」→「新增部署作業」
//  5. 類型選「網頁應用程式」
//     執行身分：「我」
//     誰可以存取：「所有人」
//  6. 複製部署後的網址
//  7. 貼回 index.html 的 SCRIPT_URL 變數
// ════════════════════════════════════════════════════

const SHEET_NAME = '預約紀錄';

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = ['提交時間', '姓名', '電話/LINE', '服務項目', '希望日期', '希望時段', '備註', '狀態'];
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#B8892A');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 100);
    sheet.setColumnWidth(3, 140);
    sheet.setColumnWidth(4, 160);
    sheet.setColumnWidth(5, 110);
    sheet.setColumnWidth(6, 110);
    sheet.setColumnWidth(7, 200);
    sheet.setColumnWidth(8, 100);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// 接收前端 GET 請求（使用 URL query parameters，避免 CORS 問題）
function doGet(e) {
  try {
    const p = e.parameter;
    // 健康檢查：沒有 name 參數時回傳 ok
    if (!p.name) {
      return ContentService.createTextOutput('HY花楹美學預約系統運作中 ✓')
        .setMimeType(ContentService.MimeType.TEXT);
    }
    const sheet = getOrCreateSheet();
    sheet.appendRow([
      p.submittedAt || new Date().toLocaleString('zh-TW'),
      p.name    || '',
      p.contact || '',
      p.service || '',
      p.date    || '',
      p.time    || '',
      p.notes   || '',
      '待確認'
    ]);
    const lastRow = sheet.getLastRow();
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['待確認', '已確認', '已完成', '已取消']).build();
    sheet.getRange(lastRow, 8).setDataValidation(rule);
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: '預約成功' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
