/**
 * =====================================================
 * NIKAH SAAS - Google Apps Script Backend
 * Full CRUD untuk Google Sheets
 * =====================================================
 * 
 * SETUP:
 * 1. Buat Google Spreadsheet baru
 * 2. Copy script ini ke Extensions > Apps Script
 * 3. Jalankan fungsi setupSheets() sekali
 * 4. Set Script Properties: ADMIN_PASSWORD = password-rahasia-anda
 * 5. Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy URL Web App ke js/config.js di frontend
 */

// ==================== KONFIGURASI ====================
const SHEET_USERS = 'Users';
const SHEET_INVITATIONS = 'Invitations';
const SHEET_RSVPS = 'RSVPs';
const SHEET_GUESTS = 'Guests'; // untuk link khusus per tamu (opsional)

// ==================== ENTRY POINT ====================
function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    // CORS preflight sederhana
    const action = (e.parameter.action || (e.postData && JSON.parse(e.postData.contents).action) || '').toLowerCase();
    const data = method === 'POST' && e.postData ? JSON.parse(e.postData.contents) : e.parameter;

    let result;

    switch (action) {
      // ---- AUTH ----
      case 'login':
        result = login(data.username, data.password);
        break;
      case 'adminlogin':
        result = adminLogin(data.password);
        break;

      // ---- USERS (Admin) ----
      case 'listusers':
        result = requireAdmin(data.token) || listUsers();
        break;
      case 'createuser':
        result = requireAdmin(data.token) || createUser(data);
        break;
      case 'updateuser':
        result = requireAdmin(data.token) || updateUser(data);
        break;
      case 'deleteuser':
        result = requireAdmin(data.token) || deleteUser(data.username);
        break;

      // ---- INVITATIONS ----
      case 'getinvitation':
        result = getInvitation(data.username);
        break;
      case 'saveinvitation':
        result = requireUser(data.token, data.username) || saveInvitation(data);
        break;
      case 'createinvitation': // dipanggil saat create user
        result = requireAdmin(data.token) || createInvitation(data.username);
        break;

      // ---- RSVP ----
      case 'submitrsvp':
        result = submitRSVP(data);
        break;
      case 'getrsvps':
        result = requireUser(data.token, data.username) || getRSVPs(data.username);
        break;

      // ---- GUEST LINK (opsional Fase lanjut) ----
      case 'createguestlink':
        result = requireUser(data.token, data.username) || createGuestLink(data);
        break;
      case 'getguest':
        result = getGuest(data.code);
        break;

      // ---- UTILITY ----
      case 'ping':
        result = { success: true, message: 'OK', time: new Date().toISOString() };
        break;

      default:
        result = { success: false, error: 'Action tidak dikenal: ' + action };
    }

    output.setContent(JSON.stringify(result));
  } catch (err) {
    output.setContent(JSON.stringify({ success: false, error: err.message || String(err) }));
  }

  return output;
}

// ==================== AUTH ====================
function login(username, password) {
  if (!username || !password) return { success: false, error: 'Username dan password wajib' };

  const sheet = getSheet(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const uIdx = headers.indexOf('username');
  const pIdx = headers.indexOf('password');
  const sIdx = headers.indexOf('status');
  const pkgIdx = headers.indexOf('package');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][uIdx]).toLowerCase() === String(username).toLowerCase()) {
      if (data[i][pIdx] === password) {
        if (data[i][sIdx] !== 'active') {
          return { success: false, error: 'Akun belum aktif / belum bayar' };
        }
        const token = generateToken(username);
        return {
          success: true,
          token: token,
          username: data[i][uIdx],
          package: data[i][pkgIdx] || 'basic'
        };
      }
      return { success: false, error: 'Password salah' };
    }
  }
  return { success: false, error: 'Username tidak ditemukan' };
}

function adminLogin(password) {
  const adminPass = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!adminPass) return { success: false, error: 'ADMIN_PASSWORD belum diset di Script Properties' };
  if (password === adminPass) {
    return { success: true, token: generateToken('__admin__'), role: 'admin' };
  }
  return { success: false, error: 'Password admin salah' };
}

function requireAdmin(token) {
  if (!token || !isValidToken(token, '__admin__')) {
    return { success: false, error: 'Unauthorized - Admin only' };
  }
  return null; // lanjut
}

