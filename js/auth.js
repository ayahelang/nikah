/**
 * Auth helpers (localStorage)
 */
const Auth = {
  // Customer
  saveSession(token, username, packageName) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify({ username, package: packageName }));
  },
  getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
  },
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || 'null');
    } catch (e) {
      return null;
    }
  },
  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },
  logout() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
  },

  // Admin
  saveAdminToken(token) {
    localStorage.setItem(CONFIG.ADMIN_TOKEN_KEY, token);
  },
  getAdminToken() {
    return localStorage.getItem(CONFIG.ADMIN_TOKEN_KEY);
  },
  isAdmin() {
    return !!this.getAdminToken();
  },
  adminLogout() {
    localStorage.removeItem(CONFIG.ADMIN_TOKEN_KEY);
  },

  // Require login redirect
  requireLogin(redirectTo = '/login.html') {
    if (!this.isLoggedIn()) {
      window.location.href = redirectTo + '?next=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    return true;
  },
  requireAdmin(redirectTo = '/admin/') {
    if (!this.isAdmin()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  }
};
