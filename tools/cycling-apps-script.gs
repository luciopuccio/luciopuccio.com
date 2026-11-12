/**
 * Cycling log API — paste into the "Cycling" Google Sheet:
 *   Extensions → Apps Script → replace Code.gs with this file → Save.
 *   Deploy → New deployment → type "Web app"
 *     Execute as: Me      Who has access: Anyone
 *   Copy the Web app URL and store it in Cloudflare as the Worker secret SHEET_API_URL.
 *
 * The URL is long and random, and only the luciopuccio.com Worker knows it.
 * The Worker only calls it for requests that passed Cloudflare Access (you).
 *
 * Sheet layout (Sheet1): A Date | B Distance (mi) | C Time | D Avg Speed (mph) |
 *                        E Cal | F Temp (end, °C) | G Route
 */

const SHEET_NAME = 'Sheet1';
const COLS = 7; // A..G

function sheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function lastDataRow_(sh) {
  const colA = sh.getRange(1, 1, sh.getLastRow() || 1, 1).getDisplayValues();
  for (let i = colA.length - 1; i >= 0; i--) if (String(colA[i][0]).trim() !== '') return i + 1;
  return 1;
}

function readRides_() {
  const sh = sheet_();
  const last = lastDataRow_(sh);
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, COLS).getDisplayValues()
    .filter(r => String(r[0]).trim() !== '')
    .map(r => ({ date: r[0], distance: r[1], time: r[2], speed: r[3], cal: r[4], temp: r[5], route: r[6] }));
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ ok: true, rides: readRides_(), at: new Date().toISOString() });
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'Bad JSON' }); }

  const date = String(d.date || '').trim();             // dd/MM/yyyy
  const distance = Number(d.distance);
  const time = String(d.time || '').trim();             // hh:mm:ss
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return json_({ ok: false, error: 'Date must be dd/mm/yyyy' });
  if (!(distance > 0 && distance < 500)) return json_({ ok: false, error: 'Distance looks wrong' });
  if (time && !/^\d{1,2}:\d{2}:\d{2}$/.test(time)) return json_({ ok: false, error: 'Time must be hh:mm:ss' });
  const num = v => (v === '' || v === null || v === undefined || isNaN(Number(v))) ? '' : Number(v);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_();
    const last = lastDataRow_(sh);
    const target = sh.getRange(last + 1, 1, 1, COLS);
    sh.getRange(last, 1, 1, COLS).copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
    target.setValues([[date, distance, time, num(d.speed), num(d.cal), num(d.temp), String(d.route || '').trim().slice(0, 80)]]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true, rides: readRides_(), at: new Date().toISOString() });
}