function requireUser(token, username) {
  if (!token || !isValidToken(token, username)) {
    return { success: false, error: 'Unauthorized - Login dulu' };
  }
  return null;
}

function generateToken(username) {
  const payload = username + '|' + (Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 hari
  return Utilities.base64Encode(payload);
}

function isValidToken(token, expectedUser) {
  try {
    const decoded = Utilities.base64Decode(token);
    const str = Utilities.newBlob(decoded).getDataAsString();
    const parts = str.split('|');
    if (parts.length !== 2) return false;
    const user = parts[0];
    const exp = parseInt(parts[1], 10);
    if (Date.now() > exp) return false;
    if (expectedUser === '__admin__') return user === '__admin__';
    return user.toLowerCase() === String(expectedUser).toLowerCase();
  } catch (e) {
    return false;
  }
}

// ==================== USERS CRUD ====================
function listUsers() {
  const sheet = getSheet(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, users: [] };

  const headers = data[0];
  const users = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, idx) => {
      if (h !== 'password') row[h] = data[i][idx]; // jangan kirim password
    });
    users.push(row);
  }
  return { success: true, users: users };
}

function createUser(data) {
  if (!data.username || !data.password) {
    return { success: false, error: 'username dan password wajib' };
  }
  const username = String(data.username).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
  if (!username) return { success: false, error: 'Username tidak valid' };

  const sheet = getSheet(SHEET_USERS);
  const existing = sheet.getDataRange().getValues();
  const uIdx = existing[0].indexOf('username');
  for (let i = 1; i < existing.length; i++) {
    if (String(existing[i][uIdx]).toLowerCase() === username) {
      return { success: false, error: 'Username sudah dipakai' };
    }
  }

  sheet.appendRow([
    username,
    data.password,
    data.package || 'basic',
    data.status || 'active',
    new Date().toISOString(),
    data.notes || ''
  ]);

  // Buat baris undangan kosong
  createInvitation(username);

  return { success: true, username: username, message: 'User berhasil dibuat' };
}

function updateUser(data) {
  if (!data.username) return { success: false, error: 'username wajib' };
  const sheet = getSheet(SHEET_USERS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const uIdx = headers.indexOf('username');

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][uIdx]).toLowerCase() === String(data.username).toLowerCase()) {
      if (data.password) sheet.getRange(i + 1, headers.indexOf('password') + 1).setValue(data.password);
      if (data.package) sheet.getRange(i + 1, headers.indexOf('package') + 1).setValue(data.package);
      if (data.status) sheet.getRange(i + 1, headers.indexOf('status') + 1).setValue(data.status);
      if (data.notes !== undefined) sheet.getRange(i + 1, headers.indexOf('notes') + 1).setValue(data.notes);
      return { success: true, message: 'User diupdate' };
    }
  }
  return { success: false, error: 'User tidak ditemukan' };
}

function deleteUser(username) {
  if (!username) return { success: false, error: 'username wajib' };
  const sheet = getSheet(SHEET_USERS);
  const values = sheet.getDataRange().getValues();
  const uIdx = values[0].indexOf('username');

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][uIdx]).toLowerCase() === String(username).toLowerCase()) {
      sheet.deleteRow(i + 1);
      // Opsional: hapus juga invitation & rsvp
      return { success: true, message: 'User dihapus' };
    }
  }
  return { success: false, error: 'User tidak ditemukan' };
}

// ==================== INVITATIONS CRUD ====================
function getInvitation(username) {
  if (!username) return { success: false, error: 'username wajib' };
  const sheet = getSheet(SHEET_INVITATIONS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: false, error: 'Undangan tidak ditemukan' };

  const headers = data[0];
  const uIdx = headers.indexOf('username');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][uIdx]).toLowerCase() === String(username).toLowerCase()) {
      const inv = {};
      headers.forEach((h, idx) => {
        let val = data[i][idx];
        // Parse JSON fields
        if (['gallery', 'story', 'rekening', 'custom'].includes(h) && val) {
          try { val = JSON.parse(val); } catch (e) {}
        }
        inv[h] = val;
      });
      return { success: true, invitation: inv };
    }
  }
  return { success: false, error: 'Undangan tidak ditemukan' };
}

