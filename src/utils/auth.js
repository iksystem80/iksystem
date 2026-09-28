import Cookies from 'js-cookie';

const TokenKey = 'Admin-Token';
const UserIdKey = 'UserId';
export function getToken() {
  return Cookies.get(TokenKey);
}

export function setToken(token) {
  return Cookies.set(TokenKey, token);
}
export function removeToken() {
  return Cookies.remove(TokenKey);
}

export function getUserId() {
  return Cookies.get(UserIdKey);
}

export function setUserId(userid) {
  return Cookies.set(UserIdKey, userid);
}
export function removeUserId() {
  return Cookies.remove(UserIdKey);
}
