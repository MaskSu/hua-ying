// ════════════════════════════════════════════════════
//  HY花楹美學 — 預約系統 Google Apps Script
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

// 共用：取得某日已預約（非取消）的時段清單
function getBookedSlots(sheet, date) {
  const tz = Session.getScriptTimeZone();
  const rows = sheet.getDataRange().getValues();
  const booked = [];
  for (let i = 1; i < rows.length; i++) {
    const rowDate   = rows[i][4];
    const rowTime   = rows[i][5];
    const rowStatus = rows[i][7];
    // Sheets 可能把日期字串自動轉成 Date 物件
    const dateStr = rowDate instanceof Date
      ? Utilities.formatDate(rowDate, tz, 'yyyy-MM-dd')
      : String(rowDate);
    // Sheets 也可能把 "18:00" 自動轉成 Date 物件（1899-12-30 18:00:00）
    const timeStr = rowTime instanceof Date
      ? Utilities.formatDate(rowTime, tz, 'HH:mm')
      : String(rowTime);
    if (dateStr === date && rowStatus !== '已取消') {
      booked.push(timeStr);
    }
  }
  return booked;
}

function doGet(e) {
  try {
    const p = e.parameter;

    // ── 查詢某日已預約時段 ──
    if (p.action === 'getSlots') {
      const sheet = getOrCreateSheet();
      const booked = getBookedSlots(sheet, p.date || '');
      return ContentService
        .createTextOutput(JSON.stringify({ booked }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── 健康檢查 ──
    if (!p.name) {
      return ContentService
        .createTextOutput('HY花楹美學預約系統運作中 ✓')
        .setMimeType(ContentService.MimeType.TEXT);
    }

    // ── 寫入新預約（含伺服器端重複時段防護）──
    const sheet = getOrCreateSheet();

    // 週日彈性預約不做時段衝突檢查
    if (p.time !== '週日彈性預約') {
      const booked = getBookedSlots(sheet, p.date || '');
      if (booked.includes(p.time)) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'alreadyBooked',
            message: '此時段已被預約，請選擇其他時段'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

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
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: '預約成功' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