function createInvitation(username) {
  const sheet = getSheet(SHEET_INVITATIONS);
  // Cek sudah ada?
  const existing = getInvitation(username);
  if (existing.success) return existing;

  const defaultData = {
    username: username,
    groom: '',
    bride: '',
    wedding_date: '',
    wedding_time: '',
    location: '',
    maps_url: '',
    cover_image: '',
    music_url: '',
    theme: 'classic',
    gallery: '[]',
    story: '[]',
    rekening: '[]',
    custom: '{}',
    streaming_url: '',
    updated_at: new Date().toISOString()
  };

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => defaultData[h] !== undefined ? defaultData[h] : '');
  sheet.appendRow(row);
  return { success: true, message: 'Invitation created' };
}

function saveInvitation(data) {
  if (!data.username) return { success: false, error: 'username wajib' };
  const sheet = getSheet(SHEET_INVITATIONS);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const uIdx = headers.indexOf('username');

  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][uIdx]).toLowerCase() === String(data.username).toLowerCase()) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    createInvitation(data.username);
    return saveInvitation(data); // retry
  }

  // Update kolom yang dikirim
  const updatable = ['groom', 'bride', 'wedding_date', 'wedding_time', 'location', 'maps_url',
    'cover_image', 'music_url', 'theme', 'gallery', 'story', 'rekening', 'custom', 'streaming_url'];

  updatable.forEach(field => {
    if (data[field] !== undefined) {
      const col = headers.indexOf(field) + 1;
      if (col > 0) {
        let val = data[field];
        if (typeof val === 'object') val = JSON.stringify(val);
        sheet.getRange(rowIndex, col).setValue(val);
      }
    }
  });

  // updated_at
  const updCol = headers.indexOf('updated_at') + 1;
  if (updCol > 0) sheet.getRange(rowIndex, updCol).setValue(new Date().toISOString());

  return { success: true, message: 'Undangan berhasil disimpan' };
}

// ==================== RSVP ====================
function submitRSVP(data) {
  if (!data.username || !data.guest_name) {
    return { success: false, error: 'username dan guest_name wajib' };
  }
  const sheet = getSheet(SHEET_RSVPS);
  sheet.appendRow([
    data.username,
    data.guest_name,
    data.attendance || 'hadir',
    data.message || '',
    data.phone || '',
    new Date().toISOString()
  ]);
  return { success: true, message: 'Terima kasih atas konfirmasinya!' };
}

function getRSVPs(username) {
  const sheet = getSheet(SHEET_RSVPS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, rsvps: [] };

  const headers = data[0];
  const uIdx = headers.indexOf('username');
  const rsvps = [];

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][uIdx]).toLowerCase() === String(username).toLowerCase()) {
      const row = {};
      headers.forEach((h, idx) => row[h] = data[i][idx]);
      rsvps.push(row);
    }
  }
  return { success: true, rsvps: rsvps };
}

// ==================== GUEST SPECIAL LINK (opsional) ====================
function createGuestLink(data) {
  // data: username, guest_name
  const code = Utilities.getUuid().substring(0, 8);
  const sheet = getSheet(SHEET_GUESTS);
  sheet.appendRow([
    code,
    data.username,
    data.guest_name,
    new Date().toISOString()
  ]);
  return {
    success: true,
    code: code,
    url: 'https://nikah.silverhawk.web.id/' + data.username + '?kpd=' + encodeURIComponent(data.guest_name)
    // atau nanti: /s/CODE
  };
}

function getGuest(code) {
  const sheet = getSheet(SHEET_GUESTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const cIdx = headers.indexOf('code');
  for (let i = 1; i < data.length; i++) {
    if (data[i][cIdx] === code) {
      return {
        success: true,
        username: data[i][headers.indexOf('username')],
        guest_name: data[i][headers.indexOf('guest_name')]
      };
    }
  }
  return { success: false, error: 'Kode tidak valid' };
}

// ==================== HELPERS ====================

/**
 * Ambil spreadsheet.
 * Prioritas:
 * 1. Script Property SPREADSHEET_ID
 * 2. getActiveSpreadsheet() (jika script dibuka dari dalam Sheet)
 * 3. null → biar setupDatabase() yang membuat baru
 */
function getSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SPREADSHEET_ID');

  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {
      throw new Error('SPREADSHEET_ID tidak valid atau tidak punya akses: ' + e.message);
    }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) {
    props.setProperty('SPREADSHEET_ID', ss.getId());
    return ss;
  }

  return null;
}

