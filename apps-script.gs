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

const SHEET_NAME = '預約紀錄'; // 可自行修改分頁名稱

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // 建立標題列
    const headers = ['提交時間', '姓名', '電話/LINE', '服務項目', '希望日期', '希望時段', '備註', '狀態'];
    sheet.appendRow(headers);

    // 格式化標題列
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#B8892A');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');

    // 設定欄寬
    sheet.setColumnWidth(1, 160); // 提交時間
    sheet.setColumnWidth(2, 100); // 姓名
    sheet.setColumnWidth(3, 140); // 電話/LINE
    sheet.setColumnWidth(4, 160); // 服務項目
    sheet.setColumnWidth(5, 110); // 希望日期
    sheet.setColumnWidth(6, 110); // 希望時段
    sheet.setColumnWidth(7, 200); // 備註
    sheet.setColumnWidth(8, 100); // 狀態

    sheet.setFrozenRows(1);
  }
  return sheet;
}

// 接收前端 POST 請求
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    sheet.appendRow([
      data.submittedAt || new Date().toLocaleString('zh-TW'),
      data.name        || '',
      data.contact     || '',
      data.service     || '',
      data.date        || '',
      data.time        || '',
      data.notes       || '',
      '待確認'
    ]);

    // 新增一筆後，將最新列的狀態欄設定下拉選單（可選）
    const lastRow = sheet.getLastRow();
    const statusCell = sheet.getRange(lastRow, 8);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['待確認', '已確認', '已完成', '已取消'])
      .build();
    statusCell.setDataValidation(rule);

    return buildResponse({ success: true, message: '預約成功' });

  } catch (err) {
    return buildResponse({ success: false, error: err.toString() });
  }
}

// 健康檢查（瀏覽器直接開網址時用）
function doGet(e) {
  return ContentService
    .createTextOutput('HY花楹美學預約系統運作中 ✓')
    .setMimeType(ContentService.MimeType.TEXT);
}

function buildResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
