import Cookies from 'js-cookie';

const TokenKey = 'Admin-Token';
const UserIdKey = 'UserId';

// TOKEN
export function getToken() {
  // Primary storage
  const token = localStorage.getItem(TokenKey);

  if (token) {
    return token;
  }

  // Migrate an existing browser cookie if present
  const cookieToken = Cookies.get(TokenKey);

  if (cookieToken) {
    localStorage.setItem(TokenKey, cookieToken);
    return cookieToken;
  }

  return undefined;
}

export function setToken(token) {
  if (!token) {
    localStorage.removeItem(TokenKey);
    return;
  }

  localStorage.setItem(TokenKey, token);
}

export function removeToken() {
  localStorage.removeItem(TokenKey);
  Cookies.remove(TokenKey);
}

// USER ID
export function getUserId() {
  const userId = localStorage.getItem(UserIdKey);

  if (userId) {
    return userId;
  }

  const cookieUserId = Cookies.get(UserIdKey);

  if (cookieUserId) {
    localStorage.setItem(UserIdKey, cookieUserId);
    return cookieUserId;
  }

  return '';
}

export function setUserId(userid) {
  if (userid == null || userid === '') {
    localStorage.removeItem(UserIdKey);
    return;
  }

  localStorage.setItem(UserIdKey, String(userid));
}

export function removeUserId() {
  localStorage.removeItem(UserIdKey);
  Cookies.remove(UserIdKey);
}