function getSheet(name) {
  const ss = getSpreadsheet();
  if (!ss) {
    throw new Error('Database belum dibuat. Jalankan fungsi setupDatabase() satu kali.');
  }
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/**
 * =====================================================
 * FUNGSI UTAMA — jalankan INI sekali dari awal
 * =====================================================
 * Membuat Google Sheet baru secara otomatis (jika belum ada),
 * membuat semua tab yang dibutuhkan, dan menyimpan ID-nya
 * ke Script Properties.
 *
 * Setelah sukses, buka View → Logs untuk melihat URL spreadsheet.
 */
function setupDatabase() {
  const props = PropertiesService.getScriptProperties();
  let ss = getSpreadsheet();
  let createdNew = false;

  if (!ss) {
    // Buat spreadsheet baru otomatis
    ss = SpreadsheetApp.create('Nikah SaaS Database');
    props.setProperty('SPREADSHEET_ID', ss.getId());
    createdNew = true;
  }

  // --- Users ---
  let sh = ss.getSheetByName(SHEET_USERS);
  if (!sh) sh = ss.insertSheet(SHEET_USERS);
  sh.clear();
  sh.appendRow(['username', 'password', 'package', 'status', 'created_at', 'notes']);
  sh.getRange(1, 1, 1, 6).setFontWeight('bold');

  // --- Invitations ---
  sh = ss.getSheetByName(SHEET_INVITATIONS);
  if (!sh) sh = ss.insertSheet(SHEET_INVITATIONS);
  sh.clear();
  sh.appendRow([
    'username', 'groom', 'bride', 'wedding_date', 'wedding_time',
    'location', 'maps_url', 'cover_image', 'music_url', 'theme',
    'gallery', 'story', 'rekening', 'custom', 'streaming_url', 'updated_at'
  ]);
  sh.getRange(1, 1, 1, 16).setFontWeight('bold');

  // --- RSVPs ---
  sh = ss.getSheetByName(SHEET_RSVPS);
  if (!sh) sh = ss.insertSheet(SHEET_RSVPS);
  sh.clear();
  sh.appendRow(['username', 'guest_name', 'attendance', 'message', 'phone', 'created_at']);
  sh.getRange(1, 1, 1, 6).setFontWeight('bold');

  // --- Guests (link khusus) ---
  sh = ss.getSheetByName(SHEET_GUESTS);
  if (!sh) sh = ss.insertSheet(SHEET_GUESTS);
  sh.clear();
  sh.appendRow(['code', 'username', 'guest_name', 'created_at']);
  sh.getRange(1, 1, 1, 4).setFontWeight('bold');

  // Hapus Sheet1 default jika masih ada
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  const url = ss.getUrl();
  const id = ss.getId();

  Logger.log('========================================');
  Logger.log(createdNew ? 'Spreadsheet BARU berhasil dibuat!' : 'Spreadsheet yang sudah ada dipakai ulang.');
  Logger.log('ID  : ' + id);
  Logger.log('URL : ' + url);
  Logger.log('========================================');
  Logger.log('Langkah berikutnya:');
  Logger.log('1. Set ADMIN_PASSWORD (jalankan setAdminPassword setelah ganti password di dalam fungsi)');
  Logger.log('2. Deploy → New deployment → Web app → Anyone');
  Logger.log('3. Copy URL Web App ke js/config.js di frontend');
  Logger.log('========================================');

  return {
    success: true,
    createdNew: createdNew,
    spreadsheetId: id,
    spreadsheetUrl: url,
    message: 'Database siap. Cek log (View → Logs) untuk URL spreadsheet.'
  };
}

/** Alias supaya nama lama tetap jalan */
function setupSheets() {
  return setupDatabase();
}

/**
 * Set password admin.
 * 1. Ganti nilai password di bawah
 * 2. Jalankan fungsi ini sekali
 * 3. Boleh diubah lagi lewat Project Settings → Script Properties
 */
function setAdminPassword() {
  const password = 'ganti-dengan-password-kuat'; // <-- GANTI INI dulu
  if (password === 'ganti-dengan-password-kuat') {
    throw new Error('Ganti dulu nilai password di dalam fungsi setAdminPassword()');
  }
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD', password);
  Logger.log('ADMIN_PASSWORD berhasil diset.');
}
