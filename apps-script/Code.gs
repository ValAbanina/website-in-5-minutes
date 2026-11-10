/**
 * Website in 5 minutes · anonymous stats
 *
 * Setup (5 minutes):
 * 1. Create a Google Sheet. Extensions > Apps Script. Paste this file.
 * 2. Deploy > New deployment > Web app.
 *      Execute as: Me.   Who has access: Anyone.
 * 3. Copy the Web app URL into config.js in the game (STATS_URL).
 *    The URL is safe to be public: it can only append rows.
 *
 * The game sends: POST text/plain body = JSON {event, ...fields}
 * (text/plain avoids a CORS preflight, which Apps Script cannot answer).
 * No names, emails or personal data are ever sent.
 */
const ALLOWED = ['game_started', 'client_picked', 'choice_changed', 'section_changed', 'website_sent', 'program_clicked', 'shared'];
const COLUMNS = ['received_at', 'event', 'session', 'device', 'client', 'category', 'value', 'action', 'section', 'layout', 'columns', 'score', 'outcome', 'time_left', 'auto_sent', 'deal_breakers', 'program', 'target', 'method'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    if (!ALLOWED.includes(data.event)) return out({ ok: false, error: 'unknown event' });
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('events') || SpreadsheetApp.getActiveSpreadsheet().insertSheet('events');
    if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
    const row = COLUMNS.map(c => c === 'received_at' ? new Date() : (data[camel(c)] ?? data[c] ?? ''));
    sheet.appendRow(row.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v).slice(0, 200)));
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function camel(s) { return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); }
function out(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
