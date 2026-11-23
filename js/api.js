/**
 * API helper ke Google Apps Script
 */
const API = {
  async call(action, payload = {}, method = 'POST') {
    const url = CONFIG.API_URL + (method === 'GET' ? '?action=' + encodeURIComponent(action) + '&' + new URLSearchParams(payload).toString() : '');

    const options = {
      method: method,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Apps Script sering lebih stabil dengan text/plain
      redirect: 'follow'
    };

    if (method === 'POST') {
      options.body = JSON.stringify({ action, ...payload });
    }

    try {
      const res = await fetch(url, options);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Response bukan JSON:', text);
        return { success: false, error: 'Response server tidak valid' };
      }
      return data;
    } catch (err) {
      console.error('API Error:', err);
      return { success: false, error: 'Gagal terhubung ke server: ' + err.message };
    }
  },

  // Auth
  login(username, password) {
    return this.call('login', { username, password });
  },
  adminLogin(password) {
    return this.call('adminlogin', { password });
  },

  // Users (admin)
  listUsers(token) {
    return this.call('listusers', { token });
  },
  createUser(token, data) {
    return this.call('createuser', { token, ...data });
  },
  updateUser(token, data) {
    return this.call('updateuser', { token, ...data });
  },
  deleteUser(token, username) {
    return this.call('deleteuser', { token, username });
  },

  // Invitation
  getInvitation(username) {
    return this.call('getinvitation', { username }, 'GET');
  },
  saveInvitation(token, data) {
    return this.call('saveinvitation', { token, ...data });
  },

  // RSVP
  submitRSVP(data) {
    return this.call('submitrsvp', data);
  },
  getRSVPs(token, username) {
    return this.call('getrsvps', { token, username });
  },

  // Guest link
  createGuestLink(token, data) {
    return this.call('createguestlink', { token, ...data });
  }
};
